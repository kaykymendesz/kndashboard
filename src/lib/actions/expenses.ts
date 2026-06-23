"use server";

import { db } from "@/lib/db";
import { expenses, expensePlanChanges, scheduleItems } from "@/lib/db/schema";
import { parseDate, parseNumber } from "@/lib/format";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PlanChangeInput = {
  id?: number;
  planName: string;
  planValue?: string;
  changeDate?: string;
  notes?: string;
};

export type ExpenseInput = {
  description: string;
  expenseType?: string;
  planVariant?: string;
  planNotes?: string;
  contractedPlan?: string;
  contractedPlanValue?: string;
  planChangeVariant?: string;
  planChangeDate?: string;
  planChanges?: PlanChangeInput[];
  category?: string;
  vendor?: string;
  purchaseDate?: string;
  financialResponsible?: string;
  totalValue: string;
  elaineShare?: string;
  kaykyShare?: string;
  projectId?: number | null;
  clientId?: number | null;
  scheduleItemId?: number | null;
  hasCost?: boolean;
  isInstallment?: boolean;
  installmentCount?: string;
  installmentValue?: string;
  paidInstallments?: string;
  remainingInstallments?: string;
  status?: string;
  dueDate?: string;
  paymentMethod?: string;
  paymentType?: string;
  paymentCard?: string;
  paidBy?: string;
  elaineSettled?: boolean;
  kaykySettled?: boolean;
  elainePending?: string;
  kaykyPending?: string;
  linkedEmail?: string;
  autoRenew?: boolean;
  expirationDate?: string;
  registeredBy?: string;
};

function mapExpenseInput(input: ExpenseInput) {
  const hasCost = input.hasCost !== false;
  const totalValue = hasCost ? String(parseNumber(input.totalValue)) : "0";
  const paymentType = input.paymentType ?? input.paymentMethod ?? "";

  const validChanges = (input.planChanges ?? []).filter((c) => c.planName.trim());
  const lastChange = validChanges[validChanges.length - 1];

  return {
    description: input.description,
    expenseType: input.expenseType ?? "Único",
    planVariant: input.contractedPlan ?? input.planVariant ?? "",
    contractedPlan: input.contractedPlan ?? input.planVariant ?? "",
    contractedPlanValue:
      input.contractedPlanValue && hasCost
        ? String(parseNumber(input.contractedPlanValue))
        : null,
    planChangeVariant: lastChange?.planName ?? input.planChangeVariant ?? "",
    planChangeDate: parseDate(lastChange?.changeDate ?? input.planChangeDate ?? ""),
    planNotes: input.planNotes ?? "",
    category: input.category ?? "",
    vendor: input.vendor ?? "",
    purchaseDate: parseDate(input.purchaseDate ?? ""),
    financialResponsible: input.financialResponsible ?? "",
    totalValue,
    elaineShare: hasCost ? String(parseNumber(input.elaineShare)) : "0",
    kaykyShare: hasCost ? String(parseNumber(input.kaykyShare)) : "0",
    isInstallment: input.isInstallment ?? false,
    installmentCount: parseNumber(input.installmentCount) || 1,
    installmentValue: String(parseNumber(input.installmentValue)),
    paidInstallments: parseNumber(input.paidInstallments),
    remainingInstallments: parseNumber(input.remainingInstallments),
    status: input.status ?? "Pendente",
    dueDate: parseDate(input.dueDate ?? ""),
    paymentMethod: paymentType,
    paymentType,
    paymentCard: input.paymentCard ?? "",
    paidBy: input.paidBy ?? "",
    elaineSettled: input.elaineSettled ?? false,
    kaykySettled: input.kaykySettled ?? false,
    elainePending: hasCost ? String(parseNumber(input.elainePending)) : "0",
    kaykyPending: hasCost ? String(parseNumber(input.kaykyPending)) : "0",
    linkedEmail: input.linkedEmail ?? "",
    autoRenew: input.autoRenew ?? false,
    expirationDate: parseDate(input.expirationDate ?? ""),
    registeredBy: input.registeredBy ?? "",
    projectId: input.projectId ?? null,
    clientId: input.clientId ?? null,
    scheduleItemId: input.scheduleItemId ?? null,
    hasCost,
    updatedAt: new Date(),
  };
}

async function savePlanChanges(expenseId: number, input: ExpenseInput) {
  await db.delete(expensePlanChanges).where(eq(expensePlanChanges.expenseId, expenseId));

  const changes = (input.planChanges ?? []).filter((c) => c.planName.trim());
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    await db.insert(expensePlanChanges).values({
      expenseId,
      planName: c.planName.trim(),
      planValue: c.planValue ? String(parseNumber(c.planValue)) : null,
      changeDate: parseDate(c.changeDate ?? ""),
      notes: c.notes ?? "",
      sortOrder: i + 1,
    });
  }
}

async function syncScheduleFromExpense(input: ExpenseInput) {
  if (!input.scheduleItemId || input.hasCost === false) return;

  const item = await db.query.scheduleItems.findFirst({
    where: eq(scheduleItems.id, input.scheduleItemId),
  });
  if (!item) return;

  const actual = parseNumber(input.totalValue);
  const planned = item.plannedValue ? parseNumber(String(item.plannedValue)) : null;
  const diff = planned !== null ? actual - planned : null;

  await db
    .update(scheduleItems)
    .set({
      actualValue: String(actual),
      difference: diff !== null ? String(diff) : item.difference,
      updatedAt: new Date(),
    })
    .where(eq(scheduleItems.id, input.scheduleItemId));

  revalidatePath("/cronograma");
  revalidatePath(`/cronograma/${input.scheduleItemId}`);
  revalidatePath("/gestao");
}

function revalidateExpensePaths(id?: number) {
  revalidatePath("/gastos");
  revalidatePath("/financeiro");
  revalidatePath("/projetos");
  revalidatePath("/gestao");
  revalidatePath("/cronograma");
  if (id) revalidatePath(`/gastos/${id}`);
}

export async function createExpense(input: ExpenseInput) {
  const [row] = await db.insert(expenses).values(mapExpenseInput(input)).returning();
  await savePlanChanges(row.id, input);
  await syncScheduleFromExpense(input);
  revalidateExpensePaths(row.id);
  return row;
}

export async function updateExpense(id: number, input: ExpenseInput) {
  await db.update(expenses).set(mapExpenseInput(input)).where(eq(expenses.id, id));
  await savePlanChanges(id, input);
  await syncScheduleFromExpense(input);
  revalidateExpensePaths(id);
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidateExpensePaths();
}

export async function getExpenses() {
  return db.query.expenses.findMany({ orderBy: (e, { desc }) => [desc(e.purchaseDate)] });
}

export async function getExpenseById(id: number) {
  return db.query.expenses.findFirst({ where: eq(expenses.id, id) });
}

export async function getPlanChangesByExpenseId(expenseId: number) {
  return db.query.expensePlanChanges.findMany({
    where: eq(expensePlanChanges.expenseId, expenseId),
    orderBy: [asc(expensePlanChanges.sortOrder), asc(expensePlanChanges.id)],
  });
}

export async function getExpensesWithRelations() {
  const allExpenses = await db.query.expenses.findMany({
    orderBy: (e, { desc }) => [desc(e.purchaseDate)],
  });
  const allProjects = await db.query.projects.findMany();
  const allClients = await db.query.clients.findMany();
  const allSchedule = await db.query.scheduleItems.findMany();

  const projectMap = new Map(allProjects.map((p) => [p.id, p.name]));
  const clientMap = new Map(allClients.map((c) => [c.id, c.name]));
  const scheduleMap = new Map(allSchedule.map((s) => [s.id, s.title]));

  return allExpenses.map((e) => ({
    ...e,
    projectName: e.projectId ? projectMap.get(e.projectId) ?? "—" : "K&N Empresa",
    clientName: e.clientId ? clientMap.get(e.clientId) ?? "—" : "—",
    scheduleTitle: e.scheduleItemId ? scheduleMap.get(e.scheduleItemId) ?? "—" : "—",
  }));
}

export async function getRelatedExpensesByName(description: string, excludeId?: number) {
  const all = await getExpenses();
  return all.filter(
    (e) => e.description.toLowerCase() === description.toLowerCase() && e.id !== excludeId
  );
}

export async function getExpenseByScheduleItemId(scheduleItemId: number) {
  return db.query.expenses.findFirst({ where: eq(expenses.scheduleItemId, scheduleItemId) });
}
