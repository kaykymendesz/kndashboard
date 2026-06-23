"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ExpenseDueAlerts } from "@/components/expense-due-alerts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListSearchBar } from "@/components/list-search-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteExpense } from "@/lib/actions/expenses";
import { dueDateLabel, getDueDateUrgency } from "@/lib/expense-due-date";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type ExpenseRow = {
  id: number;
  description: string;
  expenseType: string | null;
  planVariant: string | null;
  contractedPlan: string | null;
  category: string | null;
  purchaseDate: Date | null;
  dueDate: Date | null;
  totalValue: string | null;
  status: string | null;
  paymentType: string | null;
  paymentCard: string | null;
  hasCost: boolean | null;
  projectName: string;
  clientName: string;
  scheduleTitle: string;
};

export function ExpensesManager({ items }: { items: ExpenseRow[] }) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.projectName.toLowerCase().includes(q) ||
        e.clientName.toLowerCase().includes(q) ||
        (e.category?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Excluir este gasto?")) return;
    startTransition(async () => {
      await deleteExpense(id);
      toast.success("Gasto excluído");
    });
  };

  return (
    <div className="kn-page">
      <PageHeader
        title="Gastos"
        description="Controle de custos anuais, mensais e únicos — rateio por centro de custo, vencimentos e alertas."
        icon={Wallet}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/gastos/novo"><Plus className="h-4 w-4" />Novo gasto</Link>
        </Button>
      </PageHeader>

      <ExpenseDueAlerts items={items} />

      <div className="mt-4">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por descrição, centro de custo, cliente ou categoria..."
        />
      </div>

      <div className="kn-table-wrap overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cronograma</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Centro de custo</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Compra</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const urgency = getDueDateUrgency(item.dueDate, item.status);
              const alertLabel = dueDateLabel(item.dueDate, item.status);

              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "kn-row-hover",
                    urgency === "overdue" && "bg-destructive/5",
                    urgency === "due-soon" && "bg-amber-500/5"
                  )}
                >
                  <TableCell>
                    <Link href={`/gastos/${item.id}`} className="font-medium text-primary hover:underline">
                      {item.description}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="outline">{item.expenseType ?? "Único"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.scheduleTitle !== "—" ? item.scheduleTitle : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.contractedPlan || item.planVariant || "—"}
                    {item.hasCost === false && (
                      <Badge variant="secondary" className="ml-1 text-[10px]">Sem custo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{item.projectName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.paymentType || "—"}
                    {item.paymentCard ? ` · ${item.paymentCard}` : ""}
                  </TableCell>
                  <TableCell className="text-sm">{item.clientName}</TableCell>
                  <TableCell>
                    <Link href={`/gastos/${item.id}`} className="hover:text-primary hover:underline">
                      {formatDate(item.purchaseDate)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/gastos/${item.id}`}
                        className={cn(
                          "hover:text-primary hover:underline text-sm",
                          urgency === "overdue" && "text-destructive font-medium",
                          urgency === "due-soon" && "text-amber-700 font-medium"
                        )}
                      >
                        {formatDate(item.dueDate)}
                      </Link>
                      {alertLabel && (
                        <Badge
                          variant={urgency === "overdue" ? "destructive" : "outline"}
                          className={cn(
                            "w-fit text-[10px]",
                            urgency === "due-soon" && "border-amber-500 text-amber-700 bg-amber-500/10"
                          )}
                        >
                          {alertLabel}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.totalValue)}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "Pago" ? "default" : "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" disabled={pending} onClick={(e) => handleDelete(item.id, e)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
