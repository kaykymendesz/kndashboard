import { notFound } from "next/navigation";
import { ExpenseFormPage } from "@/components/expense-form-page";
import { getExpenseById, getRelatedExpensesByName } from "@/lib/actions/expenses";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function GastoDetailPage({ params }: Props) {
  const { id } = await params;
  const expenseId = Number(id);
  if (Number.isNaN(expenseId)) notFound();

  const expense = await getExpenseById(expenseId);
  if (!expense) notFound();

  const [projects, clients, relatedExpenses] = await Promise.all([
    db.query.projects.findMany(),
    db.query.clients.findMany(),
    getRelatedExpensesByName(expense.description, expense.id),
  ]);

  return (
    <ExpenseFormPage
      expense={expense}
      projects={projects}
      clients={clients}
      relatedExpenses={relatedExpenses}
    />
  );
}
