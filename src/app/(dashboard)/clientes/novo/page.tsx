import { ClientFormPage } from "@/components/client-form-page";

type Props = { searchParams: Promise<{ returnTo?: string }> };

export default async function NovoClientePage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  return <ClientFormPage returnTo={returnTo} />;
}
