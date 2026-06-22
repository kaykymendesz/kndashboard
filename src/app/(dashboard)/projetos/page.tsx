import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/actions/projects";
import { formatCurrency } from "@/lib/format";
import { FolderKanban, ArrowRight, Wallet, ListTodo } from "lucide-react";

export default async function ProjetosPage() {
  const projects = await getProjects();

  return (
    <div className="kn-page">
      <PageHeader
        title="Projetos"
        description="Visão consolidada de cada projeto — gastos, detalhes e status operacional."
        icon={FolderKanban}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} className="kn-card group overflow-hidden">
            <CardContent className="p-0">
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: project.color ?? "#1e3a5f" }}
              />
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{project.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {project.description || "Sem descrição"}
                    </p>
                  </div>
                  <Badge variant="secondary">{project.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Wallet className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Gastos</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums text-primary">
                      {formatCurrency(project.totalExpenses)}
                    </p>
                    <p className="text-xs text-muted-foreground">{project.expenseCount} lançamentos</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ListTodo className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Atividades</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{project.activityCount}</p>
                    <p className="text-xs text-muted-foreground">itens cadastrados</p>
                  </div>
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
        ))}
      </div>
    </div>
  );
}
