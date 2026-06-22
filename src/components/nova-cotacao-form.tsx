"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
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
import { createQuotation } from "@/lib/actions/quotations";
import { QUOTATION_STATUSES, type Client } from "@/lib/db/schema";

export function NovaCotacaoForm({ client }: { client: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    value: "0",
    status: "Rascunho",
    validUntil: "",
    notes: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const row = await createQuotation(
          {
            clientId: client.id,
            title: form.title,
            description: form.description,
            value: form.value,
            status: form.status,
            validUntil: form.validUntil,
            notes: form.notes,
          },
          client.slug ?? undefined
        );
        toast.success("Cotação criada");
        router.push(`/atendimento/cotacoes/${row.id}`);
      } catch {
        toast.error("Erro ao criar cotação");
      }
    });
  };

  return (
    <div className="kn-page space-y-6 max-w-2xl">
      <Link
        href={`/atendimento/clientes/${client.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para {client.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Nova cotação
        </h1>
        <p className="text-muted-foreground mt-1">Cliente: {client.name}</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Título *</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Validade</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUOTATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="kn-btn-primary" disabled={pending}>
                {pending ? "Salvando..." : "Salvar cotação"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
