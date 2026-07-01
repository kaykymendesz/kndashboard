"use server";

import { db } from "@/lib/db";
import { expensePartnerPayments, expenses } from "@/lib/db/schema";
import { parseNumber } from "@/lib/format";
import { statusFromSettlement } from "@/lib/expense-settlement";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { PartnerSlug } from "@/lib/erp-v2/queries";

async function currentUserLabel() {
  const session = await auth();
  return session?.user?.name ?? session?.user?.email ?? "Sistema";
}

function revalidateSettlementPaths() {
  revalidatePath("/gestao");
  revalidatePath("/financeiro");
  revalidatePath("/gastos");
}

export async function registerPartnerPartialPayment(input: {
  expenseId: number;
  partnerSlug: PartnerSlug;
  amount: string;
  notes?: string;
}) {
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, input.expenseId)).limit(1);
  if (!expense) throw new Error("Gasto não encontrado");

  const payAmount = parseNumber(input.amount);
  if (payAmount <= 0) throw new Error("Valor inválido");

  const isElaine = input.partnerSlug === "elaine";
  const currentPending = parseNumber(isElaine ? expense.elainePending : expense.kaykyPending);
  if (currentPending <= 0) throw new Error("Não há saldo pendente neste item");

  const applied = Math.min(payAmount, currentPending);
  const newPending = Math.round((currentPending - applied) * 100) / 100;
  const createdBy = await currentUserLabel();

  const formLike = {
    elaineShare: String(expense.elaineShare ?? 0),
    kaykyShare: String(expense.kaykyShare ?? 0),
    elainePending: isElaine ? String(newPending) : String(expense.elainePending ?? 0),
    kaykyPending: !isElaine ? String(newPending) : String(expense.kaykyPending ?? 0),
    elaineSettled: isElaine ? newPending <= 0.009 : (expense.elaineSettled ?? false),
    kaykySettled: !isElaine ? newPending <= 0.009 : (expense.kaykySettled ?? false),
  };

  const status = statusFromSettlement(formLike);

  await db
    .update(expenses)
    .set({
      elainePending: formLike.elainePending,
      kaykyPending: formLike.kaykyPending,
      elaineSettled: formLike.elaineSettled,
      kaykySettled: formLike.kaykySettled,
      status,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, input.expenseId));

  await db.insert(expensePartnerPayments).values({
    expenseId: input.expenseId,
    partnerSlug: input.partnerSlug,
    amount: applied.toFixed(2),
    notes: input.notes ?? "",
    createdBy,
  });

  revalidateSettlementPaths();
  return { applied, newPending, status };
}
