import { notFound } from "next/navigation";
import { getClientBySlug } from "@/lib/actions/clients";
import { getProjectsByClientId } from "@/lib/actions/projects";
import { ensureErpV2Schema } from "@/lib/erp-v2/ensure-schema";
import { getClientFinancialSummary } from "@/lib/erp-v2/financial";
import {
  getClientFinancialMovements,
  getClientPendingEntries,
} from "@/lib/erp-v2/queries";
import { ClientDetailTabs } from "@/components/client-detail-tabs";

type Props = { params: Promise<{ slug: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { slug } = await params;
  await ensureErpV2Schema();
  const client = await getClientBySlug(slug);
  if (!client) notFound();

  const [projects, financial, movements, pendingItems] = await Promise.all([
    getProjectsByClientId(client.id),
    getClientFinancialSummary(client.id).catch(() => ({
      contracted: 0,
      received: 0,
      pending: 0,
      reimbursementsPending: 0,
      entryCount: 0,
    })),
    getClientFinancialMovements(client.id),
    getClientPendingEntries(client.id),
  ]);

  return (
    <ClientDetailTabs
      client={client}
      slug={slug}
      projects={projects.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        status: p.status,
        contractedRevenue: p.contractedRevenue,
        receivedRevenue: p.receivedRevenue,
      }))}
      financial={financial}
      movements={movements}
      pendingItems={pendingItems}
    />
  );
}
