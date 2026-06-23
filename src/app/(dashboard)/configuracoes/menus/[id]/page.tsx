import { notFound } from "next/navigation";
import { MenuFormPage } from "@/components/menu-form-page";
import { getAllMenuItems } from "@/lib/actions/settings";

type Props = { params: Promise<{ id: string }> };

export default async function EditarMenuPage({ params }: Props) {
  const { id } = await params;
  const menuId = Number(id);
  if (Number.isNaN(menuId)) notFound();
  const items = await getAllMenuItems();
  const item = items.find((m) => m.id === menuId);
  if (!item) notFound();
  return <MenuFormPage item={item} />;
}
