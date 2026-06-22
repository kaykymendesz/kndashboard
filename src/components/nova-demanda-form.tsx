"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
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
import { createAttendanceCase } from "@/lib/actions/attendance";
import { ATTENDANCE_TYPES, type Client } from "@/lib/db/schema";

export function NovaDemandaForm({ client }: { client: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    demandType: "Novo projeto",
    notes: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const row = await createAttendanceCase(
          {
            clientId: client.id,
            title: form.title,
            description: form.description,
            demandType: form.demandType,
            notes: form.notes,
          },
          client.slug ?? undefined
        );
        toast.success("Demanda registrada");
        router.push(`/atendimento/demandas/${row.id}`);
      } catch {
        toast.error("Erro ao criar demanda");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href={`/atendimento/clientes/${client.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para {client.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-emerald-700" />
          Nova demanda
        </h1>
        <p className="text-muted-foreground mt-1">Cliente: {client.name}</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Título *</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Novo app de delivery" />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={form.demandType} onValueChange={(v) => setForm({ ...form, demandType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="O que o cliente precisa?" />
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white" disabled={pending}>
                {pending ? "Salvando..." : "Registrar demanda"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/atendimento/clientes/${client.slug}`}>Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
