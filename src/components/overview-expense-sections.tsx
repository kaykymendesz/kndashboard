import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function BreakdownList({ data, emptyLabel }: { data: Record<string, number>; emptyLabel: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">{emptyLabel}</p>;
  }
  const max = entries[0][1] || 1;
  return (
    <div className="divide-y divide-border/50">
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-center gap-4 px-5 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{label}</p>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </div>
          <p className="text-sm font-semibold tabular-nums shrink-0">{formatCurrency(value)}</p>
        </div>
      ))}
    </div>
  );
}

type Props = {
  knTotal: number;
  expensesByPartner: Record<string, number>;
  expensesByProject: Record<string, number>;
  expensesByClient: Record<string, number>;
  expensesByType: Record<string, number>;
};

export function OverviewExpenseSections({
  knTotal,
  expensesByPartner,
  expensesByProject,
  expensesByClient,
  expensesByType,
}: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Gastos consolidados
        </h2>
        <Link href="/gastos" className="text-xs text-primary hover:underline flex items-center gap-1">
          Ver gastos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
            <CardTitle className="text-sm font-semibold">Gastos K&N (total)</CardTitle>
            <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(knTotal)}</span>
          </CardHeader>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Soma de todos os gastos registrados da empresa, incluindo projetos e operação.
          </CardContent>
        </Card>

        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-sm font-semibold">Por tipo (Anual / Mensal / Único)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BreakdownList
              data={{
                Anual: expensesByType.Anual ?? 0,
                Mensal: expensesByType.Mensal ?? 0,
                Único: expensesByType.Único ?? 0,
              }}
              emptyLabel="Sem tipos definidos."
            />
          </CardContent>
        </Card>

        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-sm font-semibold">Gastos por sócios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BreakdownList data={expensesByPartner} emptyLabel="Sem rateio entre sócios." />
          </CardContent>
        </Card>

        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-sm font-semibold">Gastos por projetos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BreakdownList data={expensesByProject} emptyLabel="Sem gastos por projeto." />
          </CardContent>
        </Card>

        <Card className="kn-card lg:col-span-2">
          <CardHeader className="kn-card-header py-3">
            <CardTitle className="text-sm font-semibold">Gastos por clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BreakdownList data={expensesByClient} emptyLabel="Nenhum gasto vinculado a clientes." />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
