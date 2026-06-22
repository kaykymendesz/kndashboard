"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInput,
} from "@/lib/actions/expenses";
import { EXPENSE_TYPES, type Client, type Expense, type Project } from "@/lib/db/schema";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";

type Props = {
  expense?: Expense;
  projects: Project[];
  clients: Client[];
  relatedExpenses?: Expense[];
};

const emptyForm: ExpenseInput = {
  description: "",
  expenseType: "Único",
  planVariant: "",
  planNotes: "",
  category: "",
  vendor: "",
  purchaseDate: "",
  financialResponsible: "",
  totalValue: "0",
  elaineShare: "0",
  kaykyShare: "0",
  status: "Pendente",
  paymentMethod: "",
  paidBy: "",
  elainePending: "0",
  kaykyPending: "0",
};

function toForm(expense: Expense): ExpenseInput {
  return {
    description: expense.description,
    expenseType: expense.expenseType ?? "Único",
    planVariant: expense.planVariant ?? "",
    planNotes: expense.planNotes ?? "",
    category: expense.category ?? "",
    vendor: expense.vendor ?? "",
    purchaseDate: toInputDate(expense.purchaseDate),
    financialResponsible: expense.financialResponsible ?? "",
    totalValue: String(expense.totalValue ?? 0),
    elaineShare: String(expense.elaineShare ?? 0),
    kaykyShare: String(expense.kaykyShare ?? 0),
    projectId: expense.projectId,
    clientId: expense.clientId,
    status: expense.status ?? "Pendente",
    dueDate: toInputDate(expense.dueDate),
    paymentMethod: expense.paymentMethod ?? "",
    paidBy: expense.paidBy ?? "",
    elainePending: String(expense.elainePending ?? 0),
    kaykyPending: String(expense.kaykyPending ?? 0),
    linkedEmail: expense.linkedEmail ?? "",
    registeredBy: expense.registeredBy ?? "",
  };
}

export function ExpenseFormPage({ expense, projects, clients, relatedExpenses = [] }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ExpenseInput>(expense ? toForm(expense) : emptyForm);

  const set = (key: keyof ExpenseInput, value: string | number | null | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (expense) {
          await updateExpense(expense.id, form);
          toast.success("Gasto atualizado");
        } else {
          const row = await createExpense(form);
          toast.success("Gasto criado");
          router.push(`/gastos/${row.id}`);
          return;
        }
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    if (!expense || !confirm("Excluir este gasto?")) return;
    startTransition(async () => {
      await deleteExpense(expense.id);
      toast.success("Gasto excluído");
      router.push("/gastos");
    });
  };

  return (
    <div className="kn-page">
      <Link href="/gastos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Gastos
      </Link>

      <PageHeader
        title={expense ? "Editar gasto" : "Novo gasto"}
        description="Registre gastos anuais, mensais ou únicos. Use plano/variante para anotar mudanças (ex: Cursor IA Pro → Pro+)."
        icon={Wallet}
      />

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-4">
            <CardTitle className="text-sm font-semibold">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Nome / Descrição *</Label>
              <Input required value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ex: Cursor IA" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de gasto *</Label>
                <Select value={form.expenseType} onValueChange={(v) => set("expenseType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Plano / Variante</Label>
                <Input value={form.planVariant} onChange={(e) => set("planVariant", e.target.value)} placeholder="Ex: Pro, Pro+" />
              </div>
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Anotações do plano</Label>
              <Textarea
                value={form.planNotes}
                onChange={(e) => set("planNotes", e.target.value)}
                placeholder="Ex: 1º mês plano Pro R$ X; mês seguinte migrou para Pro+ R$ Y"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="kn-card">
          <CardHeader className="kn-card-header py-4">
            <CardTitle className="text-sm font-semibold">Valores e vínculos</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Projeto</Label>
                <Select
                  value={form.projectId ? String(form.projectId) : "none"}
                  onValueChange={(v) => set("projectId", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="K&N Empresa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">K&N Empresa</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Select
                  value={form.clientId ? String(form.clientId) : "none"}
                  onValueChange={(v) => set("clientId", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Valor total (R$) *</Label>
                <Input type="number" step="0.01" required value={form.totalValue} onChange={(e) => set("totalValue", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Cota Elaine</Label>
                <Input type="number" step="0.01" value={form.elaineShare} onChange={(e) => set("elaineShare", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Cota Kayky</Label>
                <Input type="number" step="0.01" value={form.kaykyShare} onChange={(e) => set("kaykyShare", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Fornecedor</Label>
                <Input value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Pago", "Pendente", "Parcial", "Cancelado"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Pago por</Label>
                <Input value={form.paidBy} onChange={(e) => set("paidBy", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="kn-btn-primary min-h-11" disabled={pending}>
            {pending ? "Salvando..." : "Salvar gasto"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/gastos">Cancelar</Link>
          </Button>
          {expense && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Excluir
            </Button>
          )}
        </div>
      </form>

      {relatedExpenses.length > 0 && (
        <Card className="kn-card mt-8">
          <CardHeader className="kn-card-header py-4">
            <CardTitle className="text-sm font-semibold">Outros lançamentos: {expense?.description}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {relatedExpenses.map((r) => (
              <Link
                key={r.id}
                href={`/gastos/${r.id}`}
                className="flex items-center justify-between px-6 py-4 kn-row-hover"
              >
                <div>
                  <p className="font-medium text-sm">{formatDate(r.purchaseDate)}</p>
                  <p className="text-xs text-muted-foreground">{r.planVariant || r.expenseType}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{formatCurrency(r.totalValue)}</p>
                  <Badge variant="secondary" className="text-[10px]">{r.status}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
