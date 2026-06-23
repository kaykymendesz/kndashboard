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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createProjectInfo,
  deleteProjectInfo,
  updateProjectInfo,
  type ProjectInfoInput,
} from "@/lib/actions/project";
import type { ProjectInfo } from "@/lib/db/schema";
import { ConfirmDialog } from "@/components/confirm-dialog";

function InfoForm({
  initial,
  projectId,
  onDone,
}: {
  initial?: ProjectInfo;
  projectId: number;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ProjectInfoInput>(
    initial
      ? {
          section: initial.section,
          field: initial.field,
          value: initial.value,
          notes: initial.notes ?? "",
          projectId,
        }
      : { section: "", field: "", value: "", notes: "", projectId }
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
            toast.error("Erro ao salvar");
          }
        });
      }}
      className="grid gap-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
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
      <Button type="submit" disabled={pending} className="kn-btn-primary">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

export function ProjectInfoEditor({
  projectId,
  items,
}: {
  projectId: number;
  items: ProjectInfo[];
}) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProjectInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectInfo | null>(null);
  const [pending, startTransition] = useTransition();

  const grouped = items.reduce<Record<string, ProjectInfo[]>>((acc, item) => {
    const key = item.section.trim();
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    startTransition(async () => {
      await deleteProjectInfo(id);
      toast.success("Registro excluído");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="kn-btn-primary gap-2" onClick={() => setEditItem(null)}>
              <Plus className="h-4 w-4" /> Novo registro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Editar" : "Novo"} registro</DialogTitle>
            </DialogHeader>
            <InfoForm
              initial={editItem ?? undefined}
              projectId={projectId}
              onDone={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="kn-card p-8 text-center text-muted-foreground text-sm">
          Nenhum detalhe cadastrado. Clique em &quot;Novo registro&quot; para adicionar.
        </Card>
      ) : (
        Object.entries(grouped).map(([section, rows]) => (
          <Card key={section} className="kn-card overflow-hidden">
            <CardHeader className="kn-card-header py-3">
              <CardTitle className="text-sm font-semibold">{section}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/50">
              {rows.map((row) => (
                <div key={row.id} className="flex items-start justify-between gap-4 px-6 py-3 kn-row-hover">
                  <div className="flex-1 grid sm:grid-cols-3 gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">{row.field}</span>
                    <span className="font-medium">{row.value}</span>
                    <span className="text-muted-foreground text-xs">{row.notes}</span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditItem(row);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setDeleteTarget(row)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir registro?"
        description={deleteTarget ? `Remover "${deleteTarget.field}" deste projeto.` : null}
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
