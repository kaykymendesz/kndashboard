import { parseNumber } from "@/lib/format";
import { applyPartnerPendingFromShares } from "@/lib/expense-settlement";

export type PlanChangeInput = {
  id?: number;
  planName: string;
  planValue?: string;
  changeDate?: string;
  notes?: string;
};

export type ExpenseRateioForm = {
  contractedPlanValue?: string;
  planChanges?: PlanChangeInput[];
  totalValue: string;
  elaineShare?: string;
  kaykyShare?: string;
  elainePending?: string;
  kaykyPending?: string;
  elaineSettled?: boolean;
  kaykySettled?: boolean;
  paidBy?: string;
  status?: string;
};

export function splitPartnerShares(total: number) {
  const elaine = Math.round((total / 2) * 100) / 100;
  const kayky = Math.round((total - elaine) * 100) / 100;
  return { elaine, kayky };
}

export function getEffectivePlanValue(input: Pick<ExpenseRateioForm, "contractedPlanValue" | "planChanges">) {
  const changes = input.planChanges ?? [];
  for (let i = changes.length - 1; i >= 0; i--) {
    const value = parseNumber(changes[i].planValue);
    if (value > 0) return value;
  }
  return parseNumber(input.contractedPlanValue);
}

export function applyPlanValueToRateio<T extends ExpenseRateioForm>(
  form: T,
  planValue: string | number
): T {
  const total = parseNumber(planValue);
  if (total <= 0) return form;

  const { elaine, kayky } = splitPartnerShares(total);

  const base = {
    ...form,
    totalValue: String(total),
    elaineShare: String(elaine),
    kaykyShare: String(kayky),
  };

  return applyPartnerPendingFromShares(base);
}

export function syncFormRateioFromPlan<T extends ExpenseRateioForm>(form: T): T {
  const effective = getEffectivePlanValue(form);
  if (effective <= 0) return form;
  return applyPlanValueToRateio(form, effective);
}

export function applyPlanChangeToForm<T extends ExpenseRateioForm>(form: T, change: PlanChangeInput): T {
  const next = {
    ...form,
    planChanges: [...(form.planChanges ?? []), change],
  } as T;
  if (change.planValue && parseNumber(change.planValue) > 0) {
    return applyPlanValueToRateio(next, change.planValue);
  }
  return next;
}
