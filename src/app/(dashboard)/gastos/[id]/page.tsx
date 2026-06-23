import { notFound } from "next/navigation";
import { ExpenseFormPage } from "@/components/expense-form-page";
import { getExpenseById, getRelatedExpensesByName, getPlanChangesByExpenseId } from "@/lib/actions/expenses";
import { getScheduleItemsWithCost, getScheduleItemById } from "@/lib/actions/schedule";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function GastoDetailPage({ params }: Props) {
  const { id } = await params;
  const expenseId = Number(id);
  if (Number.isNaN(expenseId)) notFound();

  const expense = await getExpenseById(expenseId);
  if (!expense) notFound();

  const [projects, clients, scheduleItems, relatedExpenses, planChanges] = await Promise.all([
    db.query.projects.findMany(),
    db.query.clients.findMany(),
    getScheduleItemsWithCost(),
    getRelatedExpensesByName(expense.description, expense.id),
    getPlanChangesByExpenseId(expenseId),
  ]);

  let scheduleList = scheduleItems;
  if (expense.scheduleItemId && !scheduleItems.some((s) => s.id === expense.scheduleItemId)) {
    const linked = await getScheduleItemById(expense.scheduleItemId);
    if (linked) scheduleList = [...scheduleItems, linked];
  }

  return (
    <ExpenseFormPage
      expense={expense}
      projects={projects}
      clients={clients}
      scheduleItems={scheduleList}
      planChanges={planChanges}
      relatedExpenses={relatedExpenses}
    />
  );
}
