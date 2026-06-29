import { notFound } from "next/navigation";
import { ProposalDocument } from "@/components/proposals/proposal-document";
import { getProposalById, getProposalDocumentData } from "@/lib/actions/proposals";
import { PrintToolbar } from "@/components/proposals/print-toolbar";

export default async function ImprimirPropostaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposalId = Number(id);
  if (!Number.isFinite(proposalId)) notFound();

  const [data, proposal] = await Promise.all([
    getProposalDocumentData(proposalId),
    getProposalById(proposalId),
  ]);
  if (!data || !proposal) notFound();

  return (
    <div className="min-h-screen bg-white">
      <PrintToolbar proposalId={proposalId} />
      <ProposalDocument data={data} layoutJson={proposal.customLayout} />
    </div>
  );
}
