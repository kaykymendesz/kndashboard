import { ScheduleManager } from "@/components/schedule-manager";
import { getScheduleItems } from "@/lib/actions/schedule";

export default async function CronogramaPage() {
  const items = await getScheduleItems();
  return <ScheduleManager items={items} />;
}
