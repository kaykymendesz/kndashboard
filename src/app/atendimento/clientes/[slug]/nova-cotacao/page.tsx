import { notFound } from "next/navigation";
import { getClientBySlug } from "@/lib/actions/clients";
import { NovaCotacaoForm } from "@/components/nova-cotacao-form";

type Props = { params: Promise<{ slug: string }> };

export default async function NovaCotacaoPage({ params }: Props) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();
  return <NovaCotacaoForm client={client} />;
}
