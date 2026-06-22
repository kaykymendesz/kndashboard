import { redirect } from "next/navigation";
import { WIKINAYA_SLUG } from "@/lib/db/schema";

export default function AtividadesRedirectPage() {
  redirect(`/projetos/${WIKINAYA_SLUG}?tab=atividades`);
}
