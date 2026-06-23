import { PerfilForm } from "@/components/perfil-form";
import { auth } from "@/lib/auth";

export default async function PerfilPage() {
  const session = await auth();
  return <PerfilForm userName={session?.user?.name} userEmail={session?.user?.email} />;
}
