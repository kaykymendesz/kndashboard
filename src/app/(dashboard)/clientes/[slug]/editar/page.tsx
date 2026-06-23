import { notFound } from "next/navigation";
import { ClientFormPage } from "@/components/client-form-page";
import { getClientBySlug } from "@/lib/actions/clients";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function EditarClientePage({ params, searchParams }: Props) {
  const [{ slug }, { returnTo }] = await Promise.all([params, searchParams]);
  const client = await getClientBySlug(slug);
  if (!client) notFound();
  return <ClientFormPage client={client} returnTo={returnTo} />;
}
