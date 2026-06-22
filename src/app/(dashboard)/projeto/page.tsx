import { ProjectInfoManager } from "@/components/project-info-manager";
import { getProjectInfo } from "@/lib/actions/project";

export default async function ProjetoPage() {
  const items = await getProjectInfo();
  return <ProjectInfoManager items={items} />;
}
