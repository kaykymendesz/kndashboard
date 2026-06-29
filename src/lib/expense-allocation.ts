import { parseNumber } from "@/lib/format";
import { splitPartnerShares } from "@/lib/expense-rateio";

export const KN_GENERAL_COST_CENTER = "K&N — Administrativo/Geral";

export type ExpenseScopeKind = "kn_interno" | "kn_geral" | "projeto_cliente";

export function inferExpenseScope(
  scope: string | null | undefined,
  projectId: number | null | undefined,
  clientId: number | null | undefined
): ExpenseScopeKind {
  if (scope === "projeto_cliente" || clientId) return "projeto_cliente";
  if (scope === "kn_geral" || (!projectId && scope !== "kn_interno")) return "kn_geral";
  return "kn_interno";
}

/** Rateio Elaine/Kayky só em gastos internos da K&N (com ou sem projeto). */
export function shouldApplyPartnerRateio(input: {
  expenseScope?: string | null;
  clientId?: number | null;
}): boolean {
  const scope = input.expenseScope ?? (input.clientId ? "projeto_cliente" : "kn_interno");
  return scope === "kn_interno" || scope === "kn_geral";
}

export function isPendingClientReimbursement(input: {
  expenseScope?: string | null;
  reimbursementStatus?: string | null;
  paymentResponsible?: string | null;
  clientId?: number | null;
}): boolean {
  const scope = input.expenseScope ?? (input.clientId ? "projeto_cliente" : "kn_interno");
  return (
    scope === "projeto_cliente" &&
    input.paymentResponsible === "K&N" &&
    input.reimbursementStatus === "Aguardando reembolso"
  );
}

export function resolveCostCenterPreview(input: {
  expenseScope?: string | null;
  projectId?: number | null;
  clientId?: number | null;
  costCenter?: string | null;
  projectName?: string | null;
  clientName?: string | null;
}): string {
  if (input.costCenter?.trim()) return input.costCenter;
  const scope = inferExpenseScope(input.expenseScope, input.projectId, input.clientId);
  if (scope === "kn_geral" || (scope !== "projeto_cliente" && !input.projectId)) {
    return KN_GENERAL_COST_CENTER;
  }
  if (scope === "projeto_cliente" && input.clientName && input.projectName) {
    return `${input.clientName} · ${input.projectName}`;
  }
  if (input.projectName) return input.projectName;
  return "—";
}

export function clearPartnerRateio<T extends {
  elaineShare?: string;
  kaykyShare?: string;
  elainePending?: string;
  kaykyPending?: string;
  elaineSettled?: boolean;
  kaykySettled?: boolean;
  paidBy?: string;
}>(form: T): T {
  return {
    ...form,
    elaineShare: "0",
    kaykyShare: "0",
    elainePending: "0",
    kaykyPending: "0",
    elaineSettled: false,
    kaykySettled: false,
    paidBy: "",
  };
}

export function applyPartnerRateioFromTotal<T extends {
  totalValue: string;
  elaineShare?: string;
  kaykyShare?: string;
  elainePending?: string;
  kaykyPending?: string;
  elaineSettled?: boolean;
  kaykySettled?: boolean;
  expenseScope?: string | null;
  clientId?: number | null;
}>(form: T, total: string | number): T {
  if (!shouldApplyPartnerRateio(form)) {
    return clearPartnerRateio({ ...form, totalValue: String(parseNumber(total)) });
  }
  const amount = parseNumber(total);
  if (amount <= 0) return form;
  const { elaine, kayky } = splitPartnerShares(amount);
  return {
    ...form,
    totalValue: String(amount),
    elaineShare: String(elaine),
    kaykyShare: String(kayky),
    elainePending: form.elaineSettled ? "0" : String(elaine),
    kaykyPending: form.kaykySettled ? "0" : String(kayky),
  };
}
