import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, FileText, ClipboardList, Play } from "lucide-react";
import { getClientBySlug } from "@/lib/actions/clients";
import { getQuotationsByClient } from "@/lib/actions/quotations";
import { getAttendanceCasesByClient } from "@/lib/actions/attendance";
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/atendimento" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Todos os clientes
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground mt-1">{client.company || client.email || "Cliente K&N"}</p>
          {client.project && (
            <p className="text-sm text-muted-foreground mt-2">Projeto: {client.project}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2">
            <Link href={`/atendimento/clientes/${slug}/nova-demanda`}>
              <Plus className="h-4 w-4" /> Nova demanda
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/atendimento/clientes/${slug}/nova-cotacao`}>
              <FileText className="h-4 w-4" /> Nova cotação
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-700" />
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
                    <p className="font-medium text-sm hover:text-emerald-700">{d.title}</p>
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
              <FileText className="h-4 w-4 text-emerald-700" />
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
                  <p className="font-semibold text-sm tabular-nums">{formatCurrency(q.value)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
