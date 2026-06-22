import Link from "next/link";
import { Users, ChevronRight, Headphones } from "lucide-react";
import { getClients } from "@/lib/actions/clients";
import { getAttendanceCasesByClient } from "@/lib/actions/attendance";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AtendimentoHomePage() {
  const clients = await getClients();

  const clientsWithStats = await Promise.all(
    clients.map(async (c) => {
      const demands = await getAttendanceCasesByClient(c.id);
      const open = demands.filter((d) => d.status !== "Finalizado" && d.status !== "Cancelado").length;
      return { ...c, open, total: demands.length };
    })
  );

  return (
    <div className="kn-page">
      <PageHeader
        title="Central de Clientes"
        description="Atenda demandas, cotações e projetos de cada cliente até a finalização — mesmo sistema K&N, foco em atendimento."
        icon={Headphones}
      />

      {clientsWithStats.length === 0 ? (
        <Card className="kn-card p-8 text-center text-muted-foreground">
          Nenhum cliente cadastrado. Adicione em Gestão → Clientes ou aqui ao criar a primeira demanda.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientsWithStats.map((client) => (
            <Link key={client.id} href={`/atendimento/clientes/${client.slug}`}>
              <Card className="kn-card h-full transition-all hover:shadow-md group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="kn-kpi-icon">
                      <Users className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h2 className="mt-4 font-semibold text-lg">{client.name}</h2>
                  {client.company && (
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {client.open > 0 && (
                      <Badge className="bg-amber-500/15 text-amber-800 border-amber-200">
                        {client.open} em aberto
                      </Badge>
                    )}
                    <Badge variant="secondary">{client.total} demanda(s)</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
