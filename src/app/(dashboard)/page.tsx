import { MoneyStat, StatCard } from "@/components/stat-card";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">
          K&N Desenvolvimento de Software — painel de gestão Elaine & Kayky
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MoneyStat title="Total investido" amount={stats.totalInvested} icon={Wallet} />
        <MoneyStat title="Total pago" amount={stats.totalPaid} icon={TrendingUp} accent="success" />
        <MoneyStat title="Pendente Elaine" amount={stats.elainePending} icon={AlertTriangle} accent="warning" />
        <MoneyStat title="Pendente Kayky" amount={stats.kaykyPending} icon={AlertTriangle} accent="warning" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Atividades" value={String(stats.activityCount)} description={`${stats.pendingActivities} pendentes`} icon={ListTodo} />
        <StatCard title="Prioridade alta" value={String(stats.highPriority)} icon={AlertTriangle} />
        <StatCard title="Clientes" value={String(stats.clientCount)} icon={Users} />
        <StatCard title="Cronograma previsto" value={formatCurrency(stats.schedulePlanned)} icon={Calendar} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Gastos recentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/gastos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum gasto cadastrado.</p>
            ) : (
              stats.recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{e.description}</p>
                    <p className="text-muted-foreground">{formatDate(e.purchaseDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(e.totalValue)}</p>
                    <Badge variant="secondary" className="text-xs">{e.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Próximos marcos</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cronograma">Ver cronograma</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.upcomingSchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum marco futuro.</p>
            ) : (
              stats.upcomingSchedule.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-muted-foreground">{formatDate(s.plannedDate)}</p>
                  </div>
                  <Badge variant="outline">{s.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rateio entre sócios</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-lg bg-indigo-500/5 p-4 border">
            <p className="text-sm text-muted-foreground">Elaine Rebelo Anaya</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.elaineInvested)}</p>
            <p className="text-sm text-amber-600 mt-1">Pendente: {formatCurrency(stats.elainePending)}</p>
          </div>
          <div className="rounded-lg bg-violet-500/5 p-4 border">
            <p className="text-sm text-muted-foreground">Kayky Medes da Silva</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.kaykyInvested)}</p>
            <p className="text-sm text-amber-600 mt-1">Pendente: {formatCurrency(stats.kaykyPending)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
