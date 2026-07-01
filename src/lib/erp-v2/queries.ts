import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  expenses,
  financialEntries,
  financialEntryHistory,
  financialEntryPayments,
  projects,
} from "@/lib/db/schema";
import { entryBalance } from "./composition";

export type PartnerSlug = "elaine" | "kayky";

export type PartnerPendingItem = {
  expenseId: number;
  description: string;
  vendor: string;
  category: string;
  projectName: string;
  clientName: string;
  originalShare: number;
  paidShare: number;
  pendingShare: number;
  totalValue: number;
  paidBy: string;
  purchaseDate: Date | null;
};

export type ClientFinancialMovement = {
  id: number;
  kind: "receber" | "pagar";
  description: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  category: string;
  projectName: string;
  dueDate: Date | null;
  createdAt: Date;
  isReimbursable: boolean;
};

export type FinancialEntryDetail = {
  entry: typeof financialEntries.$inferSelect;
  payments: (typeof financialEntryPayments.$inferSelect)[];
  history: (typeof financialEntryHistory.$inferSelect)[];
  projectName: string | null;
  clientName: string | null;
};

function partnerFields(slug: PartnerSlug) {
  return slug === "elaine"
    ? {
        pending: expenses.elainePending,
        share: expenses.elaineShare,
        settled: expenses.elaineSettled,
      }
    : {
        pending: expenses.kaykyPending,
        share: expenses.kaykyShare,
        settled: expenses.kaykySettled,
      };
}

export async function getPartnerPendingItems(slug: PartnerSlug): Promise<PartnerPendingItem[]> {
  const fields = partnerFields(slug);

  const rows = await db
    .select({
      expenseId: expenses.id,
      description: expenses.description,
      vendor: expenses.vendor,
      category: expenses.category,
      projectName: projects.name,
      clientName: clients.name,
      share: fields.share,
      pending: fields.pending,
      totalValue: expenses.totalValue,
      paidBy: expenses.paidBy,
      purchaseDate: expenses.purchaseDate,
    })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .leftJoin(clients, eq(expenses.clientId, clients.id))
    .where(and(gt(fields.pending, "0"), sql`${expenses.hasCost} IS NOT FALSE`))
    .orderBy(desc(expenses.purchaseDate));

  return rows.map((r) => {
    const originalShare = Number(r.share ?? 0);
    const pendingShare = Number(r.pending ?? 0);
    return {
      expenseId: r.expenseId,
      description: r.description,
      vendor: r.vendor ?? "—",
      category: r.category ?? "",
      projectName: r.projectName ?? "—",
      clientName: r.clientName ?? "K&N",
      originalShare,
      paidShare: Math.max(0, originalShare - pendingShare),
      pendingShare,
      totalValue: Number(r.totalValue ?? 0),
      paidBy: r.paidBy ?? "",
      purchaseDate: r.purchaseDate,
    };
  });
}

export async function getPartnerPendingTotal(slug: PartnerSlug): Promise<number> {
  const items = await getPartnerPendingItems(slug);
  return items.reduce((s, i) => s + i.pendingShare, 0);
}

export async function getClientFinancialMovements(clientId: number): Promise<ClientFinancialMovement[]> {
  const rows = await db
    .select({
      entry: financialEntries,
      projectName: projects.name,
    })
    .from(financialEntries)
    .leftJoin(projects, eq(financialEntries.projectId, projects.id))
    .where(eq(financialEntries.clientId, clientId))
    .orderBy(desc(financialEntries.createdAt));

  return rows.map(({ entry, projectName }) => {
    const original = Number(entry.originalAmount ?? 0);
    const paid = Number(entry.paidAmount ?? 0);
    return {
      id: entry.id,
      kind: entry.entryType as "receber" | "pagar",
      description: entry.description,
      originalAmount: original,
      paidAmount: paid,
      balance: entryBalance(original, paid),
      status: entry.status ?? "Pendente",
      category: entry.category ?? "",
      projectName: projectName ?? "—",
      dueDate: entry.dueDate,
      createdAt: entry.createdAt,
      isReimbursable: entry.isReimbursable ?? false,
    };
  });
}

export async function getClientPendingEntries(clientId: number) {
  const movements = await getClientFinancialMovements(clientId);
  return movements.filter(
    (m) => m.kind === "receber" && m.balance > 0.009 && m.status !== "Cancelado"
  );
}

export type ReceivablePendingRow = {
  id: number;
  description: string;
  clientName: string;
  projectName: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  category: string;
  dueDate: Date | null;
};

export async function getAllReceivablePendingSummary(): Promise<ReceivablePendingRow[]> {
  const entries = await db
    .select({
      entry: financialEntries,
      clientName: clients.name,
      projectName: projects.name,
    })
    .from(financialEntries)
    .leftJoin(clients, eq(financialEntries.clientId, clients.id))
    .leftJoin(projects, eq(financialEntries.projectId, projects.id))
    .where(
      and(
        eq(financialEntries.entryType, "receber"),
        sql`${financialEntries.status} != 'Cancelado'`,
        sql`${financialEntries.status} != 'Quitado'`
      )
    )
    .orderBy(desc(financialEntries.dueDate));

  return entries
    .map(({ entry, clientName, projectName }) => {
      const original = Number(entry.originalAmount ?? 0);
      const paid = Number(entry.paidAmount ?? 0);
      const balance = entryBalance(original, paid);
      if (balance <= 0.009) return null;
      return {
        id: entry.id,
        description: entry.description,
        clientName: clientName ?? "—",
        projectName: projectName ?? "—",
        originalAmount: original,
        paidAmount: paid,
        balance,
        status: entry.status ?? "Pendente",
        category: entry.category ?? "",
        dueDate: entry.dueDate,
      };
    })
    .filter((row): row is ReceivablePendingRow => row !== null);
}

export async function getFinancialEntryDetail(entryId: number): Promise<FinancialEntryDetail | null> {
  const [row] = await db
    .select({
      entry: financialEntries,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(financialEntries)
    .leftJoin(projects, eq(financialEntries.projectId, projects.id))
    .leftJoin(clients, eq(financialEntries.clientId, clients.id))
    .where(eq(financialEntries.id, entryId))
    .limit(1);

  if (!row) return null;

  const [payments, history] = await Promise.all([
    db
      .select()
      .from(financialEntryPayments)
      .where(eq(financialEntryPayments.entryId, entryId))
      .orderBy(desc(financialEntryPayments.paymentDate)),
    db
      .select()
      .from(financialEntryHistory)
      .where(eq(financialEntryHistory.entryId, entryId))
      .orderBy(desc(financialEntryHistory.createdAt)),
  ]);

  return {
    entry: row.entry,
    payments,
    history,
    projectName: row.projectName,
    clientName: row.clientName,
  };
}
