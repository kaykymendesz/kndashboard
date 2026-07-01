"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  getAllReceivablePendingSummary,
  getClientFinancialMovements,
  getClientPendingEntries,
  getFinancialEntryDetail,
  getPartnerPendingItems,
  type PartnerSlug,
} from "@/lib/erp-v2/queries";
import { recordFinancialPayment } from "@/lib/erp-v2/financial";

async function currentUserLabel() {
  const session = await auth();
  return session?.user?.name ?? session?.user?.email ?? "Sistema";
}

function revalidateFinancialPaths() {
  revalidatePath("/gestao");
  revalidatePath("/financeiro");
  revalidatePath("/clientes");
  revalidatePath("/projetos");
  revalidatePath("/lucro");
}

export async function fetchFinancialEntryDetail(entryId: number) {
  return getFinancialEntryDetail(entryId);
}

export async function fetchClientPendingEntries(clientId: number) {
  return getClientPendingEntries(clientId);
}

export async function fetchClientFinancialMovements(clientId: number) {
  return getClientFinancialMovements(clientId);
}

export async function fetchPartnerPendingItems(slug: PartnerSlug) {
  return getPartnerPendingItems(slug);
}

export async function fetchReceivablePendingSummary() {
  return getAllReceivablePendingSummary();
}

export async function registerEntryPayment(input: {
  entryId: number;
  amount: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}) {
  const amount = parseFloat(input.amount.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Informe um valor válido");
  }

  const createdBy = await currentUserLabel();
  const result = await recordFinancialPayment({
    entryId: input.entryId,
    amount,
    paymentDate: input.paymentDate ? new Date(input.paymentDate + "T12:00:00") : new Date(),
    paymentMethod: input.paymentMethod ?? "PIX",
    notes: input.notes ?? "",
    createdBy,
  });

  revalidateFinancialPaths();
  return result;
}
