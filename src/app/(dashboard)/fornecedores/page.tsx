import { VendorsManager } from "@/components/vendors-manager";
import { getVendorsWithTotals } from "@/lib/actions/vendors";

export default async function FornecedoresPage() {
  const items = await getVendorsWithTotals();
  return <VendorsManager items={items} />;
}
