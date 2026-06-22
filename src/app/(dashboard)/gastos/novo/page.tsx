import { ExpenseFormPage } from "@/components/expense-form-page";
import { db } from "@/lib/db";

export default async function NovoGastoPage() {
  const [projects, clients] = await Promise.all([
    db.query.projects.findMany(),
    db.query.clients.findMany(),
  ]);
  return <ExpenseFormPage projects={projects} clients={clients} />;
}
