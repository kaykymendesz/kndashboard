import { notFound } from "next/navigation";
import { ClientProjectForm } from "@/components/client-project-form";
import { getClientBySlug } from "@/lib/actions/clients";

type Props = { params: Promise<{ slug: string }> };

export default async function NovoProjetoClientePage({ params }: Props) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();
  return <ClientProjectForm client={client} />;
}
