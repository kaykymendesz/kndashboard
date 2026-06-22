import { db } from "@/lib/db";
import { activities, expenses, scheduleItems, clients } from "@/lib/db/schema";

export async function getDashboardStats() {
  const allExpenses = await db.select().from(expenses);
  const allActivities = await db.select().from(activities);
  const allSchedule = await db.select().from(scheduleItems);
  const allClients = await db.select().from(clients);

  const totalInvested = allExpenses.reduce((sum, e) => sum + Number(e.totalValue ?? 0), 0);
  const totalPaid = allExpenses
    .filter((e) => e.status?.toLowerCase().includes("pago"))
    .reduce((sum, e) => sum + Number(e.totalValue ?? 0), 0);
  const elainePending = allExpenses.reduce((sum, e) => sum + Number(e.elainePending ?? 0), 0);
  const kaykyPending = allExpenses.reduce((sum, e) => sum + Number(e.kaykyPending ?? 0), 0);
  const elaineInvested = allExpenses.reduce((sum, e) => sum + Number(e.elaineShare ?? 0), 0);
  const kaykyInvested = allExpenses.reduce((sum, e) => sum + Number(e.kaykyShare ?? 0), 0);

  const criticalActivities = allActivities.filter(
    (a) => a.priority === "Crítica" || a.priority === "Alta" && a.status === "Erro"
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

  return {
    totalInvested,
    totalPaid,
    totalPending: elainePending + kaykyPending,
    elainePending,
    kaykyPending,
    elaineInvested,
    kaykyInvested,
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
  const allExpenses = await db.select().from(expenses);

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
      elaineShare: allExpenses.reduce((s, e) => s + Number(e.elaineShare ?? 0), 0),
      kaykyShare: allExpenses.reduce((s, e) => s + Number(e.kaykyShare ?? 0), 0),
      elainePending: allExpenses.reduce((s, e) => s + Number(e.elainePending ?? 0), 0),
      kaykyPending: allExpenses.reduce((s, e) => s + Number(e.kaykyPending ?? 0), 0),
    },
  };
}
