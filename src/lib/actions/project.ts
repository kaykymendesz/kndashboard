"use server";

import { db } from "@/lib/db";
import { projectInfo } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProjectInfoInput = {
  section: string;
  field: string;
  value: string;
  notes?: string;
};

export async function createProjectInfo(input: ProjectInfoInput) {
  await db.insert(projectInfo).values({
    ...input,
    notes: input.notes ?? "",
  });
  revalidatePath("/projeto");
  revalidatePath("/");
}

export async function updateProjectInfo(id: number, input: ProjectInfoInput) {
  await db
    .update(projectInfo)
    .set({ ...input, notes: input.notes ?? "", updatedAt: new Date() })
    .where(eq(projectInfo.id, id));
  revalidatePath("/projeto");
  revalidatePath("/");
}

export async function deleteProjectInfo(id: number) {
  await db.delete(projectInfo).where(eq(projectInfo.id, id));
  revalidatePath("/projeto");
  revalidatePath("/");
}

export async function getProjectInfo() {
  return db.query.projectInfo.findMany({
    orderBy: (p, { asc }) => [asc(p.section), asc(p.field)],
  });
}
