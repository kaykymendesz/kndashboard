import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getAttendanceCaseById, getAttendanceSteps } from "@/lib/actions/attendance";
import { getClientById } from "@/lib/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartAttendanceButton } from "@/components/start-attendance-button";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function DemandaDetailPage({ params }: Props) {
  const { id } = await params;
  const caseId = Number(id);
  if (Number.isNaN(caseId)) notFound();

  const demand = await getAttendanceCaseById(caseId);
  if (!demand) notFound();

  const [client, steps] = await Promise.all([
    getClientById(demand.clientId),
    getAttendanceSteps(caseId),
  ]);
  if (!client) notFound();

  const completed = steps.filter((s) => s.status === "Concluído").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href={`/atendimento/clientes/${client.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {client.name}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge>{demand.demandType}</Badge>
            <Badge variant={demand.status === "Finalizado" ? "default" : "secondary"}>{demand.status}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{demand.title}</h1>
          <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{demand.description || "Sem descrição"}</p>
          <p className="text-xs text-muted-foreground mt-2">Criado em {formatDate(demand.createdAt)}</p>
        </div>
        {demand.status === "Aguardando" && (
          <StartAttendanceButton caseId={demand.id} clientSlug={client.slug!} />
        )}
      </div>

      {steps.length > 0 && (
        <Card className="kn-card">
          <CardHeader className="kn-card-header py-3 flex flex-row justify-between">
            <CardTitle className="text-sm font-semibold">Etapas do atendimento</CardTitle>
            <span className="text-sm text-muted-foreground">{completed}/{steps.length} concluídas</span>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {steps.map((step, i) => (
              <Link
                key={step.id}
                href={`/atendimento/demandas/${caseId}/etapas/${step.id}`}
                className="flex items-center justify-between px-5 py-4 kn-row-hover group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <div>
                    <p className="font-medium text-sm group-hover:text-emerald-700">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={step.status === "Concluído" ? "default" : "secondary"}>{step.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {demand.status === "Aguardando" && steps.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8 border rounded-xl border-dashed">
          Clique em <strong>Atender</strong> para iniciar as etapas desta demanda.
        </p>
      )}
    </div>
  );
}
