import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectDetailTabs } from "@/components/project-detail-tabs";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getWikinayaActivities } from "@/lib/actions/activities";
import { getClassificationNames } from "@/lib/actions/settings";
import { WIKINAYA_SLUG } from "@/lib/db/schema";

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProjectBySlug(slug);
  if (!data) notFound();

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
        activities={activities}
        statusOptions={statuses}
        priorityOptions={priorities}
        showActivities={isWikinaya}
      />
    </Suspense>
  );
}
