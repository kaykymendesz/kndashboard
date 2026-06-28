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
import { ProjectInfoEditor } from "@/components/project-info-editor";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Activity, Client, Expense, Project, ProjectInfo } from "@/lib/db/schema";
import type { ProjectFinancialSummary } from "@/lib/project-finance";
import { ProjectStatusSelect } from "@/components/project-status-select";
import { FolderKanban, ArrowLeft, Wallet, Calendar } from "lucide-react";

type Props = {
  project: Project;
  client?: Client | null;
  details: ProjectInfo[];
  expenses: Expense[];
  totalSpent: number;
  finance: ProjectFinancialSummary | null;
  activities: Activity[];
  statusOptions: string[];
  priorityOptions: string[];
  showActivities: boolean;
};

export function ProjectDetailTabs({
  project,
  client,
  details,
  expenses,
  totalSpent,
  finance,
  activities,
  statusOptions,
  priorityOptions,
  showActivities,
}: Props) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "financeiro";
  const validTabs = showActivities
    ? ["financeiro", "detalhes", "gastos", "atividades"]
    : ["financeiro", "detalhes", "gastos"];
  const initialTab = validTabs.includes(defaultTab) ? defaultTab : "financeiro";
  const isClientProject = project.projectType === "cliente";

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
        <div className="text-right max-md:text-left max-md:w-full space-y-2">
          {isClientProject && (
            <div className="flex flex-col items-end max-md:items-start gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
              <ProjectStatusSelect
                projectId={project.id}
                currentStatus={project.status ?? "Prospecção"}
                isClientProject={isClientProject}
              />
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {isClientProject ? "Total de despesas" : "Investimento acumulado"}
            </p>
            <p className="text-2xl font-bold text-primary tabular-nums max-md:text-xl">{formatCurrency(totalSpent)}</p>
          </div>
          {client && (
            <p className="text-xs text-muted-foreground">Cliente: {client.name}</p>
          )}
          <div className="flex flex-wrap gap-2 justify-end max-md:justify-start pt-1">
            <Link
              href={`/gastos/novo?projectId=${project.id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Wallet className="h-3 w-3" /> Novo gasto
            </Link>
            <Link href="/cronograma" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <Calendar className="h-3 w-3" /> Cronograma
            </Link>
          </div>
        </div>
      </PageHeader>

      {showActivities && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Tudo do <strong className="text-primary">Wikinaya</strong> nesta página: financeiro, detalhamento, gastos e atividades.
        </div>
      )}

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhamento</TabsTrigger>
          <TabsTrigger value="gastos">Gastos ({expenses.length})</TabsTrigger>
          {showActivities && (
            <TabsTrigger value="atividades">Atividades ({activities.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isClientProject ? (
              <>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Receita contratada</p>
                    <p className="text-2xl font-bold tabular-nums mt-2">{formatCurrency(finance?.contractedRevenue ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Recebido</p>
                    <p className="text-2xl font-bold tabular-nums mt-2 text-emerald-600">{formatCurrency(finance?.receivedRevenue ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Total de despesas</p>
                    <p className="text-2xl font-bold tabular-nums mt-2">{formatCurrency(finance?.totalExpenses ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Lucro bruto</p>
                    <p className="text-2xl font-bold tabular-nums mt-2 text-primary">{formatCurrency(finance?.grossProfit ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Margem</p>
                    <p className="text-2xl font-bold tabular-nums mt-2">
                      {finance?.marginPercent != null ? `${finance.marginPercent}%` : "—"}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</p>
                    <p className="text-xl font-bold mt-2">K&N</p>
                    <p className="text-xs text-muted-foreground mt-1">Projeto interno — sem receita</p>
                  </CardContent>
                </Card>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Investimento acumulado</p>
                    <p className="text-2xl font-bold tabular-nums mt-2">{formatCurrency(finance?.totalExpenses ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="kn-card">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Gastos mensais</p>
                    <p className="text-2xl font-bold tabular-nums mt-2">{formatCurrency(finance?.monthlyExpenses ?? 0)}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="detalhes" className="space-y-4">
          <ProjectInfoEditor projectId={project.id} items={details} />
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
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Reembolso</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id} className="kn-row-hover">
                          <TableCell className="font-medium">
                            <Link href={`/gastos/${e.id}`} className="hover:text-primary hover:underline">
                              {e.description}
                            </Link>
                          </TableCell>
                          <TableCell>{e.vendor}</TableCell>
                          <TableCell>{formatDate(e.purchaseDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {e.reimbursementStatus ?? "Não possui"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatCurrency(e.totalValue)}
                          </TableCell>
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
