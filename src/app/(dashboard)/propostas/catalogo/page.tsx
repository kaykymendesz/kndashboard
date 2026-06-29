import { ProposalCatalogPage } from "@/components/proposals/proposal-catalog-page";
import { getGuaranteeCatalogAll, getServiceCatalogAll } from "@/lib/actions/proposal-catalog";

export default async function CatalogoPropostasPage() {
  const [services, guarantees] = await Promise.all([
    getServiceCatalogAll(),
    getGuaranteeCatalogAll(),
  ]);
  return <ProposalCatalogPage services={services} guarantees={guarantees} />;
}
