"use server";

import { db } from "@/lib/db";
import { scheduleItems } from "@/lib/db/schema";
import { parseDate, parseNumber } from "@/lib/format";
import { getDefaultProcessFlow } from "@/lib/actions/process-flows";
import { initProcessesFromFlow } from "@/lib/actions/schedule-processes";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ScheduleInput = {
  plannedDate?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  plannedValue?: string;
  actualValue?: string;
  difference?: string;
  responsible?: string;
  notes?: string;
  flowId?: number | null;
};

function mapScheduleInput(input: ScheduleInput) {
  const planned = input.plannedValue ? parseNumber(input.plannedValue) : null;
  const actual = input.actualValue ? parseNumber(input.actualValue) : null;
  const diff =
    planned !== null && actual !== null ? actual - planned : input.difference ? parseNumber(input.difference) : null;

  return {
    plannedDate: parseDate(input.plannedDate ?? ""),
    title: input.title,
    description: input.description ?? "",
    category: input.category ?? "",
    priority: input.priority ?? "Média",
    status: input.status ?? "Planejado",
    plannedValue: planned !== null ? String(planned) : null,
    actualValue: actual !== null ? String(actual) : null,
    difference: diff !== null ? String(diff) : null,
    responsible: input.responsible ?? "",
    notes: input.notes ?? "",
    flowId: input.flowId ?? null,
    updatedAt: new Date(),
  };
}

export async function createScheduleItem(input: ScheduleInput) {
  const defaultFlow = await getDefaultProcessFlow();
  const flowId = input.flowId ?? defaultFlow?.id ?? null;

  const [item] = await db
    .insert(scheduleItems)
    .values({ ...mapScheduleInput(input), flowId })
    .returning();

  if (flowId) {
    await initProcessesFromFlow(item.id, flowId);
  }

  revalidatePath("/cronograma");
  revalidatePath("/gestao");
  return item;
}

export async function updateScheduleItem(id: number, input: ScheduleInput) {
  await db.update(scheduleItems).set(mapScheduleInput(input)).where(eq(scheduleItems.id, id));
  revalidatePath("/cronograma");
  revalidatePath(`/cronograma/${id}`);
  revalidatePath("/gestao");
}

export async function deleteScheduleItem(id: number) {
  await db.delete(scheduleItems).where(eq(scheduleItems.id, id));
  revalidatePath("/cronograma");
  revalidatePath("/gestao");
}

export async function getScheduleItems() {
  return db.query.scheduleItems.findMany({
    orderBy: (s, { asc }) => [asc(s.plannedDate)],
  });
}

export async function getScheduleItemById(id: number) {
  return db.query.scheduleItems.findFirst({ where: eq(scheduleItems.id, id) });
}
