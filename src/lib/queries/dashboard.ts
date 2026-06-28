import { db } from "@/lib/db";
import { activities, expenses, revenues, scheduleItems, clients, projects } from "@/lib/db/schema";
import type { Expense, ScheduleItem } from "@/lib/db/schema";
import { getPendingReimbursements, getPendingReimbursementsTotal } from "@/lib/project-finance";

function sumValues(items: { totalValue?: string | null }[]) {
  return items.reduce((sum, e) => sum + Number(e.totalValue ?? 0), 0);
}

function withCostExpenses(all: Expense[]) {
  return all.filter((e) => e.hasCost !== false);
}

function withCostSchedule(all: ScheduleItem[]) {
  return all.filter((s) => s.hasCost === true);
}

export async function getDashboardStats() {
  const allExpensesRaw = await db.select().from(expenses);
  const allExpenses = withCostExpenses(allExpensesRaw);
  const allActivities = await db.select().from(activities);
  const allScheduleRaw = await db.select().from(scheduleItems);
  const allSchedule = withCostSchedule(allScheduleRaw);
  const allClients = await db.select().from(clients);
  const allProjects = await db.select().from(projects);

  const totalInvested = sumValues(allExpenses);
  const totalPaid = allExpenses
    .filter((e) => e.status?.toLowerCase().includes("pago"))
    .reduce((sum, e) => sum + Number(e.totalValue ?? 0), 0);
  const elainePending = allExpenses.reduce((sum, e) => sum + Number(e.elainePending ?? 0), 0);
  const kaykyPending = allExpenses.reduce((sum, e) => sum + Number(e.kaykyPending ?? 0), 0);
  const elaineInvested = allExpenses.reduce((sum, e) => sum + Number(e.elaineShare ?? 0), 0);
  const kaykyInvested = allExpenses.reduce((sum, e) => sum + Number(e.kaykyShare ?? 0), 0);

  const knExpenses = allExpenses.filter((e) => !e.projectId || e.projectId === null);
  const knTotal = sumValues(knExpenses);

  const expensesByPartner = {
    Elaine: elaineInvested,
    Kayky: kaykyInvested,
  };

  const projectMap = new Map(allProjects.map((p) => [p.id, p.name]));
  const expensesByProject = allExpenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.projectId ? projectMap.get(e.projectId) ?? "Outros" : "K&N Empresa";
    acc[key] = (acc[key] ?? 0) + Number(e.totalValue ?? 0);
    return acc;
  }, {});

  const clientMap = new Map(allClients.map((c) => [c.id, c.name]));
  const expensesByClient = allExpenses.reduce<Record<string, number>>((acc, e) => {
    if (!e.clientId) return acc;
    const key = clientMap.get(e.clientId) ?? "Cliente";
    acc[key] = (acc[key] ?? 0) + Number(e.totalValue ?? 0);
    return acc;
  }, {});

  const expensesByType = allExpenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.expenseType ?? "Único";
    acc[key] = (acc[key] ?? 0) + Number(e.totalValue ?? 0);
    return acc;
  }, {});

  const criticalActivities = allActivities.filter(
    (a) => a.priority === "Crítica" || (a.priority === "Alta" && a.status === "Erro")
  ).length;
  const highPriority = allActivities.filter((a) => a.priority === "Alta").length;
  const pendingActivities = allActivities.filter(
    (a) => !["Funcionando", "Ativo", "Finalizado"].includes(a.status)
  ).length;

  const schedulePlanned = allSchedule.reduce((sum, s) => sum + Number(s.plannedValue ?? 0), 0);
  const scheduleActual = allSchedule.reduce((sum, s) => sum + Number(s.actualValue ?? 0), 0);

  const expensesByCategory = allExpenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category || "Outros";
    acc[cat] = (acc[cat] ?? 0) + Number(e.totalValue ?? 0);
    return acc;
  }, {});

  const recentExpenses = [...allExpenses]
    .sort((a, b) => {
      const da = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      const db = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 5);

  const upcomingSchedule = [...allSchedule]
    .filter((s) => s.plannedDate && new Date(s.plannedDate) >= new Date())
    .sort((a, b) => {
      const da = a.plannedDate ? new Date(a.plannedDate).getTime() : 0;
      const db = b.plannedDate ? new Date(b.plannedDate).getTime() : 0;
      return da - db;
    })
    .slice(0, 5);

  const allRevenues = await db.select().from(revenues);
  const revenueReceived = allRevenues
    .filter((r) => r.status === "Recebido")
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const revenuePending = allRevenues
    .filter((r) => r.status === "Pendente")
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const contractedFromProjects = allProjects.reduce(
    (s, p) => s + Number(p.contractedRevenue ?? 0),
    0
  );
  const revenueToReceive = Math.max(revenuePending, contractedFromProjects - revenueReceived);
  const totalProfit = revenueReceived - totalInvested;
  const pendingReimbursementsTotal = await getPendingReimbursementsTotal();
  const pendingReimbursements = await getPendingReimbursements();

  return {
    totalInvested,
    totalPaid,
    totalPending: elainePending + kaykyPending,
    elainePending,
    kaykyPending,
    elaineInvested,
    kaykyInvested,
    knTotal,
    revenueReceived,
    revenuePending,
    revenueToReceive,
    totalProfit,
    pendingReimbursementsTotal,
    pendingReimbursements,
    expensesByPartner,
    expensesByProject,
    expensesByClient,
    expensesByType,
    activityCount: allActivities.length,
    criticalActivities,
    highPriority,
    pendingActivities,
    clientCount: allClients.length,
    schedulePlanned,
    scheduleActual,
    expensesByCategory,
    recentExpenses,
    upcomingSchedule,
  };
}

export async function getFinancialSummary() {
  const allExpensesRaw = await db.select().from(expenses);
  const allExpenses = withCostExpenses(allExpensesRaw);

  const byMonth = allExpenses.reduce<Record<string, number>>((acc, e) => {
    if (!e.purchaseDate) return acc;
    const key = new Date(e.purchaseDate).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
    acc[key] = (acc[key] ?? 0) + Number(e.totalValue ?? 0);
    return acc;
  }, {});

  const monthlyData = Object.entries(byMonth).map(([month, total]) => ({ month, total }));

  return {
    expenses: allExpenses,
    monthlyData,
    totals: {
      invested: allExpenses.reduce((s, e) => s + Number(e.totalValue ?? 0), 0),
      byType: allExpenses.reduce<Record<string, number>>((acc, e) => {
        const key = e.expenseType ?? "Único";
        acc[key] = (acc[key] ?? 0) + Number(e.totalValue ?? 0);
        return acc;
      }, {}),
      elaineShare: allExpenses.reduce((s, e) => s + Number(e.elaineShare ?? 0), 0),
      kaykyShare: allExpenses.reduce((s, e) => s + Number(e.kaykyShare ?? 0), 0),
      elainePending: allExpenses.reduce((s, e) => s + Number(e.elainePending ?? 0), 0),
      kaykyPending: allExpenses.reduce((s, e) => s + Number(e.kaykyPending ?? 0), 0),
    },
  };
}

export async function getProfitSummary() {
  const [{ totals }, allRevenues] = await Promise.all([
    getFinancialSummary(),
    db.select().from(revenues),
  ]);

  const received = allRevenues
    .filter((r) => r.status === "Recebido")
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);

  const pending = allRevenues
    .filter((r) => r.status === "Pendente")
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);

  const costs = totals.invested;
  const profit = received - costs;

  return {
    received,
    pending,
    costs,
    profit,
    revenues: allRevenues,
  };
}
