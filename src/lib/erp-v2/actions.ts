"use server";

import { db } from "@/lib/db";
import {
  financialEntries,
  financialEntryHistory,
  projectCompositionLines,
  projectCompositions,
  projects,
} from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { applyNegotiatedPrice, sumByType, toNumericString } from "./composition";
import type { CompositionLineDraft } from "./proposal-conversion";

export async function saveProjectComposition(input: {
  projectId: number;
  proposalId?: number | null;
  lines: CompositionLineDraft[];
  suggestedPrice: number;
  negotiatedPrice: number;
  discountAmount: number;
  discountPercent: number;
  discountReason?: string;
  createdBy?: string;
}) {
  const totals = applyNegotiatedPrice(
    sumByType(input.lines),
    input.negotiatedPrice
  );

  const [composition] = await db
    .insert(projectCompositions)
    .values({
      projectId: input.projectId,
      proposalId: input.proposalId ?? null,
      infraTotal: toNumericString(totals.infraTotal),
      laborTotal: toNumericString(totals.laborTotal),
      exclusiveTotal: toNumericString(totals.exclusiveTotal),
      suggestedPrice: toNumericString(input.suggestedPrice),
      negotiatedPrice: toNumericString(totals.negotiatedPrice),
      discountAmount: toNumericString(totals.discountAmount),
      discountPercent: toNumericString(totals.discountPercent),
      discountReason: input.discountReason ?? "",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: projectCompositions.projectId,
      set: {
        proposalId: input.proposalId ?? null,
        infraTotal: toNumericString(totals.infraTotal),
        laborTotal: toNumericString(totals.laborTotal),
        exclusiveTotal: toNumericString(totals.exclusiveTotal),
        suggestedPrice: toNumericString(input.suggestedPrice),
        negotiatedPrice: toNumericString(totals.negotiatedPrice),
        discountAmount: toNumericString(totals.discountAmount),
        discountPercent: toNumericString(totals.discountPercent),
        discountReason: input.discountReason ?? "",
        updatedAt: new Date(),
      },
    })
    .returning();

  await db
    .delete(projectCompositionLines)
    .where(eq(projectCompositionLines.compositionId, composition.id));

  if (input.lines.length > 0) {
    await db.insert(projectCompositionLines).values(
      input.lines.map((line, i) => ({
        compositionId: composition.id,
        lineType: line.lineType,
        catalogId: line.catalogId ?? null,
        label: line.label,
        compositionValue: toNumericString(line.compositionValue),
        companyCost: line.companyCost != null ? toNumericString(line.companyCost) : null,
        sortOrder: i,
      }))
    );
  }

  await db
    .update(projects)
    .set({
      suggestedPrice: toNumericString(input.suggestedPrice),
      negotiatedPrice: toNumericString(totals.negotiatedPrice),
      discountAmount: toNumericString(totals.discountAmount),
      discountReason: input.discountReason ?? "",
      contractedRevenue: toNumericString(totals.negotiatedPrice),
      proposalId: input.proposalId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, input.projectId));

  return composition;
}

export async function createReceivableEntry(input: {
  description: string;
  amount: number;
  projectId: number;
  clientId: number;
  originType: string;
  originId?: number | null;
  category?: string;
  costType?: string;
  recurrence?: string;
  dueDate?: Date | null;
  notes?: string;
  createdBy?: string;
}) {
  const amount = toNumericString(input.amount);
  const [entry] = await db
    .insert(financialEntries)
    .values({
      entryType: "receber",
      originType: input.originType,
      originId: input.originId ?? null,
      description: input.description,
      originalAmount: amount,
      paidAmount: "0",
      status: "Pendente",
      dueDate: input.dueDate ?? null,
      clientId: input.clientId,
      projectId: input.projectId,
      category: input.category ?? "Receita Contratada",
      costType: input.costType ?? "Mão de Obra",
      recurrence: input.recurrence ?? "Pagamento único",
      notes: input.notes ?? "",
      createdBy: input.createdBy ?? "",
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(financialEntryHistory).values({
    entryId: entry.id,
    eventType: "criacao",
    amount,
    note: "Conta a receber gerada automaticamente",
    createdBy: input.createdBy ?? "",
    snapshot: JSON.stringify({ originType: input.originType, originId: input.originId }),
  });

  return entry;
}

export async function getProjectComposition(projectId: number) {
  const [composition] = await db
    .select()
    .from(projectCompositions)
    .where(eq(projectCompositions.projectId, projectId))
    .limit(1);

  if (!composition) return null;

  const lines = await db
    .select()
    .from(projectCompositionLines)
    .where(eq(projectCompositionLines.compositionId, composition.id))
    .orderBy(asc(projectCompositionLines.sortOrder), asc(projectCompositionLines.id));

  return { composition, lines };
}

export async function getProjectReceivableEntries(projectId: number) {
  return db.query.financialEntries.findMany({
    where: and(
      eq(financialEntries.projectId, projectId),
      eq(financialEntries.entryType, "receber")
    ),
    orderBy: (e, { asc }) => [asc(e.dueDate), asc(e.id)],
  });
}
