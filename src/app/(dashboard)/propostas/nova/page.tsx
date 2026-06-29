import { ProposalFormPage } from "@/components/proposal-form-page";
import { getClients } from "@/lib/actions/clients";
import { getGuaranteeCatalog, getServiceCatalog } from "@/lib/actions/proposals";

export default async function NovaPropostaPage() {
  const [clients, services, guarantees] = await Promise.all([
    getClients(),
    getServiceCatalog(),
    getGuaranteeCatalog(),
  ]);

  return (
    <ProposalFormPage clients={clients} services={services} guarantees={guarantees} />
  );
}
