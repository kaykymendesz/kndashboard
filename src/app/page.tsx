import Link from "next/link";
import { Building2, Headphones, LayoutDashboard, ArrowRight } from "lucide-react";
import { COMPANY_LEGAL_NAME, COMPANY_SHORT_NAME } from "@/lib/constants";

export default function PortalPage() {
  return (
    <div className="min-h-svh flex flex-col bg-[oklch(0.22_0.06_250)] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDQyYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />

      <header className="relative z-10 px-6 py-8 md:px-12 max-md:pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <span className="text-lg font-bold">K&N</span>
          </div>
          <div>
            <p className="text-lg font-semibold">{COMPANY_SHORT_NAME}</p>
            <p className="text-sm text-white/60">{COMPANY_LEGAL_NAME}</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12 max-md:pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="text-center max-w-2xl mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Escolha como deseja acessar
          </h1>
          <p className="mt-4 text-white/70 text-base md:text-lg leading-relaxed">
            Selecione o módulo do sistema K&N. Gestão interna e atendimento a clientes compartilham a mesma plataforma.
          </p>
        </div>

        <div className="grid gap-5 w-full max-w-3xl md:grid-cols-2">
          <Link
            href="/login?callbackUrl=/gestao"
            className="group relative flex flex-col rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 mb-6 group-hover:bg-primary/30 transition-colors">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold mb-2">Gestão K&N e Projetos</h2>
            <p className="text-sm text-white/65 leading-relaxed flex-1">
              Painel administrativo — finanças, gastos, cronograma, projetos Wikinaya e configurações da empresa.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:gap-3 transition-all">
              Entrar na gestão <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href="/login?callbackUrl=/atendimento"
            className="group relative flex flex-col rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 mb-6 group-hover:bg-primary/30 transition-colors">
              <Headphones className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold mb-2">Clientes e Atendimento</h2>
            <p className="text-sm text-white/65 leading-relaxed flex-1">
              Mesmo sistema K&N — demandas, cotações e etapas por cliente até finalizar (ex: Zuki).
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:gap-3 transition-all">
              Ir para atendimento <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-white/40 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Building2 className="h-3.5 w-3.5" />
          <span>© {new Date().getFullYear()} K&N — Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
}
