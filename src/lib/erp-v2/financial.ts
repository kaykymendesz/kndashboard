import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  catalogExclusiveCosts,
  catalogInfrastructure,
  catalogLabor,
  companySettings,
  financialEntries,
  financialEntryHistory,
  financialEntryPayments,
} from "@/lib/db/schema";
import { entryBalance, entryStatus } from "./composition";

export type ProfitDistributionConfig = {
  companyPercent: number;
  partners: { slug: string; name: string; percent: number }[];
};

const DEFAULT_PROFIT_DISTRIBUTION: ProfitDistributionConfig = {
  companyPercent: 20,
  partners: [
    { slug: "elaine", name: "Elaine Rebelo", percent: 40 },
    { slug: "kayky", name: "Kayky Mendes", percent: 40 },
  ],
};

export async function getCompanySetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.key, key))
    .limit(1);
  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function getProfitDistribution(): Promise<ProfitDistributionConfig> {
  return getCompanySetting("profit_distribution", DEFAULT_PROFIT_DISTRIBUTION);
}

export async function recordFinancialPayment(input: {
  entryId: number;
  amount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  notes?: string;
  createdBy?: string;
}) {
  const [entry] = await db
    .select()
    .from(financialEntries)
    .where(eq(financialEntries.id, input.entryId))
    .limit(1);

  if (!entry) throw new Error("Lançamento financeiro não encontrado");

  const amount = Number(input.amount);
  if (amount <= 0) throw new Error("Valor do pagamento deve ser positivo");

  const currentPaid = Number(entry.paidAmount) || 0;
  const original = Number(entry.originalAmount) || 0;
  const balance = entryBalance(original, currentPaid);

  if (amount > balance + 0.009) {
    throw new Error(`Pagamento excede saldo (${balance.toFixed(2)})`);
  }

  const newPaid = currentPaid + amount;
  const newStatus = entryStatus(original, newPaid, entry.status);

  await db.insert(financialEntryPayments).values({
    entryId: input.entryId,
    amount: amount.toFixed(2),
    paymentDate: input.paymentDate ?? new Date(),
    paymentMethod: input.paymentMethod ?? "",
    notes: input.notes ?? "",
    createdBy: input.createdBy ?? "",
  });

  await db
    .update(financialEntries)
    .set({
      paidAmount: newPaid.toFixed(2),
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(financialEntries.id, input.entryId));

  await db.insert(financialEntryHistory).values({
    entryId: input.entryId,
    eventType: "pagamento",
    amount: amount.toFixed(2),
    note: input.notes ?? "Pagamento registrado",
    createdBy: input.createdBy ?? "",
    snapshot: JSON.stringify({ paidAmount: newPaid, status: newStatus }),
  });

  return { paidAmount: newPaid, status: newStatus, balance: entryBalance(original, newPaid) };
}

export async function getClientFinancialSummary(clientId: number) {
  const entries = await db
    .select()
    .from(financialEntries)
    .where(eq(financialEntries.clientId, clientId));

  let contracted = 0;
  let received = 0;
  let pending = 0;
  let reimbursementsPending = 0;

  for (const e of entries) {
    if (e.entryType !== "receber") continue;
    const original = Number(e.originalAmount) || 0;
    const paid = Number(e.paidAmount) || 0;
    contracted += original;
    received += paid;
    pending += entryBalance(original, paid);
    if (e.isReimbursable && e.status !== "Quitado" && e.status !== "Cancelado") {
      reimbursementsPending += entryBalance(original, paid);
    }
  }

  return { contracted, received, pending, reimbursementsPending, entryCount: entries.length };
}

export async function listCatalogs() {
  const [infra, labor, exclusive] = await Promise.all([
    db.select().from(catalogInfrastructure).where(eq(catalogInfrastructure.active, true)),
    db.select().from(catalogLabor).where(eq(catalogLabor.active, true)),
    db.select().from(catalogExclusiveCosts).where(eq(catalogExclusiveCosts.active, true)),
  ]);
  return { infra, labor, exclusive };
}
