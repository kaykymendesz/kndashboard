"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { updateAttendanceStep } from "@/lib/actions/attendance";
import { PROCESS_STATUSES, type AttendanceCase, type AttendanceStep, type Client } from "@/lib/db/schema";

export function EtapaAtendimentoPage({
  step,
  demand,
  client,
}: {
  step: AttendanceStep;
  demand: AttendanceCase;
  client: Client;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: step.name,
    category: step.category ?? "",
    status: step.status ?? "Pendente",
    notes: step.notes ?? "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateAttendanceStep(
          step.id,
          {
            caseId: demand.id,
            name: form.name,
            category: form.category,
            status: form.status,
            notes: form.notes,
          },
          client.slug ?? undefined
        );
        toast.success("Etapa salva");
        router.push(`/atendimento/demandas/${demand.id}`);
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  return (
    <div className="kn-page space-y-6 max-w-2xl">
      <Link
        href={`/atendimento/demandas/${demand.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {demand.title}
      </Link>

      <div>
        <p className="text-sm text-muted-foreground">{client.name}</p>
        <h1 className="text-2xl font-bold mt-1">{form.name}</h1>
        <Badge className="mt-2">{form.status}</Badge>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Nome da etapa</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
            <div className="grid gap-2">
              <Label>O que foi feito nesta etapa</Label>
              <Textarea rows={6} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Registre o andamento, decisões, contatos com o cliente..." />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="kn-btn-primary" disabled={pending}>
                {pending ? "Salvando..." : "Salvar e voltar"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/atendimento/demandas/${demand.id}`}>Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
