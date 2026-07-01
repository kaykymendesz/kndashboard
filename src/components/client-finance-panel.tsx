"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { FinancialEntryDetailDialog } from "@/components/financial-entry-detail-dialog";
import type { ClientFinancialMovement } from "@/lib/erp-v2/queries";
import { ClientPendingDialog } from "@/components/client-pending-dialog";
import { Wallet } from "lucide-react";

type Props = {
  clientName: string;
  movements: ClientFinancialMovement[];
  pendingItems: ClientFinancialMovement[];
  totalPending: number;
};

export function ClientFinancePanel({
  clientName,
  movements,
  pendingItems,
  totalPending,
}: Props) {
  const [entryId, setEntryId] = useState<number | null>(null);

  const receivables = movements.filter((m) => m.kind === "receber");
  const reimbursements = movements.filter((m) => m.isReimbursable);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="kn-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Saldo devedor</p>
            <ClientPendingDialog
              clientName={clientName}
              totalPending={totalPending}
              items={pendingItems}
              trigger={
                <button type="button" className="text-left w-full mt-1">
                  <p className="text-2xl font-bold tabular-nums text-amber-600 hover:underline">
                    {formatCurrency(totalPending)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Clique para ver composição</p>
                </button>
              }
            />
          </CardContent>
        </Card>
        <Card className="kn-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Recebimentos</p>
            <p className="text-2xl font-bold mt-1">{receivables.length}</p>
          </CardContent>
        </Card>
        <Card className="kn-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase">Reembolsos</p>
            <p className="text-2xl font-bold mt-1">{reimbursements.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="kn-card">
        <CardHeader className="kn-card-header flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Movimentações financeiras
          </CardTitle>
          <Badge variant="secondary">{movements.length} lançamento(s)</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Nenhuma movimentação financeira vinculada a este cliente ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id} className="kn-row-hover">
                      <TableCell className="text-sm">{formatDate(m.createdAt)}</TableCell>
                      <TableCell className="font-medium text-sm">{m.description}</TableCell>
                      <TableCell className="text-sm">{m.projectName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.category || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(m.originalAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(m.balance)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setEntryId(m.id)}>
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FinancialEntryDetailDialog
        entryId={entryId}
        open={entryId != null}
        onOpenChange={(v) => {
          if (!v) setEntryId(null);
        }}
      />
    </div>
  );
}
