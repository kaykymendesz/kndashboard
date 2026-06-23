import Link from "next/link";
import { Plus, Pencil, TrendingUp, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MoneyStat } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRevenuesWithRelations } from "@/lib/actions/revenues";
import { getProfitSummary } from "@/lib/queries/dashboard";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function LucroPage() {
  const [summary, revenues] = await Promise.all([
    getProfitSummary(),
    getRevenuesWithRelations(),
  ]);

  return (
    <div className="kn-page">
      <PageHeader
        title="Lucro"
        description="Receitas menos custos registrados no financeiro — visão de resultado."
        icon={TrendingUp}
      >
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/lucro/novo"><Plus className="h-4 w-4" />Nova receita</Link>
        </Button>
      </PageHeader>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
          <MoneyStat title="Receita recebida" amount={summary.received} icon={TrendingUp} accent="success" />
          <MoneyStat title="Receita pendente" amount={summary.pending} icon={TrendingUp} accent="warning" />
          <MoneyStat title="Custos (financeiro)" amount={summary.costs} icon={TrendingUp} />
          <MoneyStat
            title="Lucro (recebido − custos)"
            amount={summary.profit}
            icon={TrendingUp}
            accent={summary.profit >= 0 ? "success" : "warning"}
          />
        </div>

        <Card className="kn-card border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Os <strong>custos</strong> vêm dos gastos com custo financeiro (mesma base do{" "}
              <Link href="/financeiro" className="text-primary hover:underline">Financeiro</Link>).
              Fornecedores em{" "}
              <Link href="/fornecedores" className="text-primary hover:underline">Fornecedores</Link>.
            </p>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/financeiro">Ver financeiro <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="kn-card mt-6">
        <CardHeader className="kn-card-header py-4">
          <CardTitle className="text-sm font-semibold">Receitas cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhuma receita cadastrada.{" "}
                      <Link href="/lucro/novo" className="text-primary hover:underline">Registrar primeira receita</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  revenues.map((r) => (
                    <TableRow key={r.id} className="kn-row-hover">
                      <TableCell className="font-medium">{r.description}</TableCell>
                      <TableCell>{formatDate(r.receivedDate)}</TableCell>
                      <TableCell>{r.clientName}</TableCell>
                      <TableCell>{r.projectName}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatCurrency(r.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "Recebido" ? "default" : "secondary"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/lucro/${r.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
