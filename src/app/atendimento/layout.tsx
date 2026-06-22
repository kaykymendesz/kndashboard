import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { COMPANY_SHORT_NAME } from "@/lib/constants";

export default function AtendimentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-white/90 backdrop-blur-md px-4 md:px-8 py-4 max-md:pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
              K&N
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">Atendimento {COMPANY_SHORT_NAME}</p>
              <p className="text-xs text-muted-foreground">Clientes e suporte</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Trocar área</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 max-md:pb-[max(2rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
