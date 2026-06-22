"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowLeft, Headphones, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY_SHORT_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const nav = [{ href: "/atendimento", label: "Clientes", icon: Users }];

export function AtendimentoShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-svh flex flex-col bg-background max-md:min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-emerald-200/60 bg-white/90 backdrop-blur-md px-4 md:px-8 py-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">Atendimento {COMPANY_SHORT_NAME}</p>
              <p className="text-xs text-muted-foreground truncate">{userName ?? "Equipe K&N"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-700 transition-colors px-2 py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Trocar área</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto flex gap-1 mt-3 overflow-x-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/atendimento" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 max-md:pb-[max(2rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
