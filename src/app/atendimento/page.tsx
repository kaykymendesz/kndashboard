import Link from "next/link";
import { Headphones } from "lucide-react";
import { getClients } from "@/lib/actions/clients";
import { getAttendanceCasesByClient } from "@/lib/actions/attendance";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { AtendimentoClientsList } from "@/components/atendimento-clients-list";

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
        description="Atenda demandas, cotações e projetos de cada cliente até a finalização."
        icon={Headphones}
      >
        <Button asChild variant="outline" className="gap-2">
          <Link href="/clientes/novo?returnTo=/atendimento">Novo cliente</Link>
        </Button>
      </PageHeader>

      <AtendimentoClientsList clients={clientsWithStats} />
    </div>
  );
}
