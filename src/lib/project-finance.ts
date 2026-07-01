import { db } from "@/lib/db";
import { clients, expenses, financialEntries, projectCompositions, projects, revenues } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { entryBalance } from "@/lib/erp-v2/composition";

function sumExpenses(rows: { totalValue?: string | null; hasCost?: boolean | null }[]) {
  return rows
    .filter((e) => e.hasCost !== false)
    .reduce((s, e) => s + Number(e.totalValue ?? 0), 0);
}

export type ProjectFinancialSummary = {
  projectId: number;
  projectName: string;
  projectType: string;
  clientId: number | null;
  clientName: string | null;
  contractedRevenue: number;
  receivedRevenue: number;
  pendingRevenue: number;
  totalExpenses: number;
  monthlyExpenses: number;
  grossProfit: number;
  marginPercent: number | null;
  lastExpenseDate: Date | null;
  expenseCount: number;
};

export async function getProjectFinancialSummary(projectId: number): Promise<ProjectFinancialSummary | null> {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return null;

  const client = project.clientId
    ? await db.query.clients.findFirst({ where: eq(clients.id, project.clientId) })
    : null;

  const projectExpenses = await db.query.expenses.findMany({
    where: eq(expenses.projectId, projectId),
    orderBy: (e, { desc }) => [desc(e.purchaseDate)],
  });

  const projectRevenues = await db.query.revenues.findMany({
    where: eq(revenues.projectId, projectId),
  });

  const totalExpenses = sumExpenses(projectExpenses);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyExpenses = sumExpenses(
    projectExpenses.filter((e) => e.purchaseDate && new Date(e.purchaseDate) >= monthStart)
  );

  const receivableEntries = await db.query.financialEntries.findMany({
    where: and(
      eq(financialEntries.projectId, projectId),
      eq(financialEntries.entryType, "receber")
    ),
  });

  const useLedger = receivableEntries.length > 0;

  let receivedRevenue = 0;
  let pendingRevenue = 0;

  if (useLedger) {
    for (const e of receivableEntries) {
      if (e.status === "Cancelado") continue;
      const original = Number(e.originalAmount ?? 0);
      const paid = Number(e.paidAmount ?? 0);
      receivedRevenue += paid;
      pendingRevenue += entryBalance(original, paid);
    }
  } else {
    receivedRevenue = projectRevenues
      .filter((r) => r.status === "Recebido")
      .reduce((s, r) => s + Number(r.amount ?? 0), 0);

    pendingRevenue = projectRevenues
      .filter((r) => r.status === "Pendente")
      .reduce((s, r) => s + Number(r.amount ?? 0), 0);
  }

  const [composition] = await db
    .select()
    .from(projectCompositions)
    .where(eq(projectCompositions.projectId, projectId))
    .limit(1);

  const contractedRevenue =
    Number(project.negotiatedPrice ?? 0) ||
    Number(composition?.negotiatedPrice ?? 0) ||
    Number(project.contractedRevenue ?? 0);
  const grossProfit = contractedRevenue > 0 ? contractedRevenue - totalExpenses : 0;
  const marginPercent =
    contractedRevenue > 0 ? Math.round((grossProfit / contractedRevenue) * 1000) / 10 : null;

  const lastExpense = projectExpenses.find((e) => e.purchaseDate);

  return {
    projectId: project.id,
    projectName: project.name,
    projectType: project.projectType ?? "interno",
    clientId: project.clientId ?? null,
    clientName: client?.name ?? (project.projectType === "interno" ? "K&N" : null),
    contractedRevenue,
    receivedRevenue,
    pendingRevenue,
    totalExpenses,
    monthlyExpenses,
    grossProfit,
    marginPercent,
    lastExpenseDate: lastExpense?.purchaseDate ?? null,
    expenseCount: projectExpenses.length,
  };
}

export type PendingReimbursement = {
  id: number;
  clientName: string;
  projectName: string;
  description: string;
  vendor: string;
  totalValue: number;
  status: string;
};

export async function getPendingReimbursements(): Promise<PendingReimbursement[]> {
  const rows = await db
    .select({
      id: expenses.id,
      description: expenses.description,
      vendor: expenses.vendor,
      totalValue: expenses.totalValue,
      status: expenses.reimbursementStatus,
      clientName: clients.name,
      projectName: projects.name,
    })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .leftJoin(clients, eq(expenses.clientId, clients.id))
    .where(
      sql`${expenses.reimbursementStatus} = 'Aguardando reembolso'
        AND ${expenses.paymentResponsible} = 'K&N'
        AND ${expenses.hasCost} IS NOT FALSE`
    )
    .orderBy(sql`${expenses.purchaseDate} DESC NULLS LAST`);

  return rows.map((r) => ({
    id: r.id,
    clientName: r.clientName ?? "—",
    projectName: r.projectName ?? "—",
    description: r.description,
    vendor: r.vendor ?? "—",
    totalValue: Number(r.totalValue ?? 0),
    status: r.status ?? "Aguardando reembolso",
  }));
}

export async function getPendingReimbursementsTotal(): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${expenses.totalValue}), 0)` })
    .from(expenses)
    .where(
      sql`${expenses.reimbursementStatus} = 'Aguardando reembolso'
        AND ${expenses.paymentResponsible} = 'K&N'
        AND ${expenses.hasCost} IS NOT FALSE`
    );
  return Number(row?.total ?? 0);
}
