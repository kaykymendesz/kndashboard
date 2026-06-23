import { notFound } from "next/navigation";
import { DemandaFormPage } from "@/components/demanda-form-page";
import { getAttendanceCaseById } from "@/lib/actions/attendance";
import { getClientById } from "@/lib/actions/clients";

type Props = { params: Promise<{ id: string }> };

export default async function EditarDemandaPage({ params }: Props) {
  const { id } = await params;
  const caseId = Number(id);
  if (Number.isNaN(caseId)) notFound();

  const demand = await getAttendanceCaseById(caseId);
  if (!demand) notFound();

  const client = await getClientById(demand.clientId);
  if (!client) notFound();

  return <DemandaFormPage demand={demand} client={client} />;
}
