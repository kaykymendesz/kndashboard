import { notFound } from "next/navigation";
import { ProposalFormPage } from "@/components/proposal-form-page";
import { getClients } from "@/lib/actions/clients";
import {
  getGuaranteeCatalog,
  getProposalById,
  getProposalExports,
  getProposalVersions,
  getServiceCatalog,
} from "@/lib/actions/proposals";

export default async function EditarPropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposalId = Number(id);
  if (!Number.isFinite(proposalId)) notFound();

  const [proposal, clients, services, guarantees, versions, exportRows] = await Promise.all([
    getProposalById(proposalId),
    getClients(),
    getServiceCatalog(),
    getGuaranteeCatalog(),
    getProposalVersions(proposalId),
    getProposalExports(proposalId),
  ]);

  if (!proposal) notFound();

  return (
    <ProposalFormPage
      proposal={proposal}
      clients={clients}
      services={services}
      guarantees={guarantees}
      versions={versions}
      exportRows={exportRows}
    />
  );
}
