"use server";

import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { parseDate, parseNumber } from "@/lib/format";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ExpenseInput = {
  description: string;
  category?: string;
  vendor?: string;
  purchaseDate?: string;
  financialResponsible?: string;
  totalValue: string;
  elaineShare?: string;
  kaykyShare?: string;
  projectId?: number | null;
  isInstallment?: boolean;
  installmentCount?: string;
  installmentValue?: string;
  paidInstallments?: string;
  remainingInstallments?: string;
  status?: string;
  dueDate?: string;
  paymentMethod?: string;
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
  return {
    description: input.description,
    category: input.category ?? "",
    vendor: input.vendor ?? "",
    purchaseDate: parseDate(input.purchaseDate ?? ""),
    financialResponsible: input.financialResponsible ?? "",
    totalValue: String(parseNumber(input.totalValue)),
    elaineShare: String(parseNumber(input.elaineShare)),
    kaykyShare: String(parseNumber(input.kaykyShare)),
    isInstallment: input.isInstallment ?? false,
    installmentCount: parseNumber(input.installmentCount) || 1,
    installmentValue: String(parseNumber(input.installmentValue)),
    paidInstallments: parseNumber(input.paidInstallments),
    remainingInstallments: parseNumber(input.remainingInstallments),
    status: input.status ?? "Pendente",
    dueDate: parseDate(input.dueDate ?? ""),
    paymentMethod: input.paymentMethod ?? "",
    paidBy: input.paidBy ?? "",
    elaineSettled: input.elaineSettled ?? false,
    kaykySettled: input.kaykySettled ?? false,
    elainePending: String(parseNumber(input.elainePending)),
    kaykyPending: String(parseNumber(input.kaykyPending)),
    linkedEmail: input.linkedEmail ?? "",
    autoRenew: input.autoRenew ?? false,
    expirationDate: parseDate(input.expirationDate ?? ""),
    registeredBy: input.registeredBy ?? "",
    projectId: input.projectId ?? null,
    updatedAt: new Date(),
  };
}

export async function createExpense(input: ExpenseInput) {
  await db.insert(expenses).values(mapExpenseInput(input));
  revalidatePath("/gastos");
  revalidatePath("/financeiro");
  revalidatePath("/projetos");
  revalidatePath("/");
}

export async function updateExpense(id: number, input: ExpenseInput) {
  await db.update(expenses).set(mapExpenseInput(input)).where(eq(expenses.id, id));
  revalidatePath("/gastos");
  revalidatePath("/financeiro");
  revalidatePath("/projetos");
  revalidatePath("/");
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/gastos");
  revalidatePath("/financeiro");
  revalidatePath("/projetos");
  revalidatePath("/");
}

export async function getExpenses() {
  return db.query.expenses.findMany({ orderBy: (e, { desc }) => [desc(e.purchaseDate)] });
}
