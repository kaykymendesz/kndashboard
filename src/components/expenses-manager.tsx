"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createExpense,
  deleteExpense,
  updateExpense,
  type ExpenseInput,
} from "@/lib/actions/expenses";
import { formatCurrency, formatDate, toInputDate } from "@/lib/format";
import type { Expense } from "@/lib/db/schema";

const emptyForm: ExpenseInput = {
  description: "",
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

function ExpenseForm({
  initial,
  onDone,
}: {
  initial?: Expense;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ExpenseInput>(
    initial
      ? {
          description: initial.description,
          category: initial.category ?? "",
          vendor: initial.vendor ?? "",
          purchaseDate: toInputDate(initial.purchaseDate),
          financialResponsible: initial.financialResponsible ?? "",
          totalValue: String(initial.totalValue ?? 0),
          elaineShare: String(initial.elaineShare ?? 0),
          kaykyShare: String(initial.kaykyShare ?? 0),
          status: initial.status ?? "Pendente",
          dueDate: toInputDate(initial.dueDate),
          paymentMethod: initial.paymentMethod ?? "",
          paidBy: initial.paidBy ?? "",
          elainePending: String(initial.elainePending ?? 0),
          kaykyPending: String(initial.kaykyPending ?? 0),
          linkedEmail: initial.linkedEmail ?? "",
          registeredBy: initial.registeredBy ?? "",
        }
      : emptyForm
  );

  const set = (key: keyof ExpenseInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (initial) await updateExpense(initial.id, form);
        else await createExpense(form);
        toast.success(initial ? "Gasto atualizado" : "Gasto adicionado");
        onDone();
      } catch {
        toast.error("Erro ao salvar gasto");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid gap-2">
        <Label>Descrição *</Label>
        <Input required value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Categoria</Label>
          <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Fornecedor</Label>
          <Input value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Data da compra</Label>
          <Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
        </div>
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
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Valor total (R$)</Label>
          <Input type="number" step="0.01" value={form.totalValue} onChange={(e) => set("totalValue", e.target.value)} />
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
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Pendente Elaine</Label>
          <Input type="number" step="0.01" value={form.elainePending} onChange={(e) => set("elainePending", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Pendente Kayky</Label>
          <Input type="number" step="0.01" value={form.kaykyPending} onChange={(e) => set("kaykyPending", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Forma de pagamento</Label>
          <Input value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Pago por</Label>
          <Input value={form.paidBy} onChange={(e) => set("paidBy", e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}

export function ExpensesManager({ items }: { items: Expense[] }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = (id: number) => {
    if (!confirm("Excluir este gasto?")) return;
    startTransition(async () => {
      await deleteExpense(id);
      toast.success("Gasto excluído");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-muted-foreground text-sm">Controle de custos e rateio Elaine / Kayky</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditItem(null)}><Plus className="h-4 w-4 mr-2" />Novo gasto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? "Editar gasto" : "Novo gasto"}</DialogTitle>
            </DialogHeader>
            <ExpenseForm initial={editItem ?? undefined} onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                <TableCell>{formatCurrency(item.totalValue)}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "Pago" ? "default" : "secondary"}>{item.status}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditItem(item); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={pending} onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
