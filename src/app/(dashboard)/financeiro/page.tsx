import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyStat } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { getFinancialSummary, getProfitSummary } from "@/lib/queries/dashboard";
import { getVendorTotalsForFinanceiro } from "@/lib/actions/vendors";
import { ensureErpV2Schema } from "@/lib/erp-v2/ensure-schema";
import { getProfitDistribution } from "@/lib/erp-v2/financial";
import { getAllReceivablePendingSummary, getPartnerPendingItems } from "@/lib/erp-v2/queries";
import { PartnerPendingDialog } from "@/components/partner-pending-dialog";
import { ReceivablesPendingCard } from "@/components/receivables-pending-card";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { PieChart, Pencil, Wallet, Users, TrendingUp, Truck, ArrowRight } from "lucide-react";
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
import { Button } from "@/components/ui/button";

export default async function FinanceiroPage() {
  await ensureErpV2Schema();
  const [
    { expenses, monthlyData, totals },
    profit,
    vendorTotals,
    elaineItems,
    kaykyItems,
    receivableItems,
    profitDist,
  ] = await Promise.all([
    getFinancialSummary(),
    getProfitSummary(),
    getVendorTotalsForFinanceiro(),
    getPartnerPendingItems("elaine"),
    getPartnerPendingItems("kayky"),
    getAllReceivablePendingSummary(),
    getProfitDistribution(),
  ]);

  const elainePartner = profitDist.partners.find((p) => p.slug === "elaine");
  const kaykyPartner = profitDist.partners.find((p) => p.slug === "kayky");
  const receivableTotal = receivableItems.reduce((s, r) => s + r.balance, 0);

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
          Resultado (Lucro)
        </h2>
        <Card className="kn-card mb-6 border-primary/20">
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Receita recebida</p>
                <p className="text-xl font-bold tabular-nums text-emerald-600 mt-1">{formatCurrency(profit.received)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Custos (gastos)</p>
                <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(profit.costs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Lucro</p>
                <p className={`text-xl font-bold tabular-nums mt-1 ${profit.profit >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {formatCurrency(profit.profit)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/50">
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link href="/lucro"><TrendingUp className="h-4 w-4" /> Gerenciar receitas</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link href="/fornecedores"><Truck className="h-4 w-4" /> Fornecedores</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Contas a receber (ERP v2)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
          <ReceivablesPendingCard total={receivableTotal} items={receivableItems} />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Totais de custos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyStat title="Total investido" amount={totals.invested} icon={Wallet} />
          <MoneyStat title="Cota Elaine" amount={totals.elaineShare} icon={Users} />
          <MoneyStat title="Cota Kayky" amount={totals.kaykyShare} icon={Users} />
          <MoneyStat title="Total pendente" amount={totals.elainePending + totals.kaykyPending} icon={Wallet} accent="warning" />
        </div>
      </section>

      <FinancialCharts monthlyData={monthlyData} categoryData={categoryData} />

      {vendorTotals.length > 0 && (
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Gastos por fornecedor</CardTitle>
            <Link href="/fornecedores" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Lançamentos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorTotals.slice(0, 8).map((v) => (
                  <TableRow key={v.name}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.count}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(v.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="kn-card">
        <CardHeader className="kn-card-header py-4">
          <CardTitle className="text-sm font-semibold">Saldos pendentes por sócio</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <PartnerPendingDialog
              partnerSlug="elaine"
              partnerName={elainePartner?.name ?? "Elaine"}
              total={totals.elainePending}
              items={elaineItems}
            />
            <PartnerPendingDialog
              partnerSlug="kayky"
              partnerName={kaykyPartner?.name ?? "Kayky"}
              total={totals.kaykyPending}
              items={kaykyItems}
            />
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
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id} className="kn-row-hover">
                    <TableCell className="font-medium">
                      <Link href={`/gastos/${e.id}`} className="text-primary hover:underline">
                        {e.description}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.category}</TableCell>
                    <TableCell className="tabular-nums font-medium">{formatCurrency(e.totalValue)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(e.elaineShare)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(e.kaykyShare)}</TableCell>
                    <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/gastos/${e.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>
                    </TableCell>
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
