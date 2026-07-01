"use client";

import Link from "next/link";
import { Plus, FolderKanban, Pencil, Wallet, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { isClosedProject, lifecycleStatusVariant, type Client } from "@/lib/db/schema";
import { ClientFinancePanel } from "@/components/client-finance-panel";
import { ClientPendingDialog } from "@/components/client-pending-dialog";
import type { ClientFinancialMovement } from "@/lib/erp-v2/queries";

type ProjectRow = {
  id: number;
  slug: string;
  name: string;
  status: string | null;
  contractedRevenue: number;
  receivedRevenue: number;
};

type Props = {
  client: Client;
  slug: string;
  projects: ProjectRow[];
  financial: {
    contracted: number;
    received: number;
    pending: number;
    reimbursementsPending: number;
    entryCount: number;
  };
  movements: ClientFinancialMovement[];
  pendingItems: ClientFinancialMovement[];
};

export function ClientDetailTabs({
  client,
  slug,
  projects,
  financial,
  movements,
  pendingItems,
}: Props) {
  const active = projects.filter((p) => !isClosedProject(p.status));
  const closed = projects.filter((p) => isClosedProject(p.status));

  const renderProjectRow = (project: ProjectRow) => (
    <div
      key={project.id}
      className="px-5 py-4 flex items-center justify-between gap-4 kn-row-hover"
    >
      <Link href={`/projetos/${project.slug}`} className="min-w-0 flex-1">
        <p className="font-medium text-sm hover:text-primary">{project.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Valor {formatCurrency(project.contractedRevenue)} · Recebido {formatCurrency(project.receivedRevenue)} · Saldo{" "}
          {formatCurrency(Math.max(0, project.contractedRevenue - project.receivedRevenue))}
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

  const contracted =
    financial.entryCount > 0 ? financial.contracted : projects.reduce((s, p) => s + p.contractedRevenue, 0);
  const received =
    financial.entryCount > 0 ? financial.received : projects.reduce((s, p) => s + p.receivedRevenue, 0);
  const pending =
    financial.entryCount > 0 ? financial.pending : projects.reduce((s, p) => s + Math.max(0, p.contractedRevenue - p.receivedRevenue), 0);

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

      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="projetos">Projetos ({projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="kn-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Projetos ativos</p>
                <p className="text-2xl font-bold mt-1">{active.length}</p>
              </CardContent>
            </Card>
            <Card className="kn-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Valor contratado</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(contracted)}</p>
              </CardContent>
            </Card>
            <Card className="kn-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Recebido</p>
                <p className="text-2xl font-bold mt-1 tabular-nums text-emerald-600">{formatCurrency(received)}</p>
              </CardContent>
            </Card>
            <Card className="kn-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase">Pendente</p>
                <ClientPendingDialog
                  clientName={client.name}
                  totalPending={pending}
                  items={pendingItems}
                  trigger={
                    <button type="button" className="text-left w-full mt-1">
                      <p className="text-2xl font-bold tabular-nums text-amber-600 hover:underline">
                        {formatCurrency(pending)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ver detalhamento</p>
                    </button>
                  }
                />
              </CardContent>
            </Card>
          </div>

          {financial.reimbursementsPending > 0 && (
            <Card className="kn-card border-amber-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Wallet className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Reembolsos pendentes</p>
                  <p className="text-lg font-bold tabular-nums">{formatCurrency(financial.reimbursementsPending)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="kn-card">
            <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
              <CardTitle className="text-sm font-semibold">Projetos ativos</CardTitle>
              <Badge variant="secondary">{active.length}</Badge>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/50">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground p-5">Nenhum projeto ativo.</p>
              ) : (
                active.map(renderProjectRow)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <ClientFinancePanel
            clientName={client.name}
            movements={movements}
            pendingItems={pendingItems}
            totalPending={pending}
          />
        </TabsContent>

        <TabsContent value="projetos" className="space-y-6">
          <Card className="kn-card">
            <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
              <CardTitle className="text-sm font-semibold">Ativos</CardTitle>
              <Badge variant="secondary">{active.length}</Badge>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/50">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground p-5">Nenhum projeto ativo.</p>
              ) : (
                active.map(renderProjectRow)
              )}
            </CardContent>
          </Card>
          {closed.length > 0 && (
            <Card className="kn-card">
              <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
                <CardTitle className="text-sm font-semibold">Concluídos e cancelados</CardTitle>
                <Badge variant="outline">{closed.length}</Badge>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/50">{closed.map(renderProjectRow)}</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
