"use client";

import { useState, useTransition } from "react";
import { User, Lock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changePassword } from "@/lib/actions/auth-user";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

export function PerfilForm({ userName, userEmail }: Props) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    startTransition(async () => {
      try {
        await changePassword(form.current, form.next);
        toast.success("Senha alterada com sucesso");
        setForm({ current: "", next: "", confirm: "" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao alterar senha");
      }
    });
  };

  return (
    <div className="kn-page max-w-xl">
      <PageHeader
        title="Meu perfil"
        description="Dados da sessão e alteração de senha."
        icon={User}
      />

      <Card className="kn-card mb-6">
        <CardHeader className="kn-card-header py-3">
          <CardTitle className="text-sm font-semibold">Conta</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-2 text-sm">
          <p><span className="text-muted-foreground">Nome:</span> <strong>{userName}</strong></p>
          <p><span className="text-muted-foreground">E-mail:</span> <strong>{userEmail}</strong></p>
        </CardContent>
      </Card>

      <Card className="kn-card">
        <CardHeader className="kn-card-header py-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Senha atual</Label>
              <Input
                type="password"
                required
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
            <Button type="submit" className="kn-btn-primary w-fit" disabled={pending}>
              {pending ? "Salvando..." : "Atualizar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
