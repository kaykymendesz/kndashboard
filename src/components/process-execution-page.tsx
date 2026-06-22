"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
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
import {
  createScheduleProcess,
  updateScheduleProcess,
  deleteScheduleProcess,
  type ScheduleProcessInput,
} from "@/lib/actions/schedule-processes";
import { PROCESS_STATUSES, type ScheduleItem, type ScheduleProcess } from "@/lib/db/schema";

type Props = {
  scheduleItem: ScheduleItem;
  process?: ScheduleProcess;
  categoryOptions: string[];
  isNew?: boolean;
};

export function ProcessExecutionPage({ scheduleItem, process, categoryOptions, isNew }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: process?.name ?? "",
    category: process?.category ?? categoryOptions[0] ?? "",
    status: process?.status ?? "Pendente",
    notes: process?.notes ?? "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (isNew) {
          const input: ScheduleProcessInput = {
            scheduleItemId: scheduleItem.id,
            name: form.name,
            category: form.category,
            status: form.status,
            notes: form.notes,
          };
          const row = await createScheduleProcess(input);
          toast.success("Processo criado");
          router.push(`/cronograma/${scheduleItem.id}/processos/${row.id}`);
        } else if (process) {
          await updateScheduleProcess(process.id, {
            scheduleItemId: scheduleItem.id,
            name: form.name,
            category: form.category,
            status: form.status,
            notes: form.notes,
          });
          toast.success("Processo atualizado");
          router.refresh();
        }
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    if (!process || !confirm("Excluir este processo?")) return;
    startTransition(async () => {
      await deleteScheduleProcess(process.id);
      toast.success("Processo excluído");
      router.push(`/cronograma/${scheduleItem.id}`);
    });
  };

  return (
    <div className="kn-page">
      <Link href={`/cronograma/${scheduleItem.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para {scheduleItem.title}
      </Link>

      <PageHeader
        title={isNew ? "Novo processo" : form.name || "Processo"}
        description={`Item: ${scheduleItem.title}`}
        icon={GitBranch}
      />

      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Nome do processo *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input
                  list="process-categories"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Digite ou escolha uma categoria"
                />
                <datalist id="process-categories">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROCESS_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notas / execução</Label>
              <Textarea rows={6} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Descreva o que foi feito neste processo..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="kn-btn-primary min-h-11" disabled={pending}>
            {pending ? "Salvando..." : "Salvar processo"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/cronograma/${scheduleItem.id}`}>Cancelar</Link>
          </Button>
          {process && !isNew && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Excluir
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
