"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
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
import { deleteVendor } from "@/lib/actions/vendors";
import { formatCurrency } from "@/lib/format";

type VendorRow = {
  id: number;
  name: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  totalSpent: number;
  expenseCount: number;
};

export function VendorsManager({ items }: { items: VendorRow[] }) {
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.category?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Excluir fornecedor?")) return;
    startTransition(async () => {
      await deleteVendor(id);
      toast.success("Fornecedor excluído");
    });
  };

  const totalGeral = items.reduce((s, v) => s + v.totalSpent, 0);

  return (
    <div className="kn-page">
      <PageHeader
        title="Fornecedores"
        description={`Cadastro de fornecedores — total gasto consolidado: ${formatCurrency(totalGeral)} (ver também em Financeiro).`}
        icon={Truck}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/fornecedores/novo"><Plus className="h-4 w-4" />Novo fornecedor</Link>
        </Button>
      </PageHeader>

      <ListSearchBar value={search} onChange={setSearch} placeholder="Buscar fornecedor ou categoria..." />

      <div className="kn-table-wrap overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Total gasto</TableHead>
              <TableHead>Lançamentos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="kn-row-hover">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.email || item.phone || "—"}
                </TableCell>
                <TableCell className="font-semibold tabular-nums">{formatCurrency(item.totalSpent)}</TableCell>
                <TableCell>{item.expenseCount}</TableCell>
                <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" asChild>
                    <Link href={`/fornecedores/${item.id}`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
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
