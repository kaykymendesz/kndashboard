import { parseNumber } from "@/lib/format";

export const PARTNER_PAYERS = ["Elaine", "Kayky", "Ambos"] as const;
export type PartnerPayer = (typeof PARTNER_PAYERS)[number];

export type SettlementForm = {
  elaineShare?: string;
  kaykyShare?: string;
  elainePending?: string;
  kaykyPending?: string;
  elaineSettled?: boolean;
  kaykySettled?: boolean;
  paidBy?: string;
  status?: string;
};

export function statusFromSettlement(form: SettlementForm) {
  const elainePending = parseNumber(form.elainePending);
  const kaykyPending = parseNumber(form.kaykyPending);
  if (form.status === "Cancelado") return "Cancelado";
  if (elainePending <= 0 && kaykyPending <= 0) return "Pago";
  if (elainePending > 0 && kaykyPending > 0) return "Pendente";
  return "Parcial";
}

export function applyPartnerPendingFromShares<T extends SettlementForm>(form: T): T {
  const elaineShare = parseNumber(form.elaineShare);
  const kaykyShare = parseNumber(form.kaykyShare);

  return {
    ...form,
    elainePending: form.elaineSettled ? "0" : String(elaineShare),
    kaykyPending: form.kaykySettled ? "0" : String(kaykyShare),
    status: statusFromSettlement({
      ...form,
      elainePending: form.elaineSettled ? "0" : String(elaineShare),
      kaykyPending: form.kaykySettled ? "0" : String(kaykyShare),
    }),
  };
}

/** Quem efetivamente pagou o fornecedor (cartão/conta). */
export function applyVendorPayer<T extends SettlementForm>(form: T, payer: PartnerPayer | ""): T {
  if (!payer) {
    return applyPartnerPendingFromShares({
      ...form,
      paidBy: "",
      elaineSettled: false,
      kaykySettled: false,
      status: "Pendente",
    });
  }

  if (payer === "Ambos") {
    return applyPartnerPendingFromShares({
      ...form,
      paidBy: "Ambos",
      elaineSettled: true,
      kaykySettled: true,
      status: "Pago",
    });
  }

  if (payer === "Elaine") {
    return applyPartnerPendingFromShares({
      ...form,
      paidBy: "Elaine",
      elaineSettled: true,
      kaykySettled: false,
    });
  }

  return applyPartnerPendingFromShares({
    ...form,
    paidBy: "Kayky",
    elaineSettled: false,
    kaykySettled: true,
  });
}

export function togglePartnerSettled<T extends SettlementForm>(
  form: T,
  partner: "elaine" | "kayky",
  settled: boolean
): T {
  const next =
    partner === "elaine"
      ? { ...form, elaineSettled: settled }
      : { ...form, kaykySettled: settled };

  return applyPartnerPendingFromShares(next);
}

export function payerSelectValue(paidBy: string | undefined) {
  if (paidBy === "Elaine" || paidBy === "Kayky" || paidBy === "Ambos") return paidBy;
  return "none";
}
