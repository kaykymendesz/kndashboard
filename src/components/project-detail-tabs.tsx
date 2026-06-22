"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivitiesManager } from "@/components/activities-manager";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Activity, Expense, Project, ProjectInfo } from "@/lib/db/schema";
import { FolderKanban, ArrowLeft } from "lucide-react";

type Props = {
  project: Project;
  details: ProjectInfo[];
  expenses: Expense[];
  totalSpent: number;
  activities: Activity[];
  statusOptions: string[];
  priorityOptions: string[];
  showActivities: boolean;
};

export function ProjectDetailTabs({
  project,
  details,
  expenses,
  totalSpent,
  activities,
  statusOptions,
  priorityOptions,
  showActivities,
}: Props) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "detalhes";
  const validTabs = showActivities ? ["detalhes", "gastos", "atividades"] : ["detalhes", "gastos"];
  const initialTab = validTabs.includes(defaultTab) ? defaultTab : "detalhes";

  const grouped = details.reduce<Record<string, ProjectInfo[]>>((acc, item) => {
    const key = item.section.trim();
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="kn-page">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/projetos" className="hover:text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      <PageHeader title={project.name} description={project.description ?? ""} icon={FolderKanban}>
        <div className="text-right max-md:text-left max-md:w-full">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total investido</p>
          <p className="text-2xl font-bold text-primary tabular-nums max-md:text-xl">{formatCurrency(totalSpent)}</p>
        </div>
      </PageHeader>

      {showActivities && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Tudo do <strong className="text-primary">Wikinaya</strong> nesta página: detalhamento, gastos (domínio e Play Store) e atividades do app.
        </div>
      )}

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="detalhes">Detalhamento</TabsTrigger>
          <TabsTrigger value="gastos">Gastos ({expenses.length})</TabsTrigger>
          {showActivities && (
            <TabsTrigger value="atividades">Atividades ({activities.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <Card className="kn-card p-8 text-center text-muted-foreground text-sm">
              Nenhum detalhe cadastrado para este projeto.
            </Card>
          ) : (
            Object.entries(grouped).map(([section, rows]) => (
              <Card key={section} className="kn-card overflow-hidden">
                <CardHeader className="kn-card-header py-3">
                  <CardTitle className="text-sm font-semibold">{section}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/50">
                  {rows.map((row) => (
                    <div key={row.id} className="grid sm:grid-cols-3 gap-2 px-6 py-3 text-sm kn-row-hover">
                      <span className="font-medium text-muted-foreground">{row.field}</span>
                      <span className="font-medium">{row.value}</span>
                      <span className="text-muted-foreground text-xs">{row.notes}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="gastos">
          <Card className="kn-card">
            <CardHeader className="kn-card-header flex flex-row items-center justify-between py-4">
              <CardTitle className="text-sm font-semibold">Gastos do projeto</CardTitle>
              <Badge variant="secondary">{formatCurrency(totalSpent)}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6">Nenhum gasto vinculado a este projeto.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id} className="kn-row-hover">
                          <TableCell className="font-medium">{e.description}</TableCell>
                          <TableCell>{e.category}</TableCell>
                          <TableCell>{formatDate(e.purchaseDate)}</TableCell>
                          <TableCell>{e.vendor}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatCurrency(e.totalValue)}
                          </TableCell>
                          <TableCell><Badge variant="secondary">{e.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showActivities && (
          <TabsContent value="atividades">
            <ActivitiesManager
              embedded
              items={activities}
              projectName={project.name}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
