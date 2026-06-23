"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, Link2 } from "lucide-react";
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
import { EXPENSE_TYPES, type Client, type Expense, type Project, type ScheduleItem } from "@/lib/db/schema";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";

type Props = {
  expense?: Expense;
  projects: Project[];
  clients: Client[];
  scheduleItems: ScheduleItem[];
  relatedExpenses?: Expense[];
  initialScheduleId?: number | null;
};

const emptyForm: ExpenseInput = {
  description: "",
  expenseType: "Único",
  contractedPlan: "",
  planChangeVariant: "",
  planChangeDate: "",
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
  hasCost: true,
  scheduleItemId: null,
};

function toForm(expense: Expense): ExpenseInput {
  return {
    description: expense.description,
    expenseType: expense.expenseType ?? "Único",
    contractedPlan: expense.contractedPlan ?? expense.planVariant ?? "",
    planChangeVariant: expense.planChangeVariant ?? "",
    planChangeDate: toInputDate(expense.planChangeDate),
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
    scheduleItemId: expense.scheduleItemId,
    hasCost: expense.hasCost !== false,
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

export function ExpenseFormPage({ expense, projects, clients, scheduleItems, relatedExpenses = [], initialScheduleId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ExpenseInput>(() => {
    if (expense) return toForm(expense);
    const base = { ...emptyForm };
    if (initialScheduleId) {
      const item = scheduleItems.find((s) => s.id === initialScheduleId);
      if (item) {
        base.scheduleItemId = item.id;
        base.description = item.title;
        base.category = item.category ?? "";
        base.hasCost = true;
        if (item.plannedValue) base.totalValue = String(item.plannedValue);
      }
    }
    return base;
  });
  const hasCost = form.hasCost !== false;

  const set = (key: keyof ExpenseInput, value: string | number | null | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const applyScheduleItem = (scheduleId: string) => {
    if (scheduleId === "none") {
      set("scheduleItemId", null);
      return;
    }
    const item = scheduleItems.find((s) => String(s.id) === scheduleId);
    if (!item) return;
    setForm((f) => ({
      ...f,
      scheduleItemId: item.id,
      description: f.description || item.title,
      category: f.category || item.category || "",
      totalValue: f.totalValue === "0" && item.plannedValue ? String(item.plannedValue) : f.totalValue,
    }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (expense) {
          await updateExpense(expense.id, form);
          toast.success("Gasto atualizado — cronograma sincronizado quando vinculado");
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

  const linkedSchedule = form.scheduleItemId
    ? scheduleItems.find((s) => s.id === form.scheduleItemId)
    : null;

  return (
    <div className="kn-page">
      <Link href="/gastos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Gastos
      </Link>

      <PageHeader
        title={expense ? "Editar gasto" : "Novo gasto"}
        description="Gastos conversam com o cronograma: vincule itens com custo e o valor realizado é atualizado automaticamente."
        icon={Wallet}
      />

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Vínculo com cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Item do cronograma (somente com custo)</Label>
                <Select
                  value={form.scheduleItemId ? String(form.scheduleItemId) : "none"}
                  onValueChange={applyScheduleItem}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum — gasto avulso" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum — gasto avulso</SelectItem>
                    {scheduleItems.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.title}
                        {s.plannedValue ? ` · prev. ${formatCurrency(s.plannedValue)}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Este gasto tem custo financeiro?</Label>
                <Select
                  value={hasCost ? "sim" : "nao"}
                  onValueChange={(v) => set("hasCost", v === "sim")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim — entra no financeiro</SelectItem>
                    <SelectItem value="nao">Não — registro sem valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {linkedSchedule && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <p className="font-medium text-primary">{linkedSchedule.title}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Previsto: {linkedSchedule.plannedValue ? formatCurrency(linkedSchedule.plannedValue) : "—"} ·{" "}
                  Realizado no cronograma: {linkedSchedule.actualValue ? formatCurrency(linkedSchedule.actualValue) : "—"}
                </p>
                <Link href={`/cronograma/${linkedSchedule.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                  Abrir no cronograma
                </Link>
              </div>
            )}
            {!hasCost && (
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                Gastos sem custo não entram nos totais do financeiro — útil para marcos do cronograma sem valor.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="kn-card">
          <CardHeader className="kn-card-header py-4">
            <CardTitle className="text-sm font-semibold">Identificação e plano</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Nome / Descrição *</Label>
              <Input required value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ex: Cursor IA" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label>Data inicial da compra</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Plano contratado</Label>
                <Input
                  value={form.contractedPlan}
                  onChange={(e) => set("contractedPlan", e.target.value)}
                  placeholder="Ex: Pro, Business"
                />
              </div>
              <div className="grid gap-2">
                <Label>Alteração de plano</Label>
                <Input
                  value={form.planChangeVariant}
                  onChange={(e) => set("planChangeVariant", e.target.value)}
                  placeholder="Ex: migrou para Pro+"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Data da alteração de plano</Label>
              <Input type="date" value={form.planChangeDate} onChange={(e) => set("planChangeDate", e.target.value)} />
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

        <Card className={`kn-card ${!hasCost ? "opacity-60" : ""}`}>
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
                  disabled={!hasCost}
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
                  disabled={!hasCost}
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
                <Label>Valor total (R$) {hasCost ? "*" : ""}</Label>
                <Input
                  type="number"
                  step="0.01"
                  required={hasCost}
                  disabled={!hasCost}
                  value={form.totalValue}
                  onChange={(e) => set("totalValue", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cota Elaine</Label>
                <Input type="number" step="0.01" disabled={!hasCost} value={form.elaineShare} onChange={(e) => set("elaineShare", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Cota Kayky</Label>
                <Input type="number" step="0.01" disabled={!hasCost} value={form.kaykyShare} onChange={(e) => set("kaykyShare", e.target.value)} />
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
                <Select value={form.status} onValueChange={(v) => set("status", v)} disabled={!hasCost}>
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
                <Input disabled={!hasCost} value={form.paidBy} onChange={(e) => set("paidBy", e.target.value)} />
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
                  <p className="text-xs text-muted-foreground">
                    {r.contractedPlan || r.planVariant || r.expenseType}
                    {r.planChangeVariant ? ` → ${r.planChangeVariant}` : ""}
                  </p>
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
