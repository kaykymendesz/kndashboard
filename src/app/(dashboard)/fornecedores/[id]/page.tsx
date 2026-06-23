import { notFound } from "next/navigation";
import { VendorFormPage } from "@/components/vendor-form-page";
import { getVendorById } from "@/lib/actions/vendors";

type Props = { params: Promise<{ id: string }> };

export default async function FornecedorDetailPage({ params }: Props) {
  const { id } = await params;
  const vendorId = Number(id);
  if (Number.isNaN(vendorId)) notFound();

  const vendor = await getVendorById(vendorId);
  if (!vendor) notFound();

  return <VendorFormPage vendor={vendor} />;
}
