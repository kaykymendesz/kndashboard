"use server";

import { db } from "@/lib/db";
import { expenses, expensePlanChanges, scheduleItems, projects, clients, canAcceptNewExpenses, isArchivedProject } from "@/lib/db/schema";
import { parseDate, parseNumber } from "@/lib/format";
import { getEffectivePlanValue, splitPartnerShares } from "@/lib/expense-rateio";
import type { ExpenseInput } from "@/lib/expense-input";
import type { PlanChangeInput } from "@/lib/expense-rateio";
import { statusFromSettlement } from "@/lib/expense-settlement";
import { buildCostCenter, resolveExpenseScope } from "@/lib/cost-center";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function resolveExpenseAllocation(input: ExpenseInput) {
  let projectId = input.projectId ?? null;
  let clientId = input.clientId ?? null;
  let expenseScope = input.expenseScope ?? "kn_interno";
  let costCenter = input.costCenter ?? "";

  if (!projectId) {
    return { projectId, clientId, expenseScope, costCenter };
  }

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) {
    return { projectId, clientId, expenseScope, costCenter };
  }

  if (isArchivedProject(project)) {
    throw new Error("Projetos arquivados não aceitam novos lançamentos.");
  }

  if (!canAcceptNewExpenses(project)) {
    throw new Error("Projetos concluídos ou cancelados não aceitam novos lançamentos.");
  }

  expenseScope = input.expenseScope ?? resolveExpenseScope(project);

  if (expenseScope === "projeto_cliente" || project.projectType === "cliente") {
    expenseScope = "projeto_cliente";
    clientId = clientId ?? project.clientId ?? null;
  } else {
    expenseScope = "kn_interno";
    clientId = null;
  }

  const client = clientId
    ? await db.query.clients.findFirst({ where: eq(clients.id, clientId) })
    : null;

  costCenter = buildCostCenter(project, client ?? undefined);

  return { projectId, clientId, expenseScope, costCenter };
}

function mapExpenseInput(input: ExpenseInput) {
  const hasCost = input.hasCost !== false;
  const paymentType = input.paymentType ?? input.paymentMethod ?? "";
  let status = input.status ?? "Pendente";

  const validChanges = (input.planChanges ?? []).filter((c) => c.planName.trim());
  const lastChange = validChanges[validChanges.length - 1];
  const effectivePlanName =
    lastChange?.planName ?? input.subscriptionPlan ?? input.contractedPlan ?? input.planVariant ?? "";

  const effectivePlanValue = hasCost ? getEffectivePlanValue(input) : 0;
  let totalValue = hasCost ? String(parseNumber(input.totalValue)) : "0";
  let elaineShare = hasCost ? String(parseNumber(input.elaineShare)) : "0";
  let kaykyShare = hasCost ? String(parseNumber(input.kaykyShare)) : "0";
  let elainePending = hasCost ? String(parseNumber(input.elainePending)) : "0";
  let kaykyPending = hasCost ? String(parseNumber(input.kaykyPending)) : "0";

  if (effectivePlanValue > 0) {
    totalValue = String(effectivePlanValue);
    const { elaine, kayky } = splitPartnerShares(effectivePlanValue);
    elaineShare = String(elaine);
    kaykyShare = String(kayky);
    elainePending = input.elaineSettled ? "0" : String(elaine);
    kaykyPending = input.kaykySettled ? "0" : String(kayky);
  }

  const derivedStatus = statusFromSettlement({
    elainePending,
    kaykyPending,
    elaineSettled: input.elaineSettled,
    kaykySettled: input.kaykySettled,
    status,
  });

  if (status !== "Cancelado" && (input.paidBy || input.elaineSettled || input.kaykySettled)) {
    status = derivedStatus;
  }

  const hasSubscription = input.hasSubscription ?? false;
  let expenseType = input.expenseType ?? "Único";
  if (hasSubscription) {
    const rec = input.subscriptionRecurrence ?? "";
    if (rec === "Mensal") expenseType = "Mensal";
    else if (rec === "Anual") expenseType = "Anual";
  }

  return {
    description: input.description,
    expenseType,
    planVariant: effectivePlanName,
    contractedPlan: effectivePlanName,
    contractedPlanValue:
      input.contractedPlanValue && hasCost
        ? String(parseNumber(input.contractedPlanValue))
        : null,
    planChangeVariant: lastChange?.planName ?? input.planChangeVariant ?? "",
    planChangeDate: parseDate(lastChange?.changeDate ?? input.planChangeDate ?? ""),
    planNotes: input.planNotes ?? "",
    category: input.category ?? "",
    vendor: input.vendor ?? "",
    vendorId: input.vendorId ?? null,
    purchaseDate: parseDate(input.purchaseDate ?? ""),
    financialResponsible: input.financialResponsible ?? "",
    totalValue,
    elaineShare,
    kaykyShare,
    isInstallment: input.isInstallment ?? false,
    installmentCount: parseNumber(input.installmentCount) || 1,
    installmentValue: String(parseNumber(input.installmentValue)),
    paidInstallments: parseNumber(input.paidInstallments),
    remainingInstallments: parseNumber(input.remainingInstallments),
    status,
    dueDate: parseDate(input.dueDate ?? ""),
    paymentMethod: paymentType,
    paymentType,
    paymentCard: input.paymentCard ?? "",
    paidBy: input.paidBy ?? "",
    elaineSettled: input.elaineSettled ?? false,
    kaykySettled: input.kaykySettled ?? false,
    elainePending,
    kaykyPending,
    linkedEmail: input.linkedEmail ?? "",
    autoRenew: input.autoRenew ?? false,
    expirationDate: parseDate(input.expirationDate ?? ""),
    registeredBy: input.registeredBy ?? "",
    projectId: input.projectId ?? null,
    clientId: input.clientId ?? null,
    scheduleItemId: input.scheduleItemId ?? null,
    hasCost,
    expenseScope: input.expenseScope ?? "kn_interno",
    costCenter: input.costCenter ?? "",
    paymentResponsible: input.paymentResponsible ?? "K&N",
    reimbursementStatus: input.reimbursementStatus ?? "Não possui",
    hasSubscription: input.hasSubscription ?? false,
    subscriptionPlan: input.subscriptionPlan ?? effectivePlanName,
    subscriptionRecurrence: input.subscriptionRecurrence ?? "",
    updatedAt: new Date(),
  };
}

async function mapExpenseInputAsync(input: ExpenseInput) {
  const base = mapExpenseInput(input);
  const allocation = await resolveExpenseAllocation(input);
  return { ...base, ...allocation };
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
  revalidatePath("/fornecedores");
  revalidatePath("/lucro");
  if (id) revalidatePath(`/gastos/${id}`);
}

export async function createExpense(input: ExpenseInput, planChanges: PlanChangeInput[] = []) {
  const mergedInput = { ...input, planChanges };
  const [row] = await db.insert(expenses).values(await mapExpenseInputAsync(mergedInput)).returning();
  await savePlanChanges(row.id, mergedInput);
  await syncScheduleFromExpense(mergedInput);
  revalidateExpensePaths(row.id);
  return row;
}

export async function updateExpense(
  id: number,
  input: ExpenseInput,
  planChanges: PlanChangeInput[] = []
) {
  const mergedInput = { ...input, planChanges };
  await db.update(expenses).set(await mapExpenseInputAsync(mergedInput)).where(eq(expenses.id, id));
  await savePlanChanges(id, mergedInput);
  await syncScheduleFromExpense(mergedInput);
  revalidateExpensePaths(id);
  return getPlanChangesByExpenseId(id);
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
    projectName: e.projectId ? projectMap.get(e.projectId) ?? "—" : "—",
    clientName: e.clientId ? clientMap.get(e.clientId) ?? "—" : "—",
    costCenterLabel: e.costCenter || (e.projectId ? projectMap.get(e.projectId) ?? "—" : "—"),
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
