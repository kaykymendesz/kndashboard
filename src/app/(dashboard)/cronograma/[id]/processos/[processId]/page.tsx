import { notFound } from "next/navigation";
import { ProcessExecutionPage } from "@/components/process-execution-page";
import { getScheduleItemById } from "@/lib/actions/schedule";
import { getScheduleProcessById } from "@/lib/actions/schedule-processes";
import { getClassificationNames } from "@/lib/actions/settings";

type Props = { params: Promise<{ id: string; processId: string }> };

export default async function ProcessoPage({ params }: Props) {
  const { id, processId } = await params;
  const itemId = Number(id);
  const procId = Number(processId);
  if (Number.isNaN(itemId) || Number.isNaN(procId)) notFound();

  const [scheduleItem, process, categoryOptions] = await Promise.all([
    getScheduleItemById(itemId),
    getScheduleProcessById(procId),
    getClassificationNames("process_category"),
  ]);
  if (!scheduleItem || !process || process.scheduleItemId !== itemId) notFound();

  return (
    <ProcessExecutionPage
      scheduleItem={scheduleItem}
      process={process}
      categoryOptions={categoryOptions}
    />
  );
}
