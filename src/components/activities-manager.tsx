"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ListTodo } from "lucide-react";
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
  createActivity,
  deleteActivity,
  updateActivity,
  type ActivityInput,
} from "@/lib/actions/activities";
import type { Activity } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";

const emptyForm: ActivityInput = {
  externalId: "",
  area: "",
  feature: "",
  description: "",
  status: "A fazer",
  priority: "Média",
  responsible: "",
  notes: "",
};

function ActivityForm({ initial, onDone }: { initial?: Activity; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ActivityInput>(
    initial
      ? {
          externalId: initial.externalId ?? "",
          area: initial.area,
          feature: initial.feature,
          description: initial.description ?? "",
          status: initial.status,
          priority: initial.priority,
          responsible: initial.responsible ?? "",
          notes: initial.notes ?? "",
        }
      : emptyForm
  );

  const set = (key: keyof ActivityInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            if (initial) await updateActivity(initial.id, form);
            else await createActivity(form);
            toast.success(initial ? "Atividade atualizada" : "Atividade criada");
            onDone();
          } catch {
            toast.error("Erro ao salvar");
          }
        });
      }}
      className="grid gap-4 max-h-[70vh] overflow-y-auto"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>ID</Label>
          <Input value={form.externalId} onChange={(e) => set("externalId", e.target.value)} placeholder="WK-001" />
        </div>
        <div className="grid gap-2">
          <Label>Área</Label>
          <Input required value={form.area} onChange={(e) => set("area", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Funcionalidade *</Label>
        <Input required value={form.feature} onChange={(e) => set("feature", e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>Descrição</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Funcionando", "Erro", "Ajuste", "Fazer", "Planejamento", "Em estudo", "Ideia", "Ativo", "A fazer"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <Label>Responsável</Label>
          <Input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}

const statusColor = (status: string) => {
  if (status === "Funcionando" || status === "Ativo") return "default";
  if (status === "Erro") return "destructive";
  return "secondary";
};

export function ActivitiesManager({ items }: { items: Activity[] }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Activity | null>(null);
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = items.filter(
    (a) =>
      !filter ||
      a.feature.toLowerCase().includes(filter.toLowerCase()) ||
      a.area.toLowerCase().includes(filter.toLowerCase()) ||
      (a.externalId ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="kn-page">
      <PageHeader
        title="Atividades"
        description={`${items.length} itens cadastrados — acompanhamento de funcionalidades e status do projeto.`}
        icon={ListTodo}
      >
        <div className="flex gap-2">
          <Input placeholder="Buscar..." value={filter} onChange={(e) => setFilter(e.target.value)} className="kn-input w-48" />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null); }}>
            <DialogTrigger asChild>
              <Button className="kn-btn-primary gap-2"><Plus className="h-4 w-4" />Nova</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? "Editar" : "Nova"} atividade</DialogTitle></DialogHeader>
              <ActivityForm initial={editItem ?? undefined} onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="kn-table-wrap overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Funcionalidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.externalId}</TableCell>
                <TableCell>{item.area}</TableCell>
                <TableCell className="max-w-[200px] truncate">{item.feature}</TableCell>
                <TableCell><Badge variant={statusColor(item.status) as "default" | "destructive" | "secondary"}>{item.status}</Badge></TableCell>
                <TableCell>{item.priority}</TableCell>
                <TableCell>{item.responsible}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditItem(item); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={pending} onClick={() => {
                    if (!confirm("Excluir?")) return;
                    startTransition(async () => { await deleteActivity(item.id); toast.success("Excluído"); });
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
