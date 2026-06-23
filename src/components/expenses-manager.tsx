"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
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
import { formatCurrency, formatDate } from "@/lib/format";

type ExpenseRow = {
  id: number;
  description: string;
  expenseType: string | null;
  planVariant: string | null;
  contractedPlan: string | null;
  category: string | null;
  purchaseDate: Date | null;
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
        description="Controle de custos anuais, mensais e únicos — rateio por centro de custo e sócios."
        icon={Wallet}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/gastos/novo"><Plus className="h-4 w-4" />Novo gasto</Link>
        </Button>
      </PageHeader>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por descrição, centro de custo, cliente ou categoria..."
      />

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
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="kn-row-hover">
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
