import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, FolderKanban, Pencil, Wallet, ArrowRight } from "lucide-react";
import { getClientBySlug } from "@/lib/actions/clients";
import { getProjectsByClientId } from "@/lib/actions/projects";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { isClosedProject, lifecycleStatusVariant } from "@/lib/db/schema";

type Props = { params: Promise<{ slug: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const projects = await getProjectsByClientId(client.id);
  const active = projects.filter((p) => !isClosedProject(p.status));
  const closed = projects.filter((p) => isClosedProject(p.status));

  const renderProjectRow = (project: (typeof projects)[number]) => (
    <div
      key={project.id}
      className="px-5 py-4 flex items-center justify-between gap-4 kn-row-hover"
    >
      <Link href={`/projetos/${project.slug}`} className="min-w-0 flex-1">
        <p className="font-medium text-sm hover:text-primary">{project.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {project.expenseCount} gastos · {formatCurrency(project.totalExpenses)} investidos
          {project.lastExpenseDate ? ` · ${formatDate(project.lastExpenseDate)}` : ""}
        </p>
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={lifecycleStatusVariant(project.status)}>{project.status}</Badge>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/projetos/${project.slug}`}>
            Abrir <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="kn-page">
      <PageHeader
        title={client.name}
        description={[client.company, client.email, client.phone].filter(Boolean).join(" · ") || "Cliente K&N"}
        icon={FolderKanban}
      >
        <div className="flex flex-wrap gap-2 max-md:w-full">
          <Button asChild className="kn-btn-primary gap-2 max-md:flex-1">
            <Link href={`/clientes/${slug}/novo-projeto`}>
              <Plus className="h-4 w-4" /> Novo projeto
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 max-md:flex-1">
            <Link href={`/clientes/${slug}/editar`}>
              <Pencil className="h-4 w-4" /> Editar cliente
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Card className="kn-card">
        <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" />
            Projetos ativos
          </CardTitle>
          <Badge variant="secondary">{active.length}</Badge>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/50">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground p-5">
              Nenhum projeto ativo. Crie um projeto para registrar gastos, cronograma e proposta desde o primeiro contato.
            </p>
          ) : (
            active.map(renderProjectRow)
          )}
        </CardContent>
      </Card>

      {closed.length > 0 && (
        <Card className="kn-card mt-6">
          <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Concluídos e cancelados
            </CardTitle>
            <Badge variant="outline">{closed.length}</Badge>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {closed.map(renderProjectRow)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
