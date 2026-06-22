"use server";

import { db } from "@/lib/db";
import { activities, projects, WIKINAYA_SLUG } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActivityInput = {
  externalId?: string;
  area: string;
  feature: string;
  description?: string;
  status: string;
  priority: string;
  responsible?: string;
  notes?: string;
  projectId?: number;
};

async function getWikinayaId() {
  const p = await db.query.projects.findFirst({
    where: eq(projects.slug, WIKINAYA_SLUG),
  });
  return p?.id ?? null;
}

function mapActivityInput(input: ActivityInput, projectId?: number | null) {
  return {
    ...input,
    projectId: input.projectId ?? projectId,
    description: input.description ?? "",
    responsible: input.responsible ?? "",
    notes: input.notes ?? "",
    updatedAt: new Date(),
  };
}

export async function createActivity(input: ActivityInput) {
  const wikinayaId = await getWikinayaId();
  await db.insert(activities).values(mapActivityInput(input, wikinayaId));
  revalidatePath("/atividades");
  revalidatePath("/projetos/wikinaya");
  revalidatePath("/projetos");
  revalidatePath("/gestao");
}

export async function updateActivity(id: number, input: ActivityInput) {
  const wikinayaId = await getWikinayaId();
  await db.update(activities).set(mapActivityInput(input, wikinayaId)).where(eq(activities.id, id));
  revalidatePath("/atividades");
  revalidatePath("/projetos/wikinaya");
  revalidatePath("/projetos");
  revalidatePath("/gestao");
}

export async function deleteActivity(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
  revalidatePath("/atividades");
  revalidatePath("/projetos/wikinaya");
  revalidatePath("/projetos");
  revalidatePath("/gestao");
}

export async function getActivities(projectSlug?: string) {
  if (projectSlug) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, projectSlug),
    });
    if (!project) return [];
    return db.query.activities.findMany({
      where: eq(activities.projectId, project.id),
      orderBy: (a, { asc }) => [asc(a.externalId)],
    });
  }
  return db.query.activities.findMany({ orderBy: (a, { asc }) => [asc(a.externalId)] });
}

export async function getWikinayaActivities() {
  return getActivities(WIKINAYA_SLUG);
}
