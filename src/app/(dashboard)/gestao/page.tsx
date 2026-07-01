import { MoneyStat, StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Wallet,
  Users,
  ListTodo,
  AlertTriangle,
  TrendingUp,
  Calendar,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OverviewExpenseSections } from "@/components/overview-expense-sections";
import { PendingReimbursementsCard } from "@/components/pending-reimbursements-card";
import { PartnerPendingDialog } from "@/components/partner-pending-dialog";
import { ReceivablesPendingCard } from "@/components/receivables-pending-card";
import { ensureErpV2Schema } from "@/lib/erp-v2/ensure-schema";
import { getProfitDistribution } from "@/lib/erp-v2/financial";
import { getAllReceivablePendingSummary, getPartnerPendingItems } from "@/lib/erp-v2/queries";

export default async function GestaoHomePage() {
  await ensureErpV2Schema();
  const [stats, elaineItems, kaykyItems, receivableItems, profitDist] = await Promise.all([
    getDashboardStats(),
    getPartnerPendingItems("elaine"),
    getPartnerPendingItems("kayky"),
    getAllReceivablePendingSummary(),
    getProfitDistribution(),
  ]);

  const elainePartner = profitDist.partners.find((p) => p.slug === "elaine");
  const kaykyPartner = profitDist.partners.find((p) => p.slug === "kayky");
  const receivableTotal = receivableItems.reduce((s, r) => s + r.balance, 0);

  return (
    <div className="kn-page">
      <PageHeader
        title="Visão Geral"
        description="Indicadores consolidados da K&N Desenvolvimento de Software — finanças, operações e cronograma."
        icon={LayoutDashboard}
      />

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Indicadores Financeiros
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyStat title="Total investido" amount={stats.totalInvested} icon={Wallet} />
          <MoneyStat title="Total pago" amount={stats.totalPaid} icon={TrendingUp} accent="success" />
          <PartnerPendingDialog
            partnerSlug="elaine"
            partnerName={elainePartner?.name ?? "Elaine Rebelo"}
            total={stats.elainePending}
            items={elaineItems}
          />
          <PartnerPendingDialog
            partnerSlug="kayky"
            partnerName={kaykyPartner?.name ?? "Kayky Mendes"}
            total={stats.kaykyPending}
            items={kaykyItems}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-4">
          <MoneyStat title="Receita recebida" amount={stats.revenueReceived} icon={TrendingUp} accent="success" />
          <ReceivablesPendingCard total={receivableTotal} items={receivableItems} />
          <MoneyStat
            title="Lucro total"
            amount={stats.totalProfit}
            icon={TrendingUp}
            accent={stats.totalProfit >= 0 ? "success" : "warning"}
          />
          <PendingReimbursementsCard
            total={stats.pendingReimbursementsTotal}
            items={stats.pendingReimbursements}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Operações
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Atividades" value={String(stats.activityCount)} description={`${stats.pendingActivities} pendentes`} icon={ListTodo} />
          <StatCard title="Prioridade alta" value={String(stats.highPriority)} icon={AlertTriangle} accent="warning" />
          <StatCard title="Clientes" value={String(stats.clientCount)} icon={Users} />
          <StatCard title="Cronograma previsto" value={formatCurrency(stats.schedulePlanned)} icon={Calendar} />
        </div>
      </section>

      <OverviewExpenseSections
        knTotal={stats.totalInvested}
        expensesByPartner={stats.expensesByPartner}
        expensesByProject={stats.expensesByProject}
        expensesByClient={stats.expensesByClient}
        expensesByType={stats.expensesByType}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="kn-card">
          <CardHeader className="kn-card-header flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-semibold">Gastos recentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/gastos" className="gap-1.5">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">Nenhum gasto cadastrado.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.recentExpenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-6 py-4 kn-row-hover">
                    <div>
                      <p className="font-medium text-sm">{e.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.purchaseDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm tabular-nums">{formatCurrency(e.totalValue)}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">{e.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="kn-card">
          <CardHeader className="kn-card-header flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-semibold">Próximos marcos</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cronograma" className="gap-1.5">
                Ver cronograma <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats.upcomingSchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">Nenhum marco futuro.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.upcomingSchedule.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4 kn-row-hover">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-medium text-sm truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(s.plannedDate)}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">{s.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="kn-card">
        <CardHeader className="kn-card-header py-4">
          <CardTitle className="text-sm font-semibold">Rateio entre sócios</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <PartnerPendingDialog
              partnerSlug="elaine"
              partnerName={elainePartner?.name ?? "Elaine Rebelo Anaya"}
              total={stats.elainePending}
              items={elaineItems}
            />
            <PartnerPendingDialog
              partnerSlug="kayky"
              partnerName={kaykyPartner?.name ?? "Kayky Medes da Silva"}
              total={stats.kaykyPending}
              items={kaykyItems}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
