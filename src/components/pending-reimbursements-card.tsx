"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoneyStat } from "@/components/stat-card";
import { formatCurrency } from "@/lib/format";
import { ArrowRightLeft } from "lucide-react";
import type { PendingReimbursement } from "@/lib/project-finance";

type Props = {
  total: number;
  items: PendingReimbursement[];
};

export function PendingReimbursementsCard({ total, items }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-left w-full">
          <MoneyStat
            title="Reembolsos pendentes"
            amount={total}
            icon={ArrowRightLeft}
            accent="warning"
            description={`${items.length} lançamento(s) aguardando devolução dos clientes`}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reembolsos pendentes</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Valores que a K&N já desembolsou e ainda precisa receber dos clientes.
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">Nenhum reembolso pendente.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.clientName}</TableCell>
                    <TableCell>{item.projectName}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.vendor}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(item.totalValue)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/gastos">Ver todos os gastos</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
