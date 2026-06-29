import { parseNumber } from "@/lib/format";
import type { ProposalFormData } from "./types";

export function calculateProposalTotal(form: Pick<
  ProposalFormData,
  | "devValue"
  | "monthlyValue"
  | "domainValue"
  | "hostingValue"
  | "sslValue"
  | "additionalValue"
  | "discountValue"
>) {
  const subtotal =
    parseNumber(form.devValue) +
    parseNumber(form.monthlyValue) +
    parseNumber(form.domainValue) +
    parseNumber(form.hostingValue) +
    parseNumber(form.sslValue) +
    parseNumber(form.additionalValue);
  const discount = parseNumber(form.discountValue);
  return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
}

export function calculateInstallmentValue(total: number, downPayment: number, installments: number) {
  if (installments <= 0) return 0;
  const remaining = Math.max(0, total - downPayment);
  return Math.round((remaining / installments) * 100) / 100;
}

export function calculateValidUntil(issuedAt: string, validityDays: number) {
  if (!issuedAt) return "";
  const date = new Date(issuedAt + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + validityDays);
  return date.toISOString().slice(0, 10);
}

export function applyProposalCalculations(form: ProposalFormData): ProposalFormData {
  const total = calculateProposalTotal(form);
  const installments = Math.max(1, parseInt(form.installments, 10) || 1);
  const downPayment = parseNumber(form.downPayment);
  const installmentValue = calculateInstallmentValue(total, downPayment, installments);
  const validUntil = calculateValidUntil(form.issuedAt, parseInt(form.validityDays, 10) || 60);

  return {
    ...form,
    totalValue: String(total),
    installments: String(installments),
    installmentValue: String(installmentValue),
    validUntil,
  };
}
