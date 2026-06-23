import { ExpenseFormPage } from "@/components/expense-form-page";
import { getScheduleItemsWithCost } from "@/lib/actions/schedule";
import { db } from "@/lib/db";

type Props = { searchParams: Promise<{ scheduleId?: string }> };

export default async function NovoGastoPage({ searchParams }: Props) {
  const { scheduleId } = await searchParams;
  const initialScheduleId = scheduleId ? Number(scheduleId) : null;

  const [projects, clients, scheduleItems] = await Promise.all([
    db.query.projects.findMany(),
    db.query.clients.findMany(),
    getScheduleItemsWithCost(),
  ]);
  return (
    <ExpenseFormPage
      projects={projects}
      clients={clients}
      scheduleItems={scheduleItems}
      initialScheduleId={initialScheduleId && !Number.isNaN(initialScheduleId) ? initialScheduleId : null}
    />
  );
}
