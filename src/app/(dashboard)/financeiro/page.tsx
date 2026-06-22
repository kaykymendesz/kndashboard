import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyStat } from "@/components/stat-card";
import { getFinancialSummary } from "@/lib/queries/dashboard";
import { formatCurrency } from "@/lib/format";
import { Wallet, Users } from "lucide-react";
import { FinancialCharts } from "@/components/financial-charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function FinanceiroPage() {
  const { expenses, monthlyData, totals } = await getFinancialSummary();

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category || "Outros";
    acc[cat] = (acc[cat] ?? 0) + Number(e.totalValue ?? 0);
    return acc;
  }, {});

  const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Resumo Financeiro</h1>
        <p className="text-muted-foreground text-sm">
          Cronograma registra o previsto; Gastos registra o realizado.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MoneyStat title="Total investido" amount={totals.invested} icon={Wallet} />
        <MoneyStat title="Cota Elaine" amount={totals.elaineShare} icon={Users} />
        <MoneyStat title="Cota Kayky" amount={totals.kaykyShare} icon={Users} />
        <MoneyStat title="Total pendente" amount={totals.elainePending + totals.kaykyPending} icon={Wallet} accent="warning" />
      </div>

      <FinancialCharts monthlyData={monthlyData} categoryData={categoryData} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldos pendentes por sócio</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Elaine</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(totals.elainePending)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Kayky</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(totals.kaykyPending)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento de gastos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Elaine</TableHead>
                <TableHead>Kayky</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>{formatCurrency(e.totalValue)}</TableCell>
                  <TableCell>{formatCurrency(e.elaineShare)}</TableCell>
                  <TableCell>{formatCurrency(e.kaykyShare)}</TableCell>
                  <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
