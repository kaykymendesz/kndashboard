import { notFound } from "next/navigation";
import { getAttendanceCaseById, getAttendanceStepById } from "@/lib/actions/attendance";
import { getClientById } from "@/lib/actions/clients";
import { EtapaAtendimentoPage } from "@/components/etapa-atendimento-page";

type Props = { params: Promise<{ id: string; stepId: string }> };

export default async function EtapaPage({ params }: Props) {
  const { id, stepId } = await params;
  const caseId = Number(id);
  const sId = Number(stepId);
  if (Number.isNaN(caseId) || Number.isNaN(sId)) notFound();

  const [demand, step] = await Promise.all([
    getAttendanceCaseById(caseId),
    getAttendanceStepById(sId),
  ]);
  if (!demand || !step || step.caseId !== caseId) notFound();

  const client = await getClientById(demand.clientId);
  if (!client) notFound();

  return <EtapaAtendimentoPage step={step} demand={demand} client={client} />;
}
