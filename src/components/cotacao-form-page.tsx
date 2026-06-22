"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
import { updateQuotation } from "@/lib/actions/quotations";
import { QUOTATION_STATUSES, type Client, type Quotation } from "@/lib/db/schema";
import { formatCurrency, toInputDate } from "@/lib/format";

export function CotacaoFormPage({ quotation, client }: { quotation: Quotation; client: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: quotation.title,
    description: quotation.description ?? "",
    value: String(quotation.value ?? 0),
    status: quotation.status ?? "Rascunho",
    validUntil: toInputDate(quotation.validUntil),
    notes: quotation.notes ?? "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateQuotation(
          quotation.id,
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
        toast.success("Cotação atualizada");
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href={`/atendimento/clientes/${client.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {client.name}
      </Link>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        <Badge>{form.status}</Badge>
      </div>
      <p className="text-lg font-semibold text-emerald-800 tabular-nums">{formatCurrency(form.value)}</p>

      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
            </div>
            <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white w-fit" disabled={pending}>
              Salvar
            </Button>
          </CardContent>
        </Card>
      </form>

      <Button variant="outline" asChild className="gap-2">
        <Link href={`/atendimento/clientes/${client.slug}/nova-demanda`}>
          Criar demanda a partir desta cotação <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
