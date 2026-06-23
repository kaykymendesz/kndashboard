import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, FileText, ClipboardList, Play, Users } from "lucide-react";
import { getClientBySlug } from "@/lib/actions/clients";
import { getQuotationsByClient } from "@/lib/actions/quotations";
import { getAttendanceCasesByClient } from "@/lib/actions/attendance";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { StartAttendanceButton } from "@/components/start-attendance-button";

type Props = { params: Promise<{ slug: string }> };

export default async function ClienteAtendimentoPage({ params }: Props) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const [quotations, demands] = await Promise.all([
    getQuotationsByClient(client.id),
    getAttendanceCasesByClient(client.id),
  ]);

  return (
    <div className="kn-page">
      <PageHeader
        title={client.name}
        description={[client.company, client.email, client.project && `Projeto: ${client.project}`].filter(Boolean).join(" · ") || "Cliente K&N"}
        icon={Users}
      >
        <div className="flex flex-wrap gap-2 max-md:w-full">
          <Button asChild className="kn-btn-primary gap-2 max-md:flex-1">
            <Link href={`/atendimento/clientes/${slug}/nova-demanda`}>
              <Plus className="h-4 w-4" /> Nova demanda
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 max-md:flex-1">
            <Link href={`/atendimento/clientes/${slug}/nova-cotacao`}>
              <FileText className="h-4 w-4" /> Nova cotação
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 max-md:flex-1">
            <Link href={`/clientes/${slug}/editar?returnTo=/atendimento/clientes/${slug}`}>
              Editar cliente
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Demandas
            </CardTitle>
            <Badge variant="secondary">{demands.length}</Badge>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {demands.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">Nenhuma demanda ainda.</p>
            ) : (
              demands.map((d) => (
                <div key={d.id} className="px-5 py-4 flex items-center justify-between gap-3 kn-row-hover">
                  <Link href={`/atendimento/demandas/${d.id}`} className="min-w-0 flex-1">
                    <p className="font-medium text-sm hover:text-primary">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.demandType} · {formatDate(d.createdAt)}</p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={d.status === "Finalizado" ? "default" : "secondary"}>{d.status}</Badge>
                    {d.status === "Aguardando" && (
                      <StartAttendanceButton caseId={d.id} clientSlug={slug} />
                    )}
                    {d.status === "Em atendimento" && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/atendimento/demandas/${d.id}`}>
                          <Play className="h-3 w-3 mr-1" /> Continuar
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Cotações
            </CardTitle>
            <Badge variant="secondary">{quotations.length}</Badge>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {quotations.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">Nenhuma cotação ainda.</p>
            ) : (
              quotations.map((q) => (
                <Link
                  key={q.id}
                  href={`/atendimento/cotacoes/${q.id}`}
                  className="flex items-center justify-between px-5 py-4 kn-row-hover"
                >
                  <div>
                    <p className="font-medium text-sm">{q.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{q.status}</p>
                  </div>
                  <p className="font-semibold text-sm tabular-nums text-primary">{formatCurrency(q.value)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
