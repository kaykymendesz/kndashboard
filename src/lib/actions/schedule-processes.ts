"use server";

import { db } from "@/lib/db";
import { processSteps, scheduleProcesses } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ScheduleProcessInput = {
  scheduleItemId: number;
  stepId?: number | null;
  name: string;
  category?: string;
  status?: string;
  notes?: string;
  sortOrder?: number;
};

export async function getScheduleProcesses(scheduleItemId: number) {
  return db.query.scheduleProcesses.findMany({
    where: eq(scheduleProcesses.scheduleItemId, scheduleItemId),
    orderBy: [asc(scheduleProcesses.sortOrder), asc(scheduleProcesses.id)],
  });
}

export async function getScheduleProcessById(id: number) {
  return db.query.scheduleProcesses.findFirst({
    where: eq(scheduleProcesses.id, id),
  });
}

export async function createScheduleProcess(input: ScheduleProcessInput) {
  const [row] = await db
    .insert(scheduleProcesses)
    .values({
      scheduleItemId: input.scheduleItemId,
      stepId: input.stepId ?? null,
      name: input.name,
      category: input.category ?? "",
      status: input.status ?? "Pendente",
      notes: input.notes ?? "",
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  revalidatePath("/cronograma");
  revalidatePath(`/cronograma/${input.scheduleItemId}`);
  return row;
}

export async function updateScheduleProcess(id: number, input: Partial<ScheduleProcessInput>) {
  const existing = await getScheduleProcessById(id);
  if (!existing) return;

  const status = input.status ?? existing.status;
  const completedAt =
    status === "Concluído" && existing.status !== "Concluído"
      ? new Date()
      : status !== "Concluído"
        ? null
        : existing.completedAt;

  await db
    .update(scheduleProcesses)
    .set({
      name: input.name ?? existing.name,
      category: input.category ?? existing.category,
      status,
      notes: input.notes ?? existing.notes,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(scheduleProcesses.id, id));

  revalidatePath("/cronograma");
  revalidatePath(`/cronograma/${existing.scheduleItemId}`);
  revalidatePath(`/cronograma/${existing.scheduleItemId}/processos/${id}`);
}

export async function deleteScheduleProcess(id: number) {
  const existing = await getScheduleProcessById(id);
  if (!existing) return;
  await db.delete(scheduleProcesses).where(eq(scheduleProcesses.id, id));
  revalidatePath("/cronograma");
  revalidatePath(`/cronograma/${existing.scheduleItemId}`);
}

export async function initProcessesFromFlow(scheduleItemId: number, flowId: number) {
  const existing = await getScheduleProcesses(scheduleItemId);
  if (existing.length > 0) return existing;

  const steps = await db.query.processSteps.findMany({
    where: eq(processSteps.flowId, flowId),
    orderBy: [asc(processSteps.sortOrder), asc(processSteps.id)],
  });

  for (const step of steps) {
    await db.insert(scheduleProcesses).values({
      scheduleItemId,
      stepId: step.id,
      name: step.name,
      category: step.category ?? "",
      status: "Pendente",
      sortOrder: step.sortOrder ?? 0,
    });
  }

  revalidatePath(`/cronograma/${scheduleItemId}`);
  return getScheduleProcesses(scheduleItemId);
}
