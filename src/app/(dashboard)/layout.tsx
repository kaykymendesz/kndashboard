import { DashboardShell, type NavItem, type ShellConfig } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { getMenuItems } from "@/lib/actions/settings";
import { DEFAULT_MENUS } from "@/lib/constants";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function shellForPath(pathname: string): ShellConfig | undefined {
  if (pathname.startsWith("/operacional")) {
    return { subtitle: "Painel Operacional", headerBadge: "Status dos Serviços" };
  }
  return undefined;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const shell = shellForPath(pathname);
  let menuItems: NavItem[] = [];

  try {
    const dbMenus = await getMenuItems();
    menuItems = dbMenus.map((m) => ({
      id: m.id,
      label: m.label,
      href: m.href,
      icon: m.icon,
      groupLabel: m.groupLabel,
      sortOrder: m.sortOrder,
      visible: m.visible,
    }));
  } catch {
    menuItems = DEFAULT_MENUS.map((m, i) => ({
      id: i,
      label: m.label,
      href: m.href,
      icon: m.icon,
      groupLabel: m.groupLabel,
      sortOrder: m.sortOrder,
      visible: true,
    }));
  }

  return (
    <DashboardShell userName={session?.user?.name} menuItems={menuItems} shell={shell}>
      {session?.user?.name && (
        <div className="sr-only">Logado como {session.user.name}</div>
      )}
      {children}
    </DashboardShell>
  );
}
