"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock, Mail, Shield } from "lucide-react";
import { COMPANY_LEGAL_NAME } from "@/lib/constants";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    window.location.href = "/";
  };

  return (
    <div className="min-h-svh flex">
      {/* Painel esquerdo — branding corporativo */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative flex-col justify-between bg-[oklch(0.22_0.06_250)] p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDQyYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <span className="text-lg font-bold">K&N</span>
            </div>
            <div>
              <p className="text-lg font-semibold">K&N Dashboard</p>
              <p className="text-sm text-white/60">Gestão Empresarial</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Painel de gestão para decisões estratégicas
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Controle financeiro, cronograma, clientes e operações da K&N Desenvolvimento de Software em um só lugar.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {[
              { icon: Building2, text: COMPANY_LEGAL_NAME },
              { icon: Shield, text: "Acesso restrito aos administradores" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} K&N — Todos os direitos reservados
        </p>
      </div>

      {/* Painel direito — login */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-12 max-md:px-4 max-md:pb-[max(1.5rem,env(safe-area-inset-bottom))] max-md:pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white text-sm font-bold">
              K&N
            </div>
            <div>
              <p className="font-semibold">K&N Dashboard</p>
              <p className="text-xs text-muted-foreground">Gestão Empresarial</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm">
              Entre com suas credenciais para acessar o painel gerencial.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="kn-input pl-10 h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="kn-input pl-10 h-11"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold kn-btn-primary"
              disabled={loading}
            >
              {loading ? "Autenticando..." : "Acessar painel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
