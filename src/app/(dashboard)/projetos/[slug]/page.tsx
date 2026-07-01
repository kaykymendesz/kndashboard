import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectDetailTabs } from "@/components/project-detail-tabs";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getWikinayaActivities } from "@/lib/actions/activities";
import { getClassificationNames } from "@/lib/actions/settings";
import { WIKINAYA_SLUG } from "@/lib/db/schema";
import { ensureErpV2Schema } from "@/lib/erp-v2/ensure-schema";
import { getProjectComposition, getProjectReceivableEntries } from "@/lib/erp-v2/actions";

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  await ensureErpV2Schema();
  const data = await getProjectBySlug(slug);
  if (!data) notFound();

  const compositionData =
    data.project.projectType === "cliente"
      ? await getProjectComposition(data.project.id)
      : null;
  const receivables =
    data.project.projectType === "cliente"
      ? await getProjectReceivableEntries(data.project.id)
      : [];

  const isWikinaya = slug === WIKINAYA_SLUG;
  const [activities, statuses, priorities] = isWikinaya
    ? await Promise.all([
        getWikinayaActivities(),
        getClassificationNames("activity_status"),
        getClassificationNames("activity_priority"),
      ])
    : [[], [], []];

  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Carregando projeto...</div>}>
      <ProjectDetailTabs
        project={data.project}
        client={data.client}
        details={data.details}
        expenses={data.expenses}
        totalSpent={data.totalSpent}
        finance={data.finance}
        compositionData={compositionData}
        receivables={receivables}
        activities={activities}
        statusOptions={statuses}
        priorityOptions={priorities}
        showActivities={isWikinaya}
      />
    </Suspense>
  );
}
