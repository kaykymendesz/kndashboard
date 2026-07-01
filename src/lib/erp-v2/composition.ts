/** Cálculos de composição financeira — ERP v2.0 */

export type CompositionLineInput = {
  lineType: "infraestrutura" | "mao_obra" | "custo_exclusivo";
  compositionValue: number;
};

export type CompositionTotals = {
  infraTotal: number;
  laborTotal: number;
  exclusiveTotal: number;
  suggestedPrice: number;
};

export type NegotiationResult = CompositionTotals & {
  negotiatedPrice: number;
  discountAmount: number;
  discountPercent: number;
};

export function sumByType(lines: CompositionLineInput[]): CompositionTotals {
  let infraTotal = 0;
  let laborTotal = 0;
  let exclusiveTotal = 0;

  for (const line of lines) {
    const v = Number(line.compositionValue) || 0;
    if (line.lineType === "infraestrutura") infraTotal += v;
    else if (line.lineType === "mao_obra") laborTotal += v;
    else exclusiveTotal += v;
  }

  const suggestedPrice = infraTotal + laborTotal + exclusiveTotal;
  return { infraTotal, laborTotal, exclusiveTotal, suggestedPrice };
}

export function applyNegotiatedPrice(
  totals: CompositionTotals,
  negotiatedPrice: number
): NegotiationResult {
  const negotiated = Math.max(0, Number(negotiatedPrice) || 0);
  const discountAmount = Math.max(0, totals.suggestedPrice - negotiated);
  const discountPercent =
    totals.suggestedPrice > 0 ? (discountAmount / totals.suggestedPrice) * 100 : 0;

  return {
    ...totals,
    negotiatedPrice: negotiated,
    discountAmount,
    discountPercent,
  };
}

export function entryBalance(originalAmount: number, paidAmount: number): number {
  return Math.max(0, (Number(originalAmount) || 0) - (Number(paidAmount) || 0));
}

export function entryStatus(
  originalAmount: number,
  paidAmount: number,
  currentStatus?: string | null
): "Pendente" | "Parcial" | "Quitado" | "Cancelado" {
  if (currentStatus === "Cancelado") return "Cancelado";
  const balance = entryBalance(originalAmount, paidAmount);
  if (balance <= 0.009) return "Quitado";
  if (paidAmount > 0) return "Parcial";
  return "Pendente";
}

export function toNumericString(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}
