import { DashboardShell } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name}>
      {session?.user?.name && (
        <div className="sr-only">Logado como {session.user.name}</div>
      )}
      {children}
    </DashboardShell>
  );
}
