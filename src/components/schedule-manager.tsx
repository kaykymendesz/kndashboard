"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createScheduleItem,
  deleteScheduleItem,
  updateScheduleItem,
  type ScheduleInput,
} from "@/lib/actions/schedule";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";
import type { ScheduleItem } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";

const emptyForm: ScheduleInput = {
  title: "",
  category: "",
  priority: "Média",
  status: "Planejado",
  plannedDate: "",
  responsible: "",
  notes: "",
};

function ScheduleForm({ initial, onDone }: { initial?: ScheduleItem; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ScheduleInput>(
    initial
      ? {
          title: initial.title,
          category: initial.category ?? "",
          priority: initial.priority ?? "Média",
          status: initial.status ?? "Planejado",
          plannedDate: toInputDate(initial.plannedDate),
          plannedValue: String(initial.plannedValue ?? ""),
          actualValue: String(initial.actualValue ?? ""),
          responsible: initial.responsible ?? "",
          notes: initial.notes ?? "",
        }
      : emptyForm
  );

  const set = (key: keyof ScheduleInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            if (initial) await updateScheduleItem(initial.id, form);
            else await createScheduleItem(form);
            toast.success("Salvo com sucesso");
            onDone();
          } catch {
            toast.error("Erro ao salvar");
          }
        });
      }}
      className="grid gap-4"
    >
      <div className="grid gap-2">
        <Label>Item *</Label>
        <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Data prevista</Label>
          <Input type="date" value={form.plannedDate} onChange={(e) => set("plannedDate", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Categoria</Label>
          <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
              {["Planejado", "A fazer", "Analisando", "Futuro", "Finalizado", "Verificar"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Valor previsto (R$)</Label>
          <Input type="number" step="0.01" value={form.plannedValue} onChange={(e) => set("plannedValue", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Valor realizado (R$)</Label>
          <Input type="number" step="0.01" value={form.actualValue} onChange={(e) => set("actualValue", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Responsável</Label>
        <Input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}

export function ScheduleManager({ items }: { items: ScheduleItem[] }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="kn-page">
      <PageHeader
        title="Cronograma"
        description="Marcos estratégicos, prazos e valores previstos vs. realizados."
        icon={Calendar}
      >
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button className="kn-btn-primary gap-2"><Plus className="h-4 w-4" />Novo item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} item</DialogTitle></DialogHeader>
            <ScheduleForm initial={editItem ?? undefined} onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="kn-table-wrap overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Previsto</TableHead>
              <TableHead>Realizado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.plannedDate)}</TableCell>
                <TableCell className="font-medium max-w-[220px]">{item.title}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                <TableCell>{item.plannedValue ? formatCurrency(item.plannedValue) : "—"}</TableCell>
                <TableCell>{item.actualValue ? formatCurrency(item.actualValue) : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditItem(item); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={pending} onClick={() => {
                    if (!confirm("Excluir?")) return;
                    startTransition(async () => { await deleteScheduleItem(item.id); toast.success("Excluído"); });
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
