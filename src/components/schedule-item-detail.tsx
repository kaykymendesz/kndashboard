"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Pencil, Plus, ChevronRight, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ScheduleItem, ScheduleProcess } from "@/lib/db/schema";

type Props = {
  item: ScheduleItem;
  processes: ScheduleProcess[];
  linkedExpenseId?: number | null;
};

export function ScheduleItemDetail({ item, processes, linkedExpenseId }: Props) {
  const completed = processes.filter((p) => p.status === "Concluído").length;

  return (
    <div className="kn-page">
      <Link href="/cronograma" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Cronograma
      </Link>

      <PageHeader title={item.title} description={item.description || "Sem descrição"} icon={Calendar}>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link href={`/cronograma/${item.id}/editar`}><Pencil className="h-4 w-4" />Editar item</Link>
          </Button>
          {item.hasCost && (
            linkedExpenseId ? (
              <Button asChild className="kn-btn-primary gap-2">
                <Link href={`/gastos/${linkedExpenseId}`}><Wallet className="h-4 w-4" />Ver gasto vinculado</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/gastos/novo?scheduleId=${item.id}`}><Wallet className="h-4 w-4" />Registrar gasto</Link>
              </Button>
            )
          )}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="kn-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Data</p><p className="font-semibold">{formatDate(item.plannedDate)}</p></CardContent></Card>
        <Card className="kn-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Custo</p><Badge className="mt-1">{item.hasCost ? "Com custo" : "Sem custo"}</Badge></CardContent></Card>
        <Card className="kn-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Status</p><Badge className="mt-1">{item.status}</Badge></CardContent></Card>
        <Card className="kn-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Previsto</p><p className="font-semibold tabular-nums">{item.hasCost && item.plannedValue ? formatCurrency(item.plannedValue) : "—"}</p></CardContent></Card>
        <Card className="kn-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Realizado</p><p className="font-semibold tabular-nums">{item.hasCost && item.actualValue ? formatCurrency(item.actualValue) : "—"}</p></CardContent></Card>
      </div>

      {item.notes && (
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3"><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</CardContent>
        </Card>
      )}

      <Card className="kn-card">
        <CardHeader className="kn-card-header flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-semibold">Processos deste item ({completed}/{processes.length})</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/cronograma/${item.id}/processos/novo`} className="gap-1"><Plus className="h-3.5 w-3.5" />Novo processo</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/50">
          {processes.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">Nenhum processo. Edite o item ou configure fluxos em Configurações.</p>
          ) : (
            processes.map((p) => (
              <Link
                key={p.id}
                href={`/cronograma/${item.id}/processos/${p.id}`}
                className="flex items-center justify-between px-6 py-4 kn-row-hover group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm group-hover:text-primary">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.category || "Sem categoria"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={p.status === "Concluído" ? "default" : "secondary"}>{p.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
