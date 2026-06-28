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

export default async function GestaoHomePage() {
  const stats = await getDashboardStats();

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
          <MoneyStat title="Pendente Elaine" amount={stats.elainePending} icon={AlertTriangle} accent="warning" />
          <MoneyStat title="Pendente Kayky" amount={stats.kaykyPending} icon={AlertTriangle} accent="warning" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-4">
          <MoneyStat title="Receita recebida" amount={stats.revenueReceived} icon={TrendingUp} accent="success" />
          <MoneyStat title="Receita a receber" amount={stats.revenueToReceive} icon={Calendar} />
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
            <div className="kn-partner-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elaine Rebelo Anaya</p>
              <p className="text-2xl font-bold mt-2 tabular-nums text-primary">{formatCurrency(stats.elaineInvested)}</p>
              <Separator className="my-3" />
              <p className="text-sm text-amber-600 font-medium">
                Pendente: {formatCurrency(stats.elainePending)}
              </p>
            </div>
            <div className="kn-partner-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kayky Medes da Silva</p>
              <p className="text-2xl font-bold mt-2 tabular-nums text-primary">{formatCurrency(stats.kaykyInvested)}</p>
              <Separator className="my-3" />
              <p className="text-sm text-amber-600 font-medium">
                Pendente: {formatCurrency(stats.kaykyPending)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
