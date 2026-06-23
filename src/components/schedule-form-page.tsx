"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  type ScheduleInput,
} from "@/lib/actions/schedule";
import type { ProcessFlow, ScheduleItem } from "@/lib/db/schema";
import { toInputDate } from "@/lib/format";

type Props = {
  item?: ScheduleItem;
  statusOptions: string[];
  flows: ProcessFlow[];
};

const emptyForm: ScheduleInput = {
  title: "",
  description: "",
  category: "",
  priority: "Média",
  status: "Planejado",
  plannedDate: "",
  responsible: "",
  notes: "",
  hasCost: false,
};

export function ScheduleFormPage({ item, statusOptions, flows }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ScheduleInput>(
    item
      ? {
          title: item.title,
          description: item.description ?? "",
          category: item.category ?? "",
          priority: item.priority ?? "Média",
          status: item.status ?? "Planejado",
          plannedDate: toInputDate(item.plannedDate),
          plannedValue: String(item.plannedValue ?? ""),
          actualValue: String(item.actualValue ?? ""),
          responsible: item.responsible ?? "",
          notes: item.notes ?? "",
          flowId: item.flowId,
          hasCost: item.hasCost === true,
        }
      : emptyForm
  );

  const set = (key: keyof ScheduleInput, value: string | number | null | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (item) {
          await updateScheduleItem(item.id, form);
          toast.success("Item atualizado");
          router.push(`/cronograma/${item.id}`);
        } else {
          const row = await createScheduleItem(form);
          toast.success("Item criado");
          router.push(`/cronograma/${row.id}`);
        }
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    if (!item || !confirm("Excluir este item do cronograma?")) return;
    startTransition(async () => {
      await deleteScheduleItem(item.id);
      toast.success("Item excluído");
      router.push("/cronograma");
    });
  };

  return (
    <div className="kn-page">
      <Link href={item ? `/cronograma/${item.id}` : "/cronograma"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <PageHeader
        title={item ? "Editar item" : "Novo item do cronograma"}
        description="Cadastre marcos com descrição completa. Os processos serão criados a partir do fluxo selecionado."
        icon={Calendar}
      />

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Título *</Label>
              <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição completa</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data prevista</Label>
                <Input type="date" value={form.plannedDate} onChange={(e) => set("plannedDate", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Crítica", "Alta", "Média", "Baixa"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!item && flows.length > 0 && (
              <div className="grid gap-2">
                <Label>Fluxo de processos</Label>
                <Select
                  value={form.flowId ? String(form.flowId) : String(flows.find((f) => f.isDefault)?.id ?? flows[0]?.id)}
                  onValueChange={(v) => set("flowId", Number(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {flows.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Item com custo financeiro?</Label>
                <Select
                  value={form.hasCost ? "sim" : "nao"}
                  onValueChange={(v) => set("hasCost", v === "sim")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim — aparece em Gastos e financeiro</SelectItem>
                    <SelectItem value="nao">Não — marco sem valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Responsável</Label>
                <Input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} />
              </div>
            </div>
            {form.hasCost && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valor previsto (R$)</Label>
                <Input type="number" step="0.01" value={form.plannedValue} onChange={(e) => set("plannedValue", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Valor realizado (R$)</Label>
                <Input type="number" step="0.01" value={form.actualValue} onChange={(e) => set("actualValue", e.target.value)} />
              </div>
            </div>
            )}
            {!form.hasCost && (
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                Itens sem custo não aparecem ao vincular um gasto — apenas marcos de acompanhamento.
              </p>
            )}
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="kn-btn-primary min-h-11" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          {item && (
            <>
              <Button type="button" variant="outline" asChild>
                <Link href={`/cronograma/${item.id}`}>Cancelar</Link>
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
                Excluir
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
