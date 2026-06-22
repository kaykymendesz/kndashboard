import { SettingsManager } from "@/components/settings-manager";
import { getAllMenuItems, getClassifications, getClassificationNames } from "@/lib/actions/settings";
import { getAllFlowsWithSteps } from "@/lib/actions/process-flows";
import { db } from "@/lib/db";

export default async function ConfiguracoesPage() {
  const [menus, classifications, allProjects, flowsWithSteps, processCategories] = await Promise.all([
    getAllMenuItems(),
    getClassifications(),
    db.query.projects.findMany(),
    getAllFlowsWithSteps(),
    getClassificationNames("process_category"),
  ]);

  return (
    <SettingsManager
      menus={menus}
      classifications={classifications}
      projects={allProjects}
      flowsWithSteps={flowsWithSteps}
      processCategories={processCategories}
    />
  );
}
