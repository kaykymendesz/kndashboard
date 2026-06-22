import { ExpensesManager } from "@/components/expenses-manager";
import { getExpenses } from "@/lib/actions/expenses";

export default async function GastosPage() {
  const items = await getExpenses();
  return <ExpensesManager items={items} />;
}
