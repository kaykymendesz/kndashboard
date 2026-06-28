"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Users, FolderKanban } from "lucide-react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteClient } from "@/lib/actions/clients";
import { formatCurrency } from "@/lib/format";

type ClientRow = {
  id: number;
  name: string;
  slug: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  contractValue: string | null;
  projectCount: number;
  activeProjects: number;
};

export function ClientsManager({ items }: { items: ClientRow[] }) {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    );
  }, [items, search]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    startTransition(async () => {
      try {
        await deleteClient(id);
        toast.success("Cliente excluído");
      } catch {
        toast.error("Erro ao excluir");
      }
    });
  };

  return (
    <div className="kn-page">
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes e seus projetos — cada iniciativa nasce como projeto com status único."
        icon={Users}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/clientes/novo"><Plus className="h-4 w-4" />Novo cliente</Link>
        </Button>
      </PageHeader>

      <ListSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nome, empresa ou e-mail..."
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-16 text-center bg-muted/20 mt-4">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">
            {items.length === 0 ? "Nenhum cliente cadastrado." : "Nenhum resultado para a busca."}
          </p>
        </div>
      ) : (
        <div className="kn-table-wrap overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Projetos</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="kn-row-hover">
                  <TableCell className="font-medium">
                    {item.slug ? (
                      <Link href={`/clientes/${item.slug}`} className="hover:text-primary hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>{item.company || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.activeProjects} ativos</span>
                      {item.projectCount > item.activeProjects && (
                        <span className="text-muted-foreground">/ {item.projectCount} total</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{item.email || "—"}</div>
                    {item.phone && <div className="text-xs text-muted-foreground">{item.phone}</div>}
                  </TableCell>
                  <TableCell>
                    {item.contractValue ? formatCurrency(item.contractValue) : "—"}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {item.slug && (
                        <Button size="icon" variant="ghost" asChild title="Ver projetos">
                          <Link href={`/clientes/${item.slug}`}>
                            <FolderKanban className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" asChild title="Editar">
                        <Link href={`/clientes/${item.slug}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        title="Excluir"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir cliente?"
        description={
          deleteTarget ? (
            <>
              <strong>{deleteTarget.name}</strong> e todos os projetos vinculados serão removidos.
            </>
          ) : null
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
