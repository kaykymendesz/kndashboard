import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/actions/projects";
import { formatCurrency, formatDate } from "@/lib/format";
import { isClosedProject, lifecycleStatusVariant } from "@/lib/db/schema";
import { FolderKanban, ArrowRight, Wallet, ListTodo, Building2, TrendingUp, Archive } from "lucide-react";

function projectTypeLabel(type: string | null | undefined) {
  if (type === "cliente") return "Cliente";
  if (type === "arquivado") return "Arquivado";
  return "Interno";
}

export default async function ProjetosPage() {
  const projects = await getProjects();

  const internal = projects.filter((p) => p.projectType !== "cliente");
  const clientProjects = projects.filter((p) => p.projectType === "cliente");
  const activeClientProjects = clientProjects.filter((p) => !isClosedProject(p.status));
  const closedClientProjects = clientProjects.filter((p) => isClosedProject(p.status));

  const renderCard = (project: (typeof projects)[number]) => {
    const isClient = project.projectType === "cliente";
    const isArchived = project.projectType === "arquivado";

    return (
      <Card key={project.id} className="kn-card group overflow-hidden">
        <CardContent className="p-0">
          <div className="h-1.5 w-full" style={{ backgroundColor: project.color ?? "#1e3a5f" }} />
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                {isClient && project.clientName && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {project.clientName}
                  </p>
                )}
                <h2 className="text-xl font-bold tracking-tight">{project.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description || "Sem descrição"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={lifecycleStatusVariant(project.status)}>{project.status}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  {isArchived ? <Archive className="h-3 w-3 mr-1 inline" /> : null}
                  {projectTypeLabel(project.projectType)}
                </Badge>
              </div>
            </div>

            {isClient ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Receita</span>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{formatCurrency(project.contractedRevenue)}</p>
                  <p className="text-xs text-muted-foreground">contratada</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Gastos</span>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(project.totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground">{project.expenseCount} lançamentos</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Lucro estimado
                  </p>
                  <p className="text-lg font-bold tabular-nums text-emerald-600">
                    {formatCurrency(project.grossProfit)}
                  </p>
                  {project.marginPercent != null && (
                    <p className="text-xs text-muted-foreground">Margem {project.marginPercent}%</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      {isClient && isClosedProject(project.status) ? "Investimento" : "Investimento"}
                    </span>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(project.totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground">
                    {isClient && isClosedProject(project.status) ? "realizado" : "acumulado"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Mensal</span>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{formatCurrency(project.monthlyExpenses)}</p>
                  <p className="text-xs text-muted-foreground">este mês</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Último lançamento
                  </p>
                  <p className="text-sm font-medium">
                    {project.lastExpenseDate ? formatDate(project.lastExpenseDate) : "Nenhum"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ListTodo className="h-3 w-3" /> {project.activityCount} atividades
              </span>
              {isClient && project.lastExpenseDate && (
                <span>Atualizado {formatDate(project.lastExpenseDate)}</span>
              )}
            </div>

            <Button asChild className="w-full kn-btn-primary gap-2 group-hover:gap-3 transition-all">
              <Link href={`/projetos/${project.slug}`}>
                Ver detalhes do projeto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="kn-page">
      <PageHeader
        title="Projetos"
        description="Projetos internos K&N e projetos de clientes — gastos, receitas e lucratividade por centro."
        icon={FolderKanban}
      />

      {internal.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Projetos internos K&N
          </h2>
          <div className="grid gap-5 md:grid-cols-2">{internal.map(renderCard)}</div>
        </section>
      )}

      {activeClientProjects.length > 0 && (
        <section className="space-y-4 mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Projetos de clientes
          </h2>
          <div className="grid gap-5 md:grid-cols-2">{activeClientProjects.map(renderCard)}</div>
        </section>
      )}

      {closedClientProjects.length > 0 && (
        <section className="space-y-4 mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Concluídos e cancelados
          </h2>
          <div className="grid gap-5 md:grid-cols-2">{closedClientProjects.map(renderCard)}</div>
        </section>
      )}

      {projects.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado.</p>
      )}
    </div>
  );
}
