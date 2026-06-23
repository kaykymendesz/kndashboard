import { notFound } from "next/navigation";
import { ExpenseFormPage } from "@/components/expense-form-page";
import { getExpenseById, getRelatedExpensesByName, getPlanChangesByExpenseId } from "@/lib/actions/expenses";
import { getOperationalProjects } from "@/lib/actions/projects";
import { getScheduleItemsWithCost, getScheduleItemById } from "@/lib/actions/schedule";
import { getVendors } from "@/lib/actions/vendors";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function GastoDetailPage({ params }: Props) {
  const { id } = await params;
  const expenseId = Number(id);
  if (Number.isNaN(expenseId)) notFound();

  const expense = await getExpenseById(expenseId);
  if (!expense) notFound();

  const [projects, clients, vendors, scheduleItems, relatedExpenses, planChanges] = await Promise.all([
    getOperationalProjects(),
    db.query.clients.findMany(),
    getVendors(),
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
      vendors={vendors}
      scheduleItems={scheduleList}
      planChanges={planChanges}
      relatedExpenses={relatedExpenses}
    />
  );
}
