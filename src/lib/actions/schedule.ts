"use server";

import { db } from "@/lib/db";
import { scheduleItems } from "@/lib/db/schema";
import { parseDate, parseNumber } from "@/lib/format";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ScheduleInput = {
  plannedDate?: string;
  title: string;
  category?: string;
  priority?: string;
  status?: string;
  plannedValue?: string;
  actualValue?: string;
  difference?: string;
  responsible?: string;
  notes?: string;
};

function mapScheduleInput(input: ScheduleInput) {
  return {
    plannedDate: parseDate(input.plannedDate ?? ""),
    title: input.title,
    category: input.category ?? "",
    priority: input.priority ?? "Média",
    status: input.status ?? "Planejado",
    plannedValue: input.plannedValue ? String(parseNumber(input.plannedValue)) : null,
    actualValue: input.actualValue ? String(parseNumber(input.actualValue)) : null,
    difference: input.difference ? String(parseNumber(input.difference)) : null,
    responsible: input.responsible ?? "",
    notes: input.notes ?? "",
    updatedAt: new Date(),
  };
}

export async function createScheduleItem(input: ScheduleInput) {
  await db.insert(scheduleItems).values(mapScheduleInput(input));
  revalidatePath("/cronograma");
  revalidatePath("/");
}

export async function updateScheduleItem(id: number, input: ScheduleInput) {
  await db.update(scheduleItems).set(mapScheduleInput(input)).where(eq(scheduleItems.id, id));
  revalidatePath("/cronograma");
  revalidatePath("/");
}

export async function deleteScheduleItem(id: number) {
  await db.delete(scheduleItems).where(eq(scheduleItems.id, id));
  revalidatePath("/cronograma");
  revalidatePath("/");
}

export async function getScheduleItems() {
  return db.query.scheduleItems.findMany({
    orderBy: (s, { asc }) => [asc(s.plannedDate)],
  });
}
