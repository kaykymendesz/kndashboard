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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/constants";

export type NavItem = {
  id: number;
  label: string;
  href: string;
  icon: string;
  groupLabel: string | null;
  sortOrder: number | null;
  visible: boolean | null;
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
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  userName,
  menuItems,
}: {
  userName?: string | null;
  menuItems: NavItem[];
}) {
  const pathname = usePathname();

  const groups = menuItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.groupLabel ?? "Navegação";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <span className="text-sm font-bold text-white tracking-tight">K&N</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">K&N Dashboard</p>
            <p className="text-[11px] text-sidebar-foreground/60 truncate">Gestão Empresarial</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-4">
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
                          "kn-sidebar-item h-10 px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                          active && "kn-sidebar-item-active font-medium"
                        )}
                      >
                        <Link href={item.href}>
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
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
            <Avatar className="h-8 w-8 ring-2 ring-white/10">
              <AvatarFallback className="bg-primary text-[10px] font-semibold text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{userName}</p>
              <p className="text-[10px] text-sidebar-foreground/50">Administrador</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 h-9 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
          onClick={() => signOut({ callbackUrl: "/login" })}
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
}: {
  children: React.ReactNode;
  userName?: string | null;
  menuItems: NavItem[];
}) {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} menuItems={menuItems} />
      <main className="flex min-h-svh flex-1 flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-white/80 backdrop-blur-md px-6 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                Mendes & Anaya Desenvolvimento de Software LTDA
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Painel Gerencial
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 lg:p-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}
