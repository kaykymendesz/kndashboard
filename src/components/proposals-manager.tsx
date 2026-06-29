"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Plus, Trash2, BookOpen, Layers } from "lucide-react";
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
import { deleteProposal } from "@/lib/actions/proposals";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CommercialProposal } from "@/lib/db/schema";

function statusVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Aprovada") return "default";
  if (status === "Recusada" || status === "Cancelada") return "destructive";
  if (status === "Enviada" || status === "Em negociação") return "secondary";
  return "outline";
}

export function ProposalsManager({ items }: { items: CommercialProposal[] }) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.proposalNumber.toLowerCase().includes(q) ||
        (p.clientName?.toLowerCase().includes(q) ?? false) ||
        (p.projectName?.toLowerCase().includes(q) ?? false) ||
        (p.status?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Excluir esta proposta?")) return;
    startTransition(async () => {
      await deleteProposal(id);
      toast.success("Proposta excluída");
    });
  };

  return (
    <div className="kn-page">
      <PageHeader
        title="Propostas Comerciais"
        description="Gere propostas padronizadas com layout oficial K&N — PDF, Word e conversão em projeto."
        icon={FileText}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/propostas/nova">
            <Plus className="h-4 w-4" /> Nova proposta
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/propostas/catalogo"><BookOpen className="h-4 w-4" /> Catálogo</Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/propostas/templates"><Layers className="h-4 w-4" /> Modelos</Link>
        </Button>
      </PageHeader>

      <div className="mt-4">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por número, cliente, projeto ou status..."
        />
      </div>

      <div className="kn-table-wrap overflow-x-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma proposta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/propostas/${p.id}`} className="font-medium text-primary hover:underline">
                      {p.proposalNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{p.clientName || p.clientCompany || "—"}</TableCell>
                  <TableCell>{p.projectName || "—"}</TableCell>
                  <TableCell>{formatCurrency(p.totalValue)}</TableCell>
                  <TableCell>{formatDate(p.issuedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={pending}
                      onClick={(e) => handleDelete(p.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
