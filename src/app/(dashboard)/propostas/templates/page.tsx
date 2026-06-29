import { ProposalTemplatesPage } from "@/components/proposals/proposal-templates-page";
import { getProposalTemplates } from "@/lib/actions/proposal-catalog";

export default async function TemplatesPropostasPage() {
  const templates = await getProposalTemplates();
  return <ProposalTemplatesPage templates={templates} />;
}
