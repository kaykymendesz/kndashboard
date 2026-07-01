"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyStat } from "@/components/stat-card";
import { formatCurrency, formatDate } from "@/lib/format";
import { FinancialEntryDetailDialog } from "@/components/financial-entry-detail-dialog";
import type { ReceivablePendingRow } from "@/lib/erp-v2/queries";
import { Calendar } from "lucide-react";

type Props = {
  total: number;
  items: ReceivablePendingRow[];
};

export function ReceivablesPendingCard({ total, items }: Props) {
  const [open, setOpen] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button type="button" className="text-left w-full">
            <MoneyStat
              title="Contas a receber"
              amount={total}
              icon={Calendar}
              accent="warning"
              description={`${items.length} cobrança(s) com saldo pendente`}
            />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contas a receber — detalhamento</DialogTitle>
          </DialogHeader>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">Nenhuma conta pendente.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell>{item.projectName}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatCurrency(item.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setEntryId(item.id)}>
                          Receber
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FinancialEntryDetailDialog
        entryId={entryId}
        open={entryId != null}
        onOpenChange={(v) => {
          if (!v) setEntryId(null);
        }}
      />
    </>
  );
}
