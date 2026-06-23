"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KnLogo } from "@/components/kn-logo";
import { cn } from "@/lib/utils";
import { getIcon, COMPANY_LEGAL_NAME } from "@/lib/constants";

export type NavItem = {
  id: number;
  label: string;
  href: string;
  icon: string;
  groupLabel: string | null;
  sortOrder: number | null;
  visible: boolean | null;
};

export type ShellConfig = {
  subtitle?: string;
  headerBadge?: string;
};

function getInitials(name?: string | null) {
  if (!name) return "KN";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isNavActive(pathname: string, href: string) {
  if (href === "/gestao") return pathname === "/gestao";
  if (href === "/atendimento") return pathname === "/atendimento";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  userName,
  menuItems,
  shell,
}: {
  userName?: string | null;
  menuItems: NavItem[];
  shell?: ShellConfig;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const subtitle = shell?.subtitle ?? "Gestão Empresarial";

  const closeMobileMenu = () => {
    if (isMobile) setOpenMobile(false);
  };

  const groups = menuItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.groupLabel ?? "Navegação";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50 px-5 py-5">
        <KnLogo
          size={44}
          showText
          subtitle={subtitle}
          titleClassName="text-sm font-semibold text-white leading-tight truncate"
          subtitleClassName="text-[11px] text-sidebar-foreground/60 truncate"
        />
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-4 min-h-0">
        {Object.entries(groups).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-2">
              {group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {items.map((item) => {
                  const Icon = getIcon(item.icon);
                  const active = isNavActive(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={cn(
                          "kn-sidebar-item h-10 px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white max-md:h-11 max-md:text-[15px]",
                          active && "kn-sidebar-item-active font-medium"
                        )}
                      >
                        <Link href={item.href} onClick={closeMobileMenu}>
                          <Icon className={cn("h-4 w-4", active && "text-white")} />
                          <span className="flex-1">{item.label}</span>
                          {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4 space-y-3">
        {userName && (
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5 hover:bg-sidebar-accent transition-colors"
          >
            <Avatar className="h-8 w-8 ring-2 ring-white/10">
              <AvatarFallback className="bg-primary text-[10px] font-semibold text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{userName}</p>
              <p className="text-[10px] text-sidebar-foreground/50">Ver perfil</p>
            </div>
          </Link>
        )}
        <Link
          href="/"
          className="w-full justify-start gap-2 h-9 max-md:h-11 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors flex items-center px-3 rounded-lg text-sm"
        >
          Trocar área
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9 max-md:h-11 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sair do sistema
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardShell({
  children,
  userName,
  menuItems,
  shell,
}: {
  children: React.ReactNode;
  userName?: string | null;
  menuItems: NavItem[];
  shell?: ShellConfig;
}) {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const headerBadge = shell?.headerBadge ?? "Painel Gerencial";
  const mobileTitle = shell?.subtitle === "Atendimento a Clientes" ? "K&N Atendimento" : "K&N Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} menuItems={menuItems} shell={shell} />
      <main className="flex min-h-svh flex-1 flex-col bg-background max-md:min-h-dvh">
        <header className="sticky top-0 z-10 flex h-14 md:h-16 items-center justify-between gap-3 border-b border-border/60 bg-white/80 backdrop-blur-md px-4 md:px-6 shadow-sm max-md:pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors shrink-0" />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <div className="min-w-0 flex-1 md:hidden">
              <p className="text-sm font-semibold text-foreground truncate">{mobileTitle}</p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">{today.split(",")[0]}</p>
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {COMPANY_LEGAL_NAME}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {headerBadge}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto overflow-x-hidden p-4 md:p-6 lg:p-8 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
