"use server";

import { db } from "@/lib/db";
import { quotations } from "@/lib/db/schema";
import { parseDate, parseNumber } from "@/lib/format";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type QuotationInput = {
  clientId: number;
  title: string;
  description?: string;
  value?: string;
  status?: string;
  validUntil?: string;
  notes?: string;
};

function mapQuotationInput(input: QuotationInput) {
  return {
    clientId: input.clientId,
    title: input.title,
    description: input.description ?? "",
    value: String(parseNumber(input.value)),
    status: input.status ?? "Rascunho",
    validUntil: parseDate(input.validUntil ?? ""),
    notes: input.notes ?? "",
    updatedAt: new Date(),
  };
}

function revalidateClientPaths(clientSlug?: string) {
  revalidatePath("/atendimento");
  if (clientSlug) revalidatePath(`/atendimento/clientes/${clientSlug}`);
}

export async function createQuotation(input: QuotationInput, clientSlug?: string) {
  const [row] = await db.insert(quotations).values(mapQuotationInput(input)).returning();
  revalidateClientPaths(clientSlug);
  return row;
}

export async function updateQuotation(id: number, input: QuotationInput, clientSlug?: string) {
  await db.update(quotations).set(mapQuotationInput(input)).where(eq(quotations.id, id));
  revalidateClientPaths(clientSlug);
  revalidatePath(`/atendimento/cotacoes/${id}`);
}

export async function deleteQuotation(id: number, clientSlug?: string) {
  await db.delete(quotations).where(eq(quotations.id, id));
  revalidateClientPaths(clientSlug);
}

export async function getQuotationsByClient(clientId: number) {
  return db.query.quotations.findMany({
    where: eq(quotations.clientId, clientId),
    orderBy: [desc(quotations.createdAt)],
  });
}

export async function getQuotationById(id: number) {
  return db.query.quotations.findFirst({ where: eq(quotations.id, id) });
}
