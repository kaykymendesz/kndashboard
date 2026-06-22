import { ScheduleFormPage } from "@/components/schedule-form-page";
import { getProcessFlows } from "@/lib/actions/process-flows";
import { getClassificationNames } from "@/lib/actions/settings";

export default async function NovoCronogramaPage() {
  const [flows, statusOptions] = await Promise.all([
    getProcessFlows(),
    getClassificationNames("schedule_status"),
  ]);
  return <ScheduleFormPage statusOptions={statusOptions} flows={flows} />;
}
