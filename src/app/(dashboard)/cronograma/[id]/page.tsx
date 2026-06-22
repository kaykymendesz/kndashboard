import { notFound } from "next/navigation";
import { ScheduleItemDetail } from "@/components/schedule-item-detail";
import { getScheduleItemById } from "@/lib/actions/schedule";
import { getScheduleProcesses, initProcessesFromFlow } from "@/lib/actions/schedule-processes";

type Props = { params: Promise<{ id: string }> };

export default async function CronogramaItemPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) notFound();

  const item = await getScheduleItemById(itemId);
  if (!item) notFound();

  let processes = await getScheduleProcesses(itemId);
  if (processes.length === 0 && item.flowId) {
    processes = await initProcessesFromFlow(itemId, item.flowId);
  }

  return <ScheduleItemDetail item={item} processes={processes} />;
}
