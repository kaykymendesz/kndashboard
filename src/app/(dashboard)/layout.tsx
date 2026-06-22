import { DashboardShell, type NavItem } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { getMenuItems } from "@/lib/actions/settings";
import { DEFAULT_MENUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
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
    <DashboardShell userName={session?.user?.name} menuItems={menuItems}>
      {session?.user?.name && (
        <div className="sr-only">Logado como {session.user.name}</div>
      )}
      {children}
    </DashboardShell>
  );
}
