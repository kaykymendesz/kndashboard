import { notFound } from "next/navigation";
import { getClientBySlug } from "@/lib/actions/clients";
import { NovaDemandaForm } from "@/components/nova-demanda-form";

type Props = { params: Promise<{ slug: string }> };

export default async function NovaDemandaPage({ params }: Props) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();
  return <NovaDemandaForm client={client} />;
}
