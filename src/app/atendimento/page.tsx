import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { getClients } from "@/lib/actions/clients";
import { getAttendanceCasesByClient } from "@/lib/actions/attendance";
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Selecione um cliente para ver projetos, cotações e atender demandas até a finalização.
          </p>
        </div>
      </div>

      {clientsWithStats.length === 0 ? (
        <Card className="kn-card p-8 text-center text-muted-foreground">
          Nenhum cliente cadastrado. Adicione clientes em Gestão → Clientes.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientsWithStats.map((client) => (
            <Link key={client.id} href={`/atendimento/clientes/${client.slug}`}>
              <Card className="kn-card h-full transition-all hover:shadow-md hover:border-emerald-300/60 group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                      <Users className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
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

      <p className="text-xs text-muted-foreground text-center">
        Mesmos dados da gestão K&N — esta área é focada só em atender clientes.
      </p>
    </div>
  );
}
