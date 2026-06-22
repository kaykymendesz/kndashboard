"use server";

import { db } from "@/lib/db";
import { projectInfo, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProjectInfoInput = {
  section: string;
  field: string;
  value: string;
  notes?: string;
  projectId?: number | null;
};

export async function createProjectInfo(input: ProjectInfoInput) {
  await db.insert(projectInfo).values({
    ...input,
    notes: input.notes ?? "",
  });
  revalidatePath("/projeto");
  revalidatePath("/projetos");
  revalidatePath("/gestao");
}

export async function updateProjectInfo(id: number, input: ProjectInfoInput) {
  await db
    .update(projectInfo)
    .set({ ...input, notes: input.notes ?? "", updatedAt: new Date() })
    .where(eq(projectInfo.id, id));
  revalidatePath("/projeto");
  revalidatePath("/projetos");
  revalidatePath("/gestao");
}

export async function deleteProjectInfo(id: number) {
  await db.delete(projectInfo).where(eq(projectInfo.id, id));
  revalidatePath("/projeto");
  revalidatePath("/projetos");
  revalidatePath("/gestao");
}

export async function getProjectInfo(projectId?: number | null) {
  if (projectId) {
    return db.query.projectInfo.findMany({
      where: eq(projectInfo.projectId, projectId),
      orderBy: (p, { asc }) => [asc(p.section), asc(p.field)],
    });
  }
  return db.query.projectInfo.findMany({
    orderBy: (p, { asc }) => [asc(p.section), asc(p.field)],
  });
}

export async function getCompanyInfo() {
  const empresa = await db.query.projects.findFirst({
    where: eq(projects.slug, "kn-empresa"),
  });
  if (empresa) {
    return getProjectInfo(empresa.id);
  }
  return db.query.projectInfo.findMany({
    orderBy: (p, { asc }) => [asc(p.section), asc(p.field)],
  });
}
