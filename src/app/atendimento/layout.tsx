import { DashboardShell, type NavItem } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { getClients } from "@/lib/actions/clients";
import { DEFAULT_ATENDIMENTO_MENUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AtendimentoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const clients = await getClients();

  const baseMenus: NavItem[] = DEFAULT_ATENDIMENTO_MENUS.map((m, i) => ({
    id: i,
    label: m.label,
    href: m.href,
    icon: m.icon,
    groupLabel: m.groupLabel,
    sortOrder: m.sortOrder,
    visible: true,
  }));

  const clientMenus: NavItem[] = clients.map((c) => ({
    id: 1000 + c.id,
    label: c.name,
    href: `/atendimento/clientes/${c.slug ?? c.id}`,
    icon: "Users",
    groupLabel: "Clientes",
    sortOrder: c.id,
    visible: true,
  }));

  return (
    <DashboardShell
      userName={session?.user?.name}
      menuItems={[...baseMenus, ...clientMenus]}
      shell={{
        subtitle: "Atendimento a Clientes",
        headerBadge: "Atendimento K&N",
      }}
    >
      {children}
    </DashboardShell>
  );
}
