"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { formatCurrency, formatDate } from "@/lib/format";
import { entryBalance } from "@/lib/erp-v2/composition";
import {
  fetchFinancialEntryDetail,
  registerEntryPayment,
} from "@/lib/actions/financial-entries";
import type { FinancialEntryDetail } from "@/lib/erp-v2/queries";

type Props = {
  entryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FinancialEntryDetailDialog({ entryId, open, onOpenChange }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [detail, setDetail] = useState<FinancialEntryDetail | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [notes, setNotes] = useState("");

  const loadDetail = (id: number) => {
    startTransition(async () => {
      try {
        const data = await fetchFinancialEntryDetail(id);
        setDetail(data);
        if (data) {
          const balance = entryBalance(
            Number(data.entry.originalAmount),
            Number(data.entry.paidAmount)
          );
          setAmount(balance > 0 ? balance.toFixed(2) : "");
        }
      } catch {
        toast.error("Erro ao carregar lançamento");
      }
    });
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && entryId) loadDetail(entryId);
    if (!isOpen) {
      setDetail(null);
      setAmount("");
      setNotes("");
    }
  };

  const handlePay = () => {
    if (!entryId) return;
    startTransition(async () => {
      try {
        await registerEntryPayment({
          entryId,
          amount,
          paymentMethod,
          notes,
        });
        toast.success("Pagamento registrado");
        loadDetail(entryId);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao registrar pagamento");
      }
    });
  };

  if (!detail && pending) {
    return (
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent>
          <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const entry = detail?.entry;
  const original = Number(entry?.originalAmount ?? 0);
  const paid = Number(entry?.paidAmount ?? 0);
  const balance = entryBalance(original, paid);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry?.description ?? "Detalhamento financeiro"}</DialogTitle>
        </DialogHeader>

        {entry && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Cliente</p>
                <p className="font-medium">{detail.clientName ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Projeto</p>
                <p className="font-medium">{detail.projectName ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Valor original</p>
                <p className="font-bold tabular-nums">{formatCurrency(original)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Saldo</p>
                <p className="font-bold tabular-nums text-amber-600">{formatCurrency(balance)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Status</p>
                <Badge variant={entry.status === "Quitado" ? "default" : "secondary"}>{entry.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Categoria</p>
                <p>{entry.category || "—"}</p>
              </div>
            </div>

            {balance > 0.009 && (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <p className="text-sm font-semibold">Registrar pagamento parcial</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pay-amount">Valor</Label>
                    <Input
                      id="pay-amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pay-method">Forma</Label>
                    <Input
                      id="pay-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pay-notes">Observações</Label>
                  <Input id="pay-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button onClick={handlePay} disabled={pending} className="kn-btn-primary">
                  Confirmar pagamento
                </Button>
              </div>
            )}

            {detail.payments.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Pagamentos</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Forma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(p.amount)}</TableCell>
                        <TableCell>{p.paymentMethod || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {detail.history.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Histórico</p>
                <div className="space-y-2">
                  {detail.history.map((h) => (
                    <div key={h.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
                      <div>
                        <span className="font-medium capitalize">{h.eventType}</span>
                        {h.note && <span className="text-muted-foreground ml-2">{h.note}</span>}
                      </div>
                      <div className="text-right text-muted-foreground shrink-0 ml-4">
                        {h.amount != null && (
                          <span className="tabular-nums mr-2">{formatCurrency(h.amount)}</span>
                        )}
                        {formatDate(h.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
