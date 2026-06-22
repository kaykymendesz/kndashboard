"use server";

import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
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
};

function mapActivityInput(input: ActivityInput) {
  return {
    ...input,
    description: input.description ?? "",
    responsible: input.responsible ?? "",
    notes: input.notes ?? "",
    updatedAt: new Date(),
  };
}

export async function createActivity(input: ActivityInput) {
  await db.insert(activities).values(mapActivityInput(input));
  revalidatePath("/atividades");
  revalidatePath("/");
}

export async function updateActivity(id: number, input: ActivityInput) {
  await db.update(activities).set(mapActivityInput(input)).where(eq(activities.id, id));
  revalidatePath("/atividades");
  revalidatePath("/");
}

export async function deleteActivity(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
  revalidatePath("/atividades");
  revalidatePath("/");
}

export async function getActivities() {
  return db.query.activities.findMany({ orderBy: (a, { asc }) => [asc(a.externalId)] });
}
