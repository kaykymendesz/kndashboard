"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectInfo,
  deleteProjectInfo,
  updateProjectInfo,
  type ProjectInfoInput,
} from "@/lib/actions/project";
import type { ProjectInfo } from "@/lib/db/schema";

function ProjectForm({ initial, onDone }: { initial?: ProjectInfo; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ProjectInfoInput>(
    initial
      ? { section: initial.section, field: initial.field, value: initial.value, notes: initial.notes ?? "" }
      : { section: "", field: "", value: "", notes: "" }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            if (initial) await updateProjectInfo(initial.id, form);
            else await createProjectInfo(form);
            toast.success("Salvo");
            onDone();
          } catch {
            toast.error("Erro");
          }
        });
      }}
      className="grid gap-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Seção</Label>
          <Input required value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Campo</Label>
          <Input required value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Informação</Label>
        <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}

export function ProjectInfoManager({ items }: { items: ProjectInfo[] }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProjectInfo | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = items.reduce<Record<string, ProjectInfo[]>>((acc, item) => {
    const key = item.section.trim();
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dados da Empresa</h1>
          <p className="text-muted-foreground text-sm">Informações jurídicas, marca, infraestrutura e mais</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo registro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} registro</DialogTitle></DialogHeader>
            <ProjectForm initial={editItem ?? undefined} onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([section, rows]) => (
        <div key={section} className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 font-semibold bg-muted/30">{section}</div>
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="flex-1 grid sm:grid-cols-3 gap-2">
                  <div className="text-sm font-medium text-muted-foreground">{row.field}</div>
                  <div className="text-sm font-medium">{row.value}</div>
                  <div className="text-sm text-muted-foreground">{row.notes}</div>
                </div>
                <div className="flex shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setEditItem(row); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={pending} onClick={() => {
                    if (!confirm("Excluir?")) return;
                    startTransition(async () => { await deleteProjectInfo(row.id); toast.success("Excluído"); });
                  }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
