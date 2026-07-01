"use client";

import { useState, type ReactNode } from "react";
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
import { formatCurrency } from "@/lib/format";
import { FinancialEntryDetailDialog } from "@/components/financial-entry-detail-dialog";
import type { ClientFinancialMovement } from "@/lib/erp-v2/queries";

type Props = {
  clientName: string;
  totalPending: number;
  items: ClientFinancialMovement[];
  trigger: ReactNode;
};

export function ClientPendingDialog({ clientName, totalPending, items, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saldo devedor — {clientName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Total pendente: <strong>{formatCurrency(totalPending)}</strong>
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">Nenhum item pendente.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Item</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">{item.description}</TableCell>
                      <TableCell className="text-sm">{item.projectName}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(item.originalAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(item.paidAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-amber-600">
                        {formatCurrency(item.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEntryId(item.id);
                          }}
                        >
                          Detalhar
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
