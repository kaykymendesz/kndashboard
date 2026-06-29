import { parseNumber } from "@/lib/format";
import type { CommercialProposal } from "@/lib/db/schema";
import type { ProposalDocumentData, ProposalFormData, ProposalServiceItem } from "./types";
import { applyProposalCalculations } from "./calculations";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function proposalToForm(row: CommercialProposal): ProposalFormData {
  return {
    templateId: row.templateId,
    status: row.status ?? "Em elaboração",
    clientId: row.clientId,
    clientName: row.clientName ?? "",
    clientCompany: row.clientCompany ?? "",
    clientDocument: row.clientDocument ?? "",
    clientResponsible: row.clientResponsible ?? "",
    clientEmail: row.clientEmail ?? "",
    clientPhone: row.clientPhone ?? "",
    projectName: row.projectName ?? "",
    serviceType: row.serviceType ?? "",
    category: row.category ?? "",
    projectObjective: row.projectObjective ?? "",
    description: row.description ?? "",
    includedItems: row.includedItems ?? "",
    devValue: String(row.devValue ?? 0),
    monthlyValue: String(row.monthlyValue ?? 0),
    domainValue: String(row.domainValue ?? 0),
    hostingValue: String(row.hostingValue ?? 0),
    sslValue: String(row.sslValue ?? 0),
    additionalValue: String(row.additionalValue ?? 0),
    discountValue: String(row.discountValue ?? 0),
    totalValue: String(row.totalValue ?? 0),
    paymentMethods: parseJson<string[]>(row.paymentMethods, ["PIX"]),
    installments: String(row.installments ?? 1),
    downPayment: String(row.downPayment ?? 0),
    installmentValue: String(row.installmentValue ?? 0),
    paymentNotes: row.paymentNotes ?? "",
    validityDays: String(row.validityDays ?? 60),
    issuedAt: toInputDate(row.issuedAt),
    validUntil: toInputDate(row.validUntil),
    deliveryDeadline: row.deliveryDeadline ?? "",
    city: row.city ?? "São Paulo - SP",
    observations: row.observations ?? "",
    selectedServices: parseJson<ProposalServiceItem[]>(row.selectedServices, []),
    selectedGuarantees: parseJson<string[]>(row.selectedGuarantees, []),
    customLayout: row.customLayout ?? "{}",
  };
}

export function formToDocumentData(
  form: ProposalFormData,
  proposalNumber: string
): ProposalDocumentData {
  const calculated = applyProposalCalculations(form);
  return {
    proposalNumber,
    issuedAt: calculated.issuedAt,
    validUntil: calculated.validUntil,
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
    services: calculated.selectedServices,
    guarantees: calculated.selectedGuarantees,
    devValue: parseNumber(calculated.devValue),
    monthlyValue: parseNumber(calculated.monthlyValue),
    domainValue: parseNumber(calculated.domainValue),
    hostingValue: parseNumber(calculated.hostingValue),
    sslValue: parseNumber(calculated.sslValue),
    additionalValue: parseNumber(calculated.additionalValue),
    discountValue: parseNumber(calculated.discountValue),
    totalValue: parseNumber(calculated.totalValue),
    paymentMethods: calculated.paymentMethods,
    installments: parseInt(calculated.installments, 10) || 1,
    downPayment: parseNumber(calculated.downPayment),
    installmentValue: parseNumber(calculated.installmentValue),
    paymentNotes: calculated.paymentNotes,
    deliveryDeadline: calculated.deliveryDeadline,
    city: calculated.city,
    observations: calculated.observations,
  };
}

export function proposalRowToDocument(row: CommercialProposal): ProposalDocumentData {
  return formToDocumentData(proposalToForm(row), row.proposalNumber);
}
