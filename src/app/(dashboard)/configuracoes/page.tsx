import { SettingsManager } from "@/components/settings-manager";
import { getAllMenuItems, getClassifications, getClassificationNames } from "@/lib/actions/settings";
import { getAllFlowsWithSteps } from "@/lib/actions/process-flows";
import { getErpCompanySettings } from "@/lib/actions/company-settings";
import { ensureErpV2Schema } from "@/lib/erp-v2/ensure-schema";
import { db } from "@/lib/db";

export default async function ConfiguracoesPage() {
  await ensureErpV2Schema();
  const [menus, classifications, allProjects, flowsWithSteps, processCategories, erpSettings] =
    await Promise.all([
      getAllMenuItems(),
      getClassifications(),
      db.query.projects.findMany(),
      getAllFlowsWithSteps(),
      getClassificationNames("process_category"),
      getErpCompanySettings(),
    ]);

  return (
    <SettingsManager
      menus={menus}
      classifications={classifications}
      projects={allProjects}
      flowsWithSteps={flowsWithSteps}
      processCategories={processCategories}
      erpSettings={erpSettings}
    />
  );
}
