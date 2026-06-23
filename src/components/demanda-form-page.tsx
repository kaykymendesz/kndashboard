"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  deleteAttendanceCase,
  updateAttendanceCase,
  type AttendanceCaseInput,
} from "@/lib/actions/attendance";
import { ATTENDANCE_STATUSES, ATTENDANCE_TYPES, type AttendanceCase, type Client } from "@/lib/db/schema";

type Props = {
  demand: AttendanceCase;
  client: Client;
};

export function DemandaFormPage({ demand, client }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    title: demand.title,
    description: demand.description ?? "",
    demandType: demand.demandType ?? "Novo projeto",
    status: demand.status ?? "Aguardando",
    responsible: demand.responsible ?? "",
    notes: demand.notes ?? "",
  });

  const clientSlug = client.slug ?? undefined;
  const backHref = `/atendimento/demandas/${demand.id}`;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const input: Partial<AttendanceCaseInput> = {
          title: form.title,
          description: form.description,
          demandType: form.demandType,
          status: form.status,
          responsible: form.responsible,
          notes: form.notes,
        };
        await updateAttendanceCase(demand.id, input, clientSlug);
        toast.success("Demanda atualizada");
        router.push(backHref);
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAttendanceCase(demand.id, clientSlug);
        toast.success("Demanda excluída");
        router.push(`/atendimento/clientes/${client.slug}`);
        router.refresh();
      } catch {
        toast.error("Erro ao excluir");
      }
    });
  };

  return (
    <div className="kn-page max-w-2xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar à demanda
      </Link>

      <h1 className="text-2xl font-bold mb-6">Editar demanda</h1>

      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Título *</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={form.demandType}
                  onValueChange={(v) => setForm({ ...form, demandType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Responsável</Label>
              <Input
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label>Observações internas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={pending} className="kn-btn-primary">
                {pending ? "Salvando..." : "Salvar alterações"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="gap-2 ml-auto"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Excluir demanda
              </Button>
              <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Excluir demanda?"
                description="Todas as etapas desta demanda também serão removidas."
                confirmLabel="Excluir"
                destructive
                onConfirm={handleDelete}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
