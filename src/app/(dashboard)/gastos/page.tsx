import { ExpensesManager } from "@/components/expenses-manager";
import { getExpensesWithRelations } from "@/lib/actions/expenses";

export default async function GastosPage() {
  const items = await getExpensesWithRelations();
  return <ExpensesManager items={items} />;
}
