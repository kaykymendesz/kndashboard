"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, Link2, Plus, Trash2 } from "lucide-react";
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
  type PlanChangeInput,
} from "@/lib/actions/expenses";
import {
  EXPENSE_TYPES,
  PAYMENT_TYPES,
  type Client,
  type Expense,
  type ExpensePlanChange,
  type Project,
  type ScheduleItem,
} from "@/lib/db/schema";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";

type Props = {
  expense?: Expense;
  projects: Project[];
  clients: Client[];
  scheduleItems: ScheduleItem[];
  planChanges?: ExpensePlanChange[];
  relatedExpenses?: Expense[];
  initialScheduleId?: number | null;
};

const emptyForm: ExpenseInput = {
  description: "",
  expenseType: "Único",
  contractedPlan: "",
  contractedPlanValue: "",
  planNotes: "",
  category: "",
  vendor: "",
  purchaseDate: "",
  financialResponsible: "",
  totalValue: "0",
  elaineShare: "0",
  kaykyShare: "0",
  status: "Pendente",
  paymentType: "",
  paymentCard: "",
  paidBy: "",
  dueDate: "",
  elainePending: "0",
  kaykyPending: "0",
  hasCost: true,
  scheduleItemId: null,
  projectId: null,
  clientId: null,
  planChanges: [],
};

function toPlanChanges(rows: ExpensePlanChange[]): PlanChangeInput[] {
  return rows.map((r) => ({
    id: r.id,
    planName: r.planName,
    planValue: r.planValue ? String(r.planValue) : "",
    changeDate: toInputDate(r.changeDate),
    notes: r.notes ?? "",
  }));
}

function toForm(expense: Expense, planChanges: ExpensePlanChange[]): ExpenseInput {
  return {
    description: expense.description,
    expenseType: expense.expenseType ?? "Único",
    contractedPlan: expense.contractedPlan ?? expense.planVariant ?? "",
    contractedPlanValue: expense.contractedPlanValue ? String(expense.contractedPlanValue) : "",
    planNotes: expense.planNotes ?? "",
    planChanges: toPlanChanges(planChanges),
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
    paymentType: expense.paymentType ?? expense.paymentMethod ?? "",
    paymentCard: expense.paymentCard ?? "",
    paidBy: expense.paidBy ?? "",
    elainePending: String(expense.elainePending ?? 0),
    kaykyPending: String(expense.kaykyPending ?? 0),
    linkedEmail: expense.linkedEmail ?? "",
    registeredBy: expense.registeredBy ?? "",
  };
}

const emptyDraft: PlanChangeInput = { planName: "", planValue: "", changeDate: "", notes: "" };

export function ExpenseFormPage({
  expense,
  projects,
  clients,
  scheduleItems,
  planChanges = [],
  relatedExpenses = [],
  initialScheduleId,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ExpenseInput>(() => {
    if (expense) return toForm(expense, planChanges);
    const base = { ...emptyForm, planChanges: [] as PlanChangeInput[] };
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
  const [draftChange, setDraftChange] = useState<PlanChangeInput>(emptyDraft);

  const hasCost = form.hasCost !== false;
  const showCardField = form.paymentType === "Crédito" || form.paymentType === "Débito";
  const planChangesList = form.planChanges ?? [];

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

  const addPlanChange = () => {
    if (!draftChange.planName.trim()) {
      toast.error("Informe o nome do novo plano.");
      return;
    }
    setForm((f) => ({
      ...f,
      planChanges: [...(f.planChanges ?? []), { ...draftChange, planName: draftChange.planName.trim() }],
    }));
    setDraftChange(emptyDraft);
    toast.success("Alteração incluída — salve o gasto para gravar.");
  };

  const removePlanChange = (index: number) => {
    setForm((f) => ({
      ...f,
      planChanges: (f.planChanges ?? []).filter((_, i) => i !== index),
    }));
  };

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
        description="Rateio por centro de custo (K&N ou projeto), pagamento, planos e vínculo com cronograma."
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
                <Select value={hasCost ? "sim" : "nao"} onValueChange={(v) => set("hasCost", v === "sim")}>
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
                  Realizado: {linkedSchedule.actualValue ? formatCurrency(linkedSchedule.actualValue) : "—"}
                </p>
              </div>
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
              <Input required value={form.description} onChange={(e) => set("description", e.target.value)} />
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
                <Label>Valor do plano contratado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled={!hasCost}
                  value={form.contractedPlanValue}
                  onChange={(e) => set("contractedPlanValue", e.target.value)}
                  placeholder="Ex: 104.23"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Alterações de plano</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Inclua cada mudança de plano com valor e data — útil quando o serviço muda várias vezes (ex: Pro → Pro+).
                </p>
              </div>

              {planChangesList.length > 0 && (
                <ul className="space-y-2">
                  {planChangesList.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{c.planName}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.planValue ? formatCurrency(c.planValue) : "—"}
                          {c.changeDate ? ` · ${formatDate(c.changeDate)}` : ""}
                        </p>
                      </div>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removePlanChange(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="grid gap-2 sm:col-span-1">
                  <Label>Novo plano</Label>
                  <Input
                    value={draftChange.planName}
                    onChange={(e) => setDraftChange({ ...draftChange, planName: e.target.value })}
                    placeholder="Ex: Pro+"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={draftChange.planValue}
                    onChange={(e) => setDraftChange({ ...draftChange, planValue: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Data do novo plano</Label>
                  <Input
                    type="date"
                    value={draftChange.changeDate}
                    onChange={(e) => setDraftChange({ ...draftChange, changeDate: e.target.value })}
                  />
                </div>
              </div>
              <Button type="button" variant="outline" className="gap-2" onClick={addPlanChange}>
                <Plus className="h-4 w-4" /> Incluir alteração
              </Button>
            </div>

            <div className="grid gap-2">
              <Label>Anotações do plano</Label>
              <Textarea value={form.planNotes} onChange={(e) => set("planNotes", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card className={`kn-card ${!hasCost ? "opacity-60" : ""}`}>
          <CardHeader className="kn-card-header py-4">
            <CardTitle className="text-sm font-semibold">Valores, rateio e pagamento</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-4">
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
              <strong>Centro de custo:</strong> escolha K&N Empresa para gastos operacionais (calculados separados) ou um
              projeto específico (Wikinaya, etc.). <strong>Cliente</strong> só quando o gasto for do cliente — gastos
              internos K&N ficam sem cliente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Centro de custo (rateio)</Label>
                <Select
                  value={form.projectId ? String(form.projectId) : "kn"}
                  onValueChange={(v) => {
                    set("projectId", v === "kn" ? null : Number(v));
                    if (v === "kn") set("clientId", null);
                  }}
                  disabled={!hasCost}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kn">K&N Empresa — gasto geral</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cliente (opcional)</Label>
                <Select
                  value={form.clientId ? String(form.clientId) : "none"}
                  onValueChange={(v) => set("clientId", v === "none" ? null : Number(v))}
                  disabled={!hasCost || !form.projectId}
                >
                  <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente — gasto K&N</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!form.projectId && (
                  <p className="text-[11px] text-muted-foreground">Gasto da empresa — cliente não se aplica.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Valor total pago (R$) {hasCost ? "*" : ""}</Label>
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
                <Label>Tipo de pagamento</Label>
                <Select
                  value={form.paymentType || "none"}
                  onValueChange={(v) => set("paymentType", v === "none" ? "" : v)}
                  disabled={!hasCost}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informado</SelectItem>
                    {PAYMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showCardField && (
                <div className="grid gap-2">
                  <Label>Cartão utilizado</Label>
                  <Input
                    disabled={!hasCost}
                    value={form.paymentCard}
                    onChange={(e) => set("paymentCard", e.target.value)}
                    placeholder="Ex: Nubank Kayky, Visa Elaine"
                  />
                </div>
              )}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <Label>Data de vencimento</Label>
                <Input
                  type="date"
                  disabled={!hasCost}
                  value={form.dueDate ?? ""}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
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
              <Link key={r.id} href={`/gastos/${r.id}`} className="flex items-center justify-between px-6 py-4 kn-row-hover">
                <div>
                  <p className="font-medium text-sm">{formatDate(r.purchaseDate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.contractedPlan || r.expenseType}
                    {r.paymentType ? ` · ${r.paymentType}` : ""}
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
