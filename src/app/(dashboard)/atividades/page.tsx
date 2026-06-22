import { ActivitiesManager } from "@/components/activities-manager";
import { getWikinayaActivities } from "@/lib/actions/activities";
import { getWikinayaProject } from "@/lib/actions/projects";
import { getClassificationNames } from "@/lib/actions/settings";

export default async function AtividadesPage() {
  const [items, project, statuses, priorities] = await Promise.all([
    getWikinayaActivities(),
    getWikinayaProject(),
    getClassificationNames("activity_status"),
    getClassificationNames("activity_priority"),
  ]);

  return (
    <ActivitiesManager
      items={items}
      projectName={project?.project.name ?? "Wikinaya"}
      statusOptions={statuses}
      priorityOptions={priorities}
    />
  );
}
