import { ProposalsManager } from "@/components/proposals-manager";
import { getProposals } from "@/lib/actions/proposals";

export default async function PropostasPage() {
  const items = await getProposals();
  return <ProposalsManager items={items} />;
}
