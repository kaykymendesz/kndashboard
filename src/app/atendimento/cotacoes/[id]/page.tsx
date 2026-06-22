import { notFound } from "next/navigation";
import { getQuotationById } from "@/lib/actions/quotations";
import { getClientById } from "@/lib/actions/clients";
import { CotacaoFormPage } from "@/components/cotacao-form-page";

type Props = { params: Promise<{ id: string }> };

export default async function CotacaoPage({ params }: Props) {
  const { id } = await params;
  const quotationId = Number(id);
  if (Number.isNaN(quotationId)) notFound();

  const quotation = await getQuotationById(quotationId);
  if (!quotation) notFound();

  const client = await getClientById(quotation.clientId);
  if (!client) notFound();

  return <CotacaoFormPage quotation={quotation} client={client} />;
}
