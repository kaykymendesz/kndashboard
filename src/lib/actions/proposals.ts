"use server";

import { db } from "@/lib/db";
import {
  commercialProposals,
  proposalExports,
  proposalGuaranteeCatalog,
  proposalServiceCatalog,
  proposalTemplates,
  proposalVersions,
  clients,
  scheduleItems,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { parseDate, parseNumber } from "@/lib/format";
import { applyProposalCalculations } from "@/lib/proposals/calculations";
import { proposalToForm, formToDocumentData } from "@/lib/proposals/mapper";
import type { ProposalFormData } from "@/lib/proposals/types";
import { createClient } from "@/lib/actions/clients";
import { createClientProject } from "@/lib/actions/projects";
import { createActivity } from "@/lib/actions/activities";
import { desc, eq, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ensureProposalsSchema } from "@/lib/proposals/ensure-schema";
import { ensureErpV2Schema } from "@/lib/erp-v2/ensure-schema";
import {
  buildCompositionFromProposal,
  buildInstallmentsFromProposal,
} from "@/lib/erp-v2/proposal-conversion";
import { createReceivableEntry, saveProjectComposition } from "@/lib/erp-v2/actions";

async function currentUserLabel() {
  const session = await auth();
  return session?.user?.name ?? session?.user?.email ?? "Sistema";
}

export async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KN-${year}-`;
  const rows = await db
    .select({ proposalNumber: commercialProposals.proposalNumber })
    .from(commercialProposals)
    .where(like(commercialProposals.proposalNumber, `${prefix}%`));

  let maxSeq = 0;
  for (const row of rows) {
    const match = row.proposalNumber.match(/-(\d+)$/);
    if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
  }
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

function mapFormToRow(form: ProposalFormData, proposalNumber: string, createdBy: string) {
  const calculated = applyProposalCalculations(form);
  return {
    templateId: form.templateId ?? null,
    status: calculated.status,
    clientId: form.clientId ?? null,
    clientName: calculated.clientName,
    clientCompany: calculated.clientCompany,
    clientDocument: calculated.clientDocument,
    clientResponsible: calculated.clientResponsible,
    clientEmail: calculated.clientEmail,
    clientPhone: calculated.clientPhone,
    projectName: calculated.projectName,
    serviceType: calculated.serviceType,
    category: calculated.category,
    projectObjective: calculated.projectObjective,
    description: calculated.description,
    includedItems: calculated.includedItems,
    devValue: String(parseNumber(calculated.devValue)),
    monthlyValue: String(parseNumber(calculated.monthlyValue)),
    domainValue: String(parseNumber(calculated.domainValue)),
    hostingValue: String(parseNumber(calculated.hostingValue)),
    sslValue: String(parseNumber(calculated.sslValue)),
    additionalValue: String(parseNumber(calculated.additionalValue)),
    discountValue: String(parseNumber(calculated.discountValue)),
    totalValue: String(parseNumber(calculated.totalValue)),
    paymentMethods: JSON.stringify(calculated.paymentMethods),
    installments: parseInt(calculated.installments, 10) || 1,
    downPayment: String(parseNumber(calculated.downPayment)),
    installmentValue: String(parseNumber(calculated.installmentValue)),
    paymentNotes: calculated.paymentNotes,
    validityDays: parseInt(calculated.validityDays, 10) || 60,
    issuedAt: parseDate(calculated.issuedAt),
    validUntil: parseDate(calculated.validUntil),
    deliveryDeadline: calculated.deliveryDeadline,
    city: calculated.city,
    observations: calculated.observations,
    selectedServices: JSON.stringify(calculated.selectedServices),
    selectedGuarantees: JSON.stringify(calculated.selectedGuarantees),
    customLayout: form.customLayout ?? "{}",
    createdBy,
    updatedAt: new Date(),
  };
}

async function saveVersion(proposalId: number, versionNumber: number, form: ProposalFormData, note: string) {
  const createdBy = await currentUserLabel();
  await db.insert(proposalVersions).values({
    proposalId,
    versionNumber,
    snapshot: JSON.stringify(form),
    changeNote: note,
    createdBy,
  });
}

function revalidateProposalPaths() {
  revalidatePath("/propostas");
  revalidatePath("/gestao");
  revalidatePath("/clientes");
}

export async function getProposals() {
  await ensureProposalsSchema();
  return db.query.commercialProposals.findMany({
    orderBy: [desc(commercialProposals.createdAt)],
  });
}

export async function getProposalById(id: number) {
  await ensureProposalsSchema();
  return db.query.commercialProposals.findFirst({
    where: eq(commercialProposals.id, id),
  });
}

export async function getProposalVersions(proposalId: number) {
  return db.query.proposalVersions.findMany({
    where: eq(proposalVersions.proposalId, proposalId),
    orderBy: [desc(proposalVersions.versionNumber)],
  });
}

export async function getProposalExports(proposalId: number) {
  return db.query.proposalExports.findMany({
    where: eq(proposalExports.proposalId, proposalId),
    orderBy: [desc(proposalExports.createdAt)],
  });
}

export async function getDefaultProposalTemplate() {
  return (
    (await db.query.proposalTemplates.findFirst({
      where: eq(proposalTemplates.isDefault, true),
    })) ??
    (await db.query.proposalTemplates.findFirst())
  );
}

export async function createProposal(form: ProposalFormData) {
  await ensureProposalsSchema();
  const createdBy = await currentUserLabel();
  const proposalNumber = await generateProposalNumber();
  const template = await getDefaultProposalTemplate();
  const row = mapFormToRow(
    { ...form, templateId: form.templateId ?? template?.id ?? null },
    proposalNumber,
    createdBy
  );

  const [created] = await db
    .insert(commercialProposals)
    .values({ ...row, proposalNumber, version: 1 })
    .returning();

  await saveVersion(created.id, 1, proposalToForm(created), "Criação da proposta");
  revalidateProposalPaths();
  return created;
}

export async function updateProposal(id: number, form: ProposalFormData, changeNote = "Atualização") {
  const existing = await getProposalById(id);
  if (!existing) throw new Error("Proposta não encontrada");

  const createdBy = await currentUserLabel();
  const nextVersion = (existing.version ?? 1) + 1;
  const row = mapFormToRow(form, existing.proposalNumber, createdBy);

  const [updated] = await db
    .update(commercialProposals)
    .set({ ...row, version: nextVersion })
    .where(eq(commercialProposals.id, id))
    .returning();

  await saveVersion(id, nextVersion, proposalToForm(updated), changeNote);
  revalidateProposalPaths();
  return updated;
}

export async function updateProposalStatus(id: number, status: string) {
  const existing = await getProposalById(id);
  if (!existing) throw new Error("Proposta não encontrada");

  const form = proposalToForm(existing);
  form.status = status;
  return updateProposal(id, form, `Status alterado para ${status}`);
}

export async function deleteProposal(id: number) {
  await db.delete(commercialProposals).where(eq(commercialProposals.id, id));
  revalidateProposalPaths();
}

export async function logProposalExport(proposalId: number, format: "pdf" | "docx") {
  const proposal = await getProposalById(proposalId);
  if (!proposal) return;
  const createdBy = await currentUserLabel();
  await db.insert(proposalExports).values({
    proposalId,
    format,
    versionNumber: proposal.version ?? 1,
    createdBy,
  });
}

const DEFAULT_SCHEDULE_STAGES = [
  "Briefing",
  "Planejamento",
  "Design",
  "Desenvolvimento",
  "Testes",
  "Homologação",
  "Publicação",
  "Entrega",
  "Suporte",
];

const DEFAULT_PROJECT_TASKS = [
  "Reunião inicial",
  "Receber identidade visual",
  "Receber logotipo",
  "Receber textos",
  "Receber imagens",
  "Aprovação do layout",
  "Desenvolvimento",
  "Testes",
  "Entrega",
];

export async function convertProposalToProject(proposalId: number) {
  await ensureProposalsSchema();
  await ensureErpV2Schema();

  const proposal = await getProposalById(proposalId);
  if (!proposal) throw new Error("Proposta não encontrada");
  if (proposal.projectId) {
    return { projectId: proposal.projectId, alreadyExists: true };
  }

  const createdBy = await currentUserLabel();
  const compositionDraft = buildCompositionFromProposal(proposal);

  let clientId = proposal.clientId;
  if (!clientId) {
    const name = proposal.clientName || proposal.clientCompany || "Cliente";
    await createClient({
      name,
      company: proposal.clientCompany ?? "",
      email: proposal.clientEmail ?? "",
      phone: proposal.clientPhone ?? "",
      contractValue: String(compositionDraft.negotiatedPrice),
      notes: `Criado a partir da proposta ${proposal.proposalNumber}`,
    });
    const createdClients = await db.query.clients.findMany({
      where: eq(clients.name, name),
      orderBy: [desc(clients.createdAt)],
      limit: 1,
    });
    const client = createdClients[0];
    clientId = client?.id ?? null;
  }

  if (!clientId) throw new Error("Não foi possível criar o cliente");

  const project = await createClientProject({
    clientId,
    name: proposal.projectName || `Projeto ${proposal.proposalNumber}`,
    status: "Em desenvolvimento",
    description: proposal.description ?? proposal.projectObjective ?? "",
    contractedRevenue: String(compositionDraft.negotiatedPrice),
    notes: `Origem: proposta ${proposal.proposalNumber}`,
  });

  await saveProjectComposition({
    projectId: project.id,
    proposalId: proposal.id,
    lines: compositionDraft.lines,
    suggestedPrice: compositionDraft.suggestedPrice,
    negotiatedPrice: compositionDraft.negotiatedPrice,
    discountAmount: compositionDraft.discountAmount,
    discountPercent: compositionDraft.discountPercent,
    discountReason: compositionDraft.discountReason,
    createdBy,
  });

  const installments = buildInstallmentsFromProposal(proposal);
  for (const item of installments) {
    await createReceivableEntry({
      description: item.description,
      amount: item.amount,
      projectId: project.id,
      clientId,
      originType: "proposta",
      originId: proposal.id,
      category: item.category,
      costType: item.category === "Mensalidade" ? "Infraestrutura" : "Mão de Obra",
      recurrence: item.recurrence,
      notes: proposal.paymentNotes ?? "",
      createdBy,
    });
  }

  for (const title of DEFAULT_SCHEDULE_STAGES) {
    await db.insert(scheduleItems).values({
      projectId: project.id,
      title,
      description: `Etapa inicial — ${proposal.proposalNumber}`,
      category: "Cronograma",
      status: title === "Briefing" ? "Em andamento" : "Planejado",
      priority: "Média",
      hasCost: false,
    });
  }

  for (let i = 0; i < DEFAULT_PROJECT_TASKS.length; i++) {
    await createActivity({
      externalId: `P${proposalId}-${i + 1}`,
      area: "Projeto",
      feature: DEFAULT_PROJECT_TASKS[i],
      description: proposal.projectName ?? "",
      status: i === 0 ? "Em andamento" : "Pendente",
      priority: "Média",
      projectId: project.id,
      responsible: proposal.clientResponsible ?? "",
    });
  }

  await db
    .update(commercialProposals)
    .set({
      projectId: project.id,
      clientId,
      status: "Aprovada",
      updatedAt: new Date(),
    })
    .where(eq(commercialProposals.id, proposalId));

  revalidateProposalPaths();
  revalidatePath("/projetos");
  revalidatePath("/cronograma");
  revalidatePath("/financeiro");
  revalidatePath("/lucro");

  return { projectId: project.id, projectSlug: project.slug, alreadyExists: false };
}

export async function getProposalDocumentData(id: number) {
  const proposal = await getProposalById(id);
  if (!proposal) return null;
  return formToDocumentData(proposalToForm(proposal), proposal.proposalNumber);
}

export async function getServiceCatalog() {
  await ensureProposalsSchema();
  return db.query.proposalServiceCatalog.findMany({
    where: eq(proposalServiceCatalog.active, true),
    orderBy: [proposalServiceCatalog.sortOrder, proposalServiceCatalog.name],
  });
}

export async function getGuaranteeCatalog() {
  await ensureProposalsSchema();
  return db.query.proposalGuaranteeCatalog.findMany({
    where: eq(proposalGuaranteeCatalog.active, true),
    orderBy: [proposalGuaranteeCatalog.sortOrder, proposalGuaranteeCatalog.name],
  });
}

export async function getProposalStats() {
  const rows = await db
    .select({
      status: commercialProposals.status,
      count: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${commercialProposals.totalValue}), 0)`,
    })
    .from(commercialProposals)
    .groupBy(commercialProposals.status);
  return rows;
}
