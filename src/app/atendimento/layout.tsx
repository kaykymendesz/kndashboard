import { AtendimentoShell } from "@/components/atendimento-shell";
import { auth } from "@/lib/auth";

export default async function AtendimentoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <AtendimentoShell userName={session?.user?.name}>{children}</AtendimentoShell>;
}
