"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  category: string | null;
  purchaseDate: Date | null;
  totalValue: string | null;
  status: string | null;
  projectName: string;
  clientName: string;
};

export function ExpensesManager({ items }: { items: ExpenseRow[] }) {
  const [pending, startTransition] = useTransition();

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
        description="Controle de custos anuais, mensais e únicos — rateio entre sócios, projetos e clientes."
        icon={Wallet}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/gastos/novo"><Plus className="h-4 w-4" />Novo gasto</Link>
        </Button>
      </PageHeader>

      <div className="kn-table-wrap overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="kn-row-hover">
                <TableCell>
                  <Link href={`/gastos/${item.id}`} className="font-medium text-primary hover:underline">
                    {item.description}
                  </Link>
                </TableCell>
                <TableCell><Badge variant="outline">{item.expenseType ?? "Único"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{item.planVariant || "—"}</TableCell>
                <TableCell className="text-sm">{item.projectName}</TableCell>
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
