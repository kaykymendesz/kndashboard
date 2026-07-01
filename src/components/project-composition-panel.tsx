import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { FinancialEntry, ProjectComposition, ProjectCompositionLine } from "@/lib/db/schema";
import { entryBalance } from "@/lib/erp-v2/composition";

type Props = {
  composition: ProjectComposition;
  lines: ProjectCompositionLine[];
  receivables: FinancialEntry[];
};

const LINE_TYPE_LABELS: Record<string, string> = {
  infraestrutura: "Infraestrutura",
  mao_obra: "Mão de Obra",
  custo_exclusivo: "Custos Exclusivos",
};

export function ProjectCompositionPanel({ composition, lines, receivables }: Props) {
  const suggested = Number(composition.suggestedPrice ?? 0);
  const negotiated = Number(composition.negotiatedPrice ?? 0);
  const discount = Number(composition.discountAmount ?? 0);
  const discountPct = Number(composition.discountPercent ?? 0);

  const pendingReceivables = receivables.filter((e) => e.status !== "Cancelado" && e.status !== "Quitado");
  const receivedTotal = receivables.reduce((s, e) => s + Number(e.paidAmount ?? 0), 0);
  const pendingTotal = receivables.reduce(
    (s, e) => s + entryBalance(Number(e.originalAmount), Number(e.paidAmount)),
    0
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-xs text-muted-foreground font-medium">Preço sugerido</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold tabular-nums">{formatCurrency(suggested)}</p>
          </CardContent>
        </Card>
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-xs text-muted-foreground font-medium">Valor negociado</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold text-primary tabular-nums">{formatCurrency(negotiated)}</p>
          </CardContent>
        </Card>
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-xs text-muted-foreground font-medium">Desconto concedido</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold tabular-nums">
              {formatCurrency(discount)}
              {discountPct > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({discountPct.toFixed(1)}%)
                </span>
              )}
 
            </p>
            {composition.discountReason && (
              <p className="text-xs text-muted-foreground mt-1">{composition.discountReason}</p>
            )}
          </CardContent>
        </Card>
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-xs text-muted-foreground font-medium">Receita pendente</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xl font-bold tabular-nums">{formatCurrency(pendingTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Recebido: {formatCurrency(receivedTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="kn-card">
        <CardHeader className="kn-card-header">
          <CardTitle className="text-sm font-semibold">Composição financeira</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-sm">
                    Sem linhas de composição registradas.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {LINE_TYPE_LABELS[line.lineType] ?? line.lineType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{line.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(Number(line.compositionValue))}
                    </TableCell>
                  </TableRow>
                ))
              )}
              <TableRow className="font-medium bg-muted/30">
                <TableCell colSpan={2}>Totais por bloco</TableCell>
                <TableCell className="text-right text-xs space-y-0.5">
                  <div>Infra: {formatCurrency(Number(composition.infraTotal))}</div>
                  <div>M.O.: {formatCurrency(Number(composition.laborTotal))}</div>
                  <div>Excl.: {formatCurrency(Number(composition.exclusiveTotal))}</div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {receivables.length > 0 && (
        <Card className="kn-card">
          <CardHeader className="kn-card-header flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Parcelas / recebimentos</CardTitle>
            <Badge variant="secondary">{pendingReceivables.length} pendente(s)</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((entry) => {
                  const original = Number(entry.originalAmount);
                  const paid = Number(entry.paidAmount);
                  const balance = entryBalance(original, paid);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">{entry.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === "Quitado"
                              ? "default"
                              : entry.status === "Parcial"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(original)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(paid)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(balance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
