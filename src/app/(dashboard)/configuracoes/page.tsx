import { SettingsManager } from "@/components/settings-manager";
import { getAllMenuItems, getClassifications } from "@/lib/actions/settings";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export default async function ConfiguracoesPage() {
  const [menus, classifications, allProjects] = await Promise.all([
    getAllMenuItems(),
    getClassifications(),
    db.query.projects.findMany(),
  ]);

  return (
    <SettingsManager
      menus={menus}
      classifications={classifications}
      projects={allProjects}
    />
  );
}
