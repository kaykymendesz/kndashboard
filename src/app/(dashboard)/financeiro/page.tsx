import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyStat } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { getFinancialSummary } from "@/lib/queries/dashboard";
import { formatCurrency } from "@/lib/format";
import { Wallet, Users, PieChart } from "lucide-react";
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
    <div className="kn-page">
      <PageHeader
        title="Resumo Financeiro"
        description="Cronograma registra o previsto; Gastos registra o realizado. Visão consolidada para tomada de decisão."
        icon={PieChart}
      />

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Totais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyStat title="Total investido" amount={totals.invested} icon={Wallet} />
          <MoneyStat title="Cota Elaine" amount={totals.elaineShare} icon={Users} />
          <MoneyStat title="Cota Kayky" amount={totals.kaykyShare} icon={Users} />
          <MoneyStat title="Total pendente" amount={totals.elainePending + totals.kaykyPending} icon={Wallet} accent="warning" />
        </div>
      </section>

      <FinancialCharts monthlyData={monthlyData} categoryData={categoryData} />

      <Card className="kn-card">
        <CardHeader className="kn-card-header py-4">
          <CardTitle className="text-sm font-semibold">Saldos pendentes por sócio</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="kn-partner-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elaine</p>
              <p className="text-xl font-bold text-amber-600 mt-2 tabular-nums">{formatCurrency(totals.elainePending)}</p>
            </div>
            <div className="kn-partner-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kayky</p>
              <p className="text-xl font-bold text-amber-600 mt-2 tabular-nums">{formatCurrency(totals.kaykyPending)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="kn-card">
        <CardHeader className="kn-card-header py-4">
          <CardTitle className="text-sm font-semibold">Detalhamento de gastos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Elaine</TableHead>
                  <TableHead className="font-semibold">Kayky</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id} className="kn-row-hover">
                    <TableCell className="font-medium">{e.description}</TableCell>
                    <TableCell className="text-muted-foreground">{e.category}</TableCell>
                    <TableCell className="tabular-nums font-medium">{formatCurrency(e.totalValue)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(e.elaineShare)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(e.kaykyShare)}</TableCell>
                    <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
