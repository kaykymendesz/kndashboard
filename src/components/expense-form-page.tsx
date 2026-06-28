"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, Plus, Trash2 } from "lucide-react";
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
} from "@/lib/actions/expenses";
import type { ExpenseInput, PlanChangeInput } from "@/lib/expense-input";
import { applyPlanChangeToForm, applyPlanValueToRateio, syncFormRateioFromPlan } from "@/lib/expense-rateio";
import {
  applyVendorPayer,
  payerSelectValue,
  togglePartnerSettled,
  type PartnerPayer,
} from "@/lib/expense-settlement";
import {
  EXPENSE_TYPES,
  PAYMENT_TYPES,
  PAYMENT_RESPONSIBLES,
  REIMBURSEMENT_STATUSES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_RECURRENCES,
  type Client,
  type Expense,
  type ExpensePlanChange,
  type Project,
  type ScheduleItem,
  type Vendor,
} from "@/lib/db/schema";
import { buildCostCenter, filterClientProjectsForExpenses, filterInternalProjects } from "@/lib/cost-center";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  expense?: Expense;
  projects: Project[];
  clients: Client[];
  vendors: Vendor[];
  scheduleItems?: ScheduleItem[];
  planChanges?: ExpensePlanChange[];
  relatedExpenses?: Expense[];
  initialScheduleId?: number | null;
  initialProjectId?: number | null;
};

const emptyForm: ExpenseInput = {
  description: "",
  expenseType: "Único",
  contractedPlan: "",
  contractedPlanValue: "",
  planNotes: "",
  category: "",
  vendor: "",
  vendorId: null,
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
  elaineSettled: false,
  kaykySettled: false,
  elainePending: "0",
  kaykyPending: "0",
  hasCost: true,
  scheduleItemId: null,
  projectId: null,
  clientId: null,
  expenseScope: "kn_interno",
  costCenter: "",
  paymentResponsible: "K&N",
  reimbursementStatus: "Não possui",
  hasSubscription: false,
  subscriptionPlan: "",
  subscriptionRecurrence: "Pagamento único",
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
    vendorId: expense.vendorId ?? null,
    purchaseDate: toInputDate(expense.purchaseDate),
    financialResponsible: expense.financialResponsible ?? "",
    totalValue: String(expense.totalValue ?? 0),
    elaineShare: String(expense.elaineShare ?? 0),
    kaykyShare: String(expense.kaykyShare ?? 0),
    projectId: expense.projectId,
    clientId: expense.clientId,
    expenseScope: expense.expenseScope ?? (expense.clientId ? "projeto_cliente" : "kn_interno"),
    costCenter: expense.costCenter ?? "",
    paymentResponsible: expense.paymentResponsible ?? "K&N",
    reimbursementStatus: expense.reimbursementStatus ?? "Não possui",
    hasSubscription: expense.hasSubscription ?? false,
    subscriptionPlan: expense.subscriptionPlan ?? expense.contractedPlan ?? "",
    subscriptionRecurrence: expense.subscriptionRecurrence ?? expense.expenseType ?? "Pagamento único",
    scheduleItemId: expense.scheduleItemId,
    hasCost: expense.hasCost !== false,
    status: expense.status ?? "Pendente",
    dueDate: toInputDate(expense.dueDate),
    paymentType: expense.paymentType ?? expense.paymentMethod ?? "",
    paymentCard: expense.paymentCard ?? "",
    paidBy: expense.paidBy ?? "",
    elaineSettled: expense.elaineSettled ?? false,
    kaykySettled: expense.kaykySettled ?? false,
    elainePending: String(expense.elainePending ?? 0),
    kaykyPending: String(expense.kaykyPending ?? 0),
    linkedEmail: expense.linkedEmail ?? "",
    registeredBy: expense.registeredBy ?? "",
  };
}

const emptyDraft: PlanChangeInput = { planName: "", planValue: "", changeDate: "", notes: "" };

function collectPlanChangesForSave(form: ExpenseInput, draft: PlanChangeInput): PlanChangeInput[] {
  const list = [...(form.planChanges ?? [])];
  if (draft.planName.trim()) {
    list.push({
      planName: draft.planName.trim(),
      planValue: draft.planValue,
      changeDate: draft.changeDate,
      notes: draft.notes,
    });
  }
  return list;
}

export function ExpenseFormPage({
  expense,
  projects,
  clients,
  vendors,
  scheduleItems = [],
  planChanges = [],
  relatedExpenses = [],
  initialScheduleId,
  initialProjectId,
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
        if (item.projectId) base.projectId = item.projectId;
      }
    }
    if (initialProjectId) {
      const project = projects.find((p) => p.id === initialProjectId);
      if (project) {
        base.projectId = project.id;
        if (project.projectType === "cliente") {
          base.expenseScope = "projeto_cliente";
          base.clientId = project.clientId ?? null;
        } else {
          base.expenseScope = "kn_interno";
        }
      }
    }
    return base;
  });
  const [draftChange, setDraftChange] = useState<PlanChangeInput>(emptyDraft);

  const hasCost = form.hasCost !== false;
  const showCardField = form.paymentType === "Crédito" || form.paymentType === "Débito";
  const planChangesList = form.planChanges ?? [];
  const belongsTo = form.expenseScope === "projeto_cliente" ? "projeto" : "kn";
  const internalProjects = useMemo(() => filterInternalProjects(projects), [projects]);
  const clientProjects = useMemo(
    () => (form.clientId ? filterClientProjectsForExpenses(projects, form.clientId) : []),
    [projects, form.clientId]
  );
  const selectedProject = projects.find((p) => p.id === form.projectId);
  const selectedClient = clients.find((c) => c.id === form.clientId);
  const costCenterPreview =
    form.costCenter || buildCostCenter(selectedProject, selectedClient) || "—";

  const set = (key: keyof ExpenseInput, value: string | number | null | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addPlanChange = () => {
    if (!draftChange.planName.trim()) {
      toast.error("Informe o nome do novo plano.");
      return;
    }
    const change = { ...draftChange, planName: draftChange.planName.trim() };
    setForm((f) => applyPlanChangeToForm(f, change));
    setDraftChange(emptyDraft);
    toast.success("Alteração incluída — clique em Salvar gasto para gravar.");
  };

  const removePlanChange = (index: number) => {
    setForm((f) => {
      const next = {
        ...f,
        planChanges: (f.planChanges ?? []).filter((_, i) => i !== index),
      };
      return syncFormRateioFromPlan(next);
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCost && !form.projectId) {
      toast.error("Selecione o projeto (interno ou de cliente).");
      return;
    }
    if (hasCost && form.expenseScope === "projeto_cliente" && !form.clientId) {
      toast.error("Selecione o cliente do projeto.");
      return;
    }
    const planChangesToSave = collectPlanChangesForSave(form, draftChange);
    startTransition(async () => {
      try {
        if (expense) {
          const savedChanges = await updateExpense(expense.id, form, planChangesToSave);
          setForm((f) => ({ ...f, planChanges: toPlanChanges(savedChanges) }));
          setDraftChange(emptyDraft);
          toast.success("Gasto atualizado");
        } else {
          const row = await createExpense(form, planChangesToSave);
          toast.success("Gasto criado");
          router.push(`/gastos/${row.id}`);
          return;
        }
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar — verifique alterações de plano e tente novamente");
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
        description="Vincule o gasto a um projeto interno ou de cliente. Centro de custo, rateio e reembolso são calculados automaticamente."
        icon={Wallet}
      />

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
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
                <Label>Possui assinatura?</Label>
                <Select
                  value={form.hasSubscription ? "sim" : "nao"}
                  onValueChange={(v) => {
                    const isSub = v === "sim";
                    setForm((f) => ({
                      ...f,
                      hasSubscription: isSub,
                      subscriptionRecurrence: isSub ? f.subscriptionRecurrence || "Mensal" : "Pagamento único",
                      expenseType: isSub
                        ? f.subscriptionRecurrence === "Anual"
                          ? "Anual"
                          : f.subscriptionRecurrence === "Mensal"
                            ? "Mensal"
                            : f.expenseType
                        : "Único",
                    }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data inicial da compra</Label>
                <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
              </div>
            </div>

            {form.hasSubscription && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Plano</Label>
                  <Select
                    value={form.subscriptionPlan || "none"}
                    onValueChange={(v) => {
                      const plan = v === "none" ? "" : v;
                      setForm((f) => ({
                        ...f,
                        subscriptionPlan: plan,
                        contractedPlan: plan,
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {SUBSCRIPTION_PLANS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Recorrência</Label>
                  <Select
                    value={form.subscriptionRecurrence || "Mensal"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        subscriptionRecurrence: v,
                        expenseType: v === "Anual" ? "Anual" : v === "Mensal" ? "Mensal" : f.expenseType,
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_RECURRENCES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {!form.hasSubscription && (
              <div className="grid gap-2 max-w-xs">
                <Label>Tipo de gasto</Label>
                <Select value={form.expenseType} onValueChange={(v) => set("expenseType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Plano contratado {form.hasSubscription ? "(vigente)" : ""}</Label>
                <Input
                  value={form.contractedPlan || form.subscriptionPlan}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      contractedPlan: e.target.value,
                      subscriptionPlan: f.hasSubscription ? e.target.value : f.subscriptionPlan,
                    }))
                  }
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
                  onChange={(e) =>
                    setForm((f) => applyPlanValueToRateio({ ...f, contractedPlanValue: e.target.value }, e.target.value))
                  }
                  placeholder="Ex: 104.23"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Alterações de plano</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Inclua cada mudança de plano com valor e data — o valor mais recente atualiza total e rateio (50/50).
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
              <strong>Plano → rateio:</strong> valor do plano contratado ou da última alteração preenche automaticamente
              total, cota Elaine e cota Kayky (50/50 em projetos internos).{" "}
              <strong>Centro de custo</strong> é definido pelo projeto selecionado.
            </p>

            <div className="grid gap-4 rounded-xl border border-border/70 p-4 bg-muted/20">
              <div className="grid gap-2">
                <Label>Este gasto pertence a</Label>
                <Select
                  value={belongsTo}
                  onValueChange={(v) => {
                    if (v === "kn") {
                      setForm((f) => ({
                        ...f,
                        expenseScope: "kn_interno",
                        clientId: null,
                        projectId: null,
                        reimbursementStatus: "Não possui",
                      }));
                    } else {
                      setForm((f) => ({
                        ...f,
                        expenseScope: "projeto_cliente",
                        projectId: null,
                        clientId: null,
                      }));
                    }
                  }}
                  disabled={!hasCost}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kn">Empresa K&N — projeto interno</SelectItem>
                    <SelectItem value="projeto">Projeto de cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {belongsTo === "kn" ? (
                <div className="grid gap-2">
                  <Label>Projeto interno *</Label>
                  <Select
                    value={form.projectId ? String(form.projectId) : "none"}
                    onValueChange={(v) => {
                      const id = v === "none" ? null : Number(v);
                      setForm((f) => syncFormRateioFromPlan({ ...f, projectId: id, clientId: null, expenseScope: "kn_interno" }));
                    }}
                    disabled={!hasCost}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {internalProjects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Rateio automático: Elaine 50% · Kayky 50%</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Cliente *</Label>
                    <Select
                      value={form.clientId ? String(form.clientId) : "none"}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          clientId: v === "none" ? null : Number(v),
                          projectId: null,
                          expenseScope: "projeto_cliente",
                        }))
                      }
                      disabled={!hasCost}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Projeto *</Label>
                    <Select
                      value={form.projectId ? String(form.projectId) : "none"}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          projectId: v === "none" ? null : Number(v),
                          expenseScope: "projeto_cliente",
                        }))
                      }
                      disabled={!hasCost || !form.clientId}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione</SelectItem>
                        {clientProjects.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.clientId && clientProjects.length === 0 && (
                      <p className="text-[11px] text-amber-600">Nenhum projeto ativo para este cliente.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Centro de custo (automático)</Label>
                <Input readOnly value={costCenterPreview} className="bg-muted/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Responsável pelo pagamento</Label>
                <Select
                  value={form.paymentResponsible ?? "K&N"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      paymentResponsible: v,
                      reimbursementStatus:
                        v === "K&N" && f.expenseScope === "projeto_cliente" && f.reimbursementStatus === "Não possui"
                          ? "Aguardando reembolso"
                          : v !== "K&N"
                            ? "Não possui"
                            : f.reimbursementStatus,
                    }))
                  }
                  disabled={!hasCost}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_RESPONSIBLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Reembolso</Label>
                <Select
                  value={form.reimbursementStatus ?? "Não possui"}
                  onValueChange={(v) => set("reimbursementStatus", v)}
                  disabled={!hasCost || form.paymentResponsible !== "K&N"}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REIMBURSEMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  value={form.vendorId ? String(form.vendorId) : "none"}
                  onValueChange={(v) => {
                    if (v === "none") {
                      setForm((f) => ({ ...f, vendorId: null, vendor: "" }));
                      return;
                    }
                    const selected = vendors.find((item) => String(item.id) === v);
                    setForm((f) => ({
                      ...f,
                      vendorId: Number(v),
                      vendor: selected?.name ?? f.vendor,
                    }));
                  }}
                  disabled={!hasCost}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione ou use texto abaixo</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  disabled={!hasCost}
                  value={form.vendor}
                  onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value, vendorId: null }))}
                  placeholder="Ou digite o nome do fornecedor"
                />
                <Link href="/fornecedores" className="text-[11px] text-primary hover:underline">
                  Gerenciar fornecedores
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 p-4 space-y-4 bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Quem pagou e quitação entre sócios</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Informe quem pagou o fornecedor e marque quando cada sócio quitou a própria cota.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Quem pagou ao fornecedor?</Label>
                  <Select
                    value={payerSelectValue(form.paidBy)}
                    onValueChange={(v) =>
                      setForm((f) =>
                        applyVendorPayer(f, v === "none" ? "" : (v as PartnerPayer))
                      )
                    }
                    disabled={!hasCost}
                  >
                    <SelectTrigger><SelectValue placeholder="Ainda não pago" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ainda não pago</SelectItem>
                      <SelectItem value="Elaine">Elaine pagou</SelectItem>
                      <SelectItem value="Kayky">Kayky pagou</SelectItem>
                      <SelectItem value="Ambos">Ambos pagaram (partes iguais)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status do gasto</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((f) => syncFormRateioFromPlan({ ...f, status: v }))}
                    disabled={!hasCost}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Pago", "Pendente", "Parcial", "Cancelado"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { key: "elaine" as const, label: "Elaine", share: form.elaineShare, pending: form.elainePending, settled: form.elaineSettled },
                    { key: "kayky" as const, label: "Kayky", share: form.kaykyShare, pending: form.kaykyPending, settled: form.kaykySettled },
                  ] as const
                ).map((partner) => (
                  <button
                    key={partner.key}
                    type="button"
                    disabled={!hasCost}
                    onClick={() =>
                      setForm((f) => togglePartnerSettled(f, partner.key, !partner.settled))
                    }
                    className={cn(
                      "rounded-lg border px-4 py-3 text-left transition-colors",
                      partner.settled
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{partner.label}</span>
                      <Badge variant={partner.settled ? "default" : "secondary"} className="text-[10px]">
                        {partner.settled ? "Quitado" : "Pendente"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cota: {formatCurrency(partner.share)} · Pendente: {formatCurrency(partner.pending)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Data de vencimento</Label>
                <Input
                  type="date"
                  disabled={!hasCost}
                  value={form.dueDate ?? ""}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
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
