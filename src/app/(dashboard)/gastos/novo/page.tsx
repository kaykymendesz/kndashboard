import { ExpenseFormPage } from "@/components/expense-form-page";
import { getScheduleItemsWithCost } from "@/lib/actions/schedule";
import { getOperationalProjects } from "@/lib/actions/projects";
import { getVendors } from "@/lib/actions/vendors";
import { db } from "@/lib/db";

type Props = { searchParams: Promise<{ scheduleId?: string }> };

export default async function NovoGastoPage({ searchParams }: Props) {
  const { scheduleId } = await searchParams;
  const initialScheduleId = scheduleId ? Number(scheduleId) : null;

  const [projects, clients, vendors, scheduleItems] = await Promise.all([
    getOperationalProjects(),
    db.query.clients.findMany(),
    getVendors(),
    getScheduleItemsWithCost(),
  ]);
  return (
    <ExpenseFormPage
      projects={projects}
      clients={clients}
      vendors={vendors}
      scheduleItems={scheduleItems}
      initialScheduleId={initialScheduleId && !Number.isNaN(initialScheduleId) ? initialScheduleId : null}
    />
  );
}
