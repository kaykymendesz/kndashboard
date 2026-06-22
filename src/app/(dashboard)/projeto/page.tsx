import { ProjectInfoManager } from "@/components/project-info-manager";
import { getCompanyInfo } from "@/lib/actions/project";

export default async function ProjetoPage() {
  const items = await getCompanyInfo();
  return <ProjectInfoManager items={items} title="Dados da Empresa" description="Informações jurídicas e estrutura da K&N — Mendes & Anaya LTDA." />;
}
