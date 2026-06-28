"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientProject } from "@/lib/actions/projects";
import {
  DEFAULT_CLIENT_PROJECT_STATUS,
  PROJECT_LIFECYCLE_STATUSES,
  type Client,
} from "@/lib/db/schema";

type Props = {
  client: Client;
};

export function ClientProjectForm({ client }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    status: DEFAULT_CLIENT_PROJECT_STATUS as string,
    description: "",
    contractedRevenue: "",
    notes: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do projeto.");
      return;
    }
    startTransition(async () => {
      try {
        const row = await createClientProject({
          clientId: client.id,
          name: form.name.trim(),
          status: form.status,
          description: form.description,
          contractedRevenue: form.contractedRevenue,
          notes: form.notes,
        });
        toast.success("Projeto criado");
        router.push(`/projetos/${row.slug}`);
        router.refresh();
      } catch {
        toast.error("Erro ao criar projeto");
      }
    });
  };

  return (
    <div className="kn-page max-w-xl">
      <Link
        href={`/clientes/${client.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {client.name}
      </Link>
      <PageHeader
        title="Novo projeto"
        description={`Iniciativa para ${client.name} — existe desde o primeiro contato, mesmo em cotação.`}
        icon={FolderKanban}
      />
      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Nome do projeto *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Gestão de Atestados"
              />
            </div>
            <div className="grid gap-2">
              <Label>Status inicial</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_LIFECYCLE_STATUSES.filter((s) => s !== "Concluído" && s !== "Cancelado").map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Valor em negociação (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.contractedRevenue}
                onChange={(e) => setForm({ ...form, contractedRevenue: e.target.value })}
                placeholder="Opcional — proposta ou contrato"
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
              Gastos, cronograma e financeiro ficam disponíveis imediatamente — basta alterar o status quando o cliente aprovar.
            </p>
            <Button type="submit" className="kn-btn-primary" disabled={pending}>
              Criar projeto
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
