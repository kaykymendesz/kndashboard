import { ExpenseFormPage } from "@/components/expense-form-page";
import { getScheduleItemsWithCost } from "@/lib/actions/schedule";
import { getOperationalProjects } from "@/lib/actions/projects";
import { getVendors } from "@/lib/actions/vendors";
import { db } from "@/lib/db";

type Props = { searchParams: Promise<{ scheduleId?: string; projectId?: string }> };

export default async function NovoGastoPage({ searchParams }: Props) {
  const { scheduleId, projectId } = await searchParams;
  const initialScheduleId = scheduleId ? Number(scheduleId) : null;
  const initialProjectId = projectId ? Number(projectId) : null;

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
      initialProjectId={initialProjectId && !Number.isNaN(initialProjectId) ? initialProjectId : null}
    />
  );
}
