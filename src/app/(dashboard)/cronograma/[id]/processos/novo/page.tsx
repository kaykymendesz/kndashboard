import { notFound } from "next/navigation";
import { ProcessExecutionPage } from "@/components/process-execution-page";
import { getScheduleItemById } from "@/lib/actions/schedule";
import { getClassificationNames } from "@/lib/actions/settings";

type Props = { params: Promise<{ id: string }> };

export default async function NovoProcessoPage({ params }: Props) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) notFound();

  const scheduleItem = await getScheduleItemById(itemId);
  if (!scheduleItem) notFound();

  const categoryOptions = await getClassificationNames("process_category");

  return (
    <ProcessExecutionPage
      scheduleItem={scheduleItem}
      categoryOptions={categoryOptions}
      isNew
    />
  );
}
