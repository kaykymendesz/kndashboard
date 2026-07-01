"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { registerPartnerPartialPayment } from "@/lib/actions/partner-settlements";
import type { PartnerPendingItem, PartnerSlug } from "@/lib/erp-v2/queries";
import { AlertTriangle } from "lucide-react";

type Props = {
  partnerSlug: PartnerSlug;
  partnerName: string;
  total: number;
  items: PartnerPendingItem[];
};

export function PartnerPendingDialog({ partnerSlug, partnerName, total, items }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const selected = items.find((i) => i.expenseId === selectedId);

  const handlePay = () => {
    if (!selectedId) return;
    startTransition(async () => {
      try {
        await registerPartnerPartialPayment({
          expenseId: selectedId,
          partnerSlug,
          amount,
          notes,
        });
        toast.success("Pagamento registrado");
        setSelectedId(null);
        setAmount("");
        setNotes("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao registrar");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-left w-full">
          <MoneyStat
            title={`Pendente ${partnerName.split(" ")[0]}`}
            amount={total}
            icon={AlertTriangle}
            accent="warning"
            description={`${items.length} item(ns) — clique para detalhar`}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pendências — {partnerName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Saldo total pendente: <strong className="text-foreground">{formatCurrency(total)}</strong>
        </p>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">Nenhuma pendência registrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Descrição</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.expenseId}>
                    <TableCell>
                      <Link href={`/gastos/${item.expenseId}`} className="font-medium hover:text-primary hover:underline">
                        {item.description}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{item.projectName}</TableCell>
                    <TableCell className="text-sm">{item.vendor}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(item.originalShare)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(item.paidShare)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-amber-600">
                      {formatCurrency(item.pendingShare)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedId(item.expenseId);
                          setAmount(item.pendingShare.toFixed(2));
                        }}
                      >
                        Pagar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selected && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/20 mt-4">
            <p className="text-sm font-semibold">Pagamento parcial — {selected.description}</p>
            <p className="text-xs text-muted-foreground">
              Saldo: {formatCurrency(selected.pendingShare)}
              {selected.purchaseDate && ` · ${formatDate(selected.purchaseDate)}`}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Valor</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>Observações</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePay} disabled={pending} className="kn-btn-primary">
                Confirmar
              </Button>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
