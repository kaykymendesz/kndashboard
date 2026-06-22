import { notFound } from "next/navigation";
import { ScheduleFormPage } from "@/components/schedule-form-page";
import { getScheduleItemById } from "@/lib/actions/schedule";
import { getProcessFlows } from "@/lib/actions/process-flows";
import { getClassificationNames } from "@/lib/actions/settings";

type Props = { params: Promise<{ id: string }> };

export default async function EditarCronogramaPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) notFound();

  const [item, flows, statusOptions] = await Promise.all([
    getScheduleItemById(itemId),
    getProcessFlows(),
    getClassificationNames("schedule_status"),
  ]);
  if (!item) notFound();

  return <ScheduleFormPage item={item} statusOptions={statusOptions} flows={flows} />;
}
