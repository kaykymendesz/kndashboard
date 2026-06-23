"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createRevenue, deleteRevenue, updateRevenue, type RevenueInput } from "@/lib/actions/revenues";
import { REVENUE_STATUSES, type Client, type Project, type Revenue } from "@/lib/db/schema";
import { toInputDate } from "@/lib/format";

const emptyForm: RevenueInput = {
  description: "",
  amount: "0",
  receivedDate: "",
  category: "",
  status: "Recebido",
  projectId: null,
  clientId: null,
  notes: "",
};

function toForm(revenue: Revenue): RevenueInput {
  return {
    description: revenue.description,
    amount: String(revenue.amount ?? 0),
    receivedDate: toInputDate(revenue.receivedDate),
    category: revenue.category ?? "",
    status: revenue.status ?? "Recebido",
    projectId: revenue.projectId,
    clientId: revenue.clientId,
    notes: revenue.notes ?? "",
  };
}

export function RevenueFormPage({
  revenue,
  projects,
  clients,
}: {
  revenue?: Revenue;
  projects: Project[];
  clients: Client[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<RevenueInput>(revenue ? toForm(revenue) : emptyForm);

  const set = (key: keyof RevenueInput, value: string | number | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (revenue) {
          await updateRevenue(revenue.id, form);
          toast.success("Receita atualizada");
        } else {
          await createRevenue(form);
          toast.success("Receita registrada");
        }
        router.push("/lucro");
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    if (!revenue || !confirm("Excluir esta receita?")) return;
    startTransition(async () => {
      await deleteRevenue(revenue.id);
      toast.success("Receita excluída");
      router.push("/lucro");
    });
  };

  return (
    <div className="kn-page">
      <Link href="/lucro" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Lucro
      </Link>

      <PageHeader
        title={revenue ? "Editar receita" : "Nova receita"}
        description="Entradas que compõem o lucro junto com os custos do financeiro."
        icon={TrendingUp}
      />

      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Descrição *</Label>
              <Input required value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" required value={form.amount} onChange={(e) => set("amount", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input type="date" value={form.receivedDate} onChange={(e) => set("receivedDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REVENUE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Projeto (opcional)</Label>
                <Select
                  value={form.projectId ? String(form.projectId) : "none"}
                  onValueChange={(v) => set("projectId", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cliente (opcional)</Label>
                <Select
                  value={form.clientId ? String(form.clientId) : "none"}
                  onValueChange={(v) => set("clientId", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="kn-btn-primary" disabled={pending}>Salvar</Button>
          <Button type="button" variant="outline" asChild><Link href="/lucro">Cancelar</Link></Button>
          {revenue && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>Excluir</Button>
          )}
        </div>
      </form>
    </div>
  );
}
