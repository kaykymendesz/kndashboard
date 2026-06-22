"use server";

import { db } from "@/lib/db";
import {
  attendanceCases,
  attendanceSteps,
  DEFAULT_ATTENDANCE_STEPS,
} from "@/lib/db/schema";
import { asc, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AttendanceCaseInput = {
  clientId: number;
  title: string;
  description?: string;
  demandType?: string;
  status?: string;
  responsible?: string;
  notes?: string;
  quotationId?: number | null;
};

export type AttendanceStepInput = {
  caseId: number;
  name: string;
  category?: string;
  status?: string;
  notes?: string;
  sortOrder?: number;
};

function revalidateCasePaths(caseId: number, clientSlug?: string) {
  revalidatePath("/atendimento");
  revalidatePath(`/atendimento/demandas/${caseId}`);
  if (clientSlug) revalidatePath(`/atendimento/clientes/${clientSlug}`);
}

export async function createAttendanceCase(input: AttendanceCaseInput, clientSlug?: string) {
  const [row] = await db
    .insert(attendanceCases)
    .values({
      clientId: input.clientId,
      title: input.title,
      description: input.description ?? "",
      demandType: input.demandType ?? "Novo projeto",
      status: "Aguardando",
      responsible: input.responsible ?? "",
      notes: input.notes ?? "",
      quotationId: input.quotationId ?? null,
    })
    .returning();
  revalidateCasePaths(row.id, clientSlug);
  return row;
}

export async function updateAttendanceCase(id: number, input: Partial<AttendanceCaseInput>, clientSlug?: string) {
  await db
    .update(attendanceCases)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.demandType !== undefined && { demandType: input.demandType }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.responsible !== undefined && { responsible: input.responsible }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.quotationId !== undefined && { quotationId: input.quotationId }),
      updatedAt: new Date(),
    })
    .where(eq(attendanceCases.id, id));
  revalidateCasePaths(id, clientSlug);
}

export async function getAttendanceCaseById(id: number) {
  return db.query.attendanceCases.findFirst({ where: eq(attendanceCases.id, id) });
}

export async function getAttendanceCasesByClient(clientId: number) {
  return db.query.attendanceCases.findMany({
    where: eq(attendanceCases.clientId, clientId),
    orderBy: [desc(attendanceCases.createdAt)],
  });
}

export async function getAttendanceSteps(caseId: number) {
  return db.query.attendanceSteps.findMany({
    where: eq(attendanceSteps.caseId, caseId),
    orderBy: [asc(attendanceSteps.sortOrder), asc(attendanceSteps.id)],
  });
}

export async function getAttendanceStepById(id: number) {
  return db.query.attendanceSteps.findFirst({ where: eq(attendanceSteps.id, id) });
}

async function spawnDefaultSteps(caseId: number) {
  const existing = await getAttendanceSteps(caseId);
  if (existing.length > 0) return existing;

  for (const step of DEFAULT_ATTENDANCE_STEPS) {
    await db.insert(attendanceSteps).values({
      caseId,
      name: step.name,
      category: step.category,
      status: "Pendente",
      sortOrder: step.sortOrder,
    });
  }
  return getAttendanceSteps(caseId);
}

export async function startAttendance(caseId: number, clientSlug?: string) {
  const existing = await getAttendanceCaseById(caseId);
  if (!existing) return null;

  await db
    .update(attendanceCases)
    .set({
      status: "Em atendimento",
      attendedAt: existing.attendedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(attendanceCases.id, caseId));

  const steps = await spawnDefaultSteps(caseId);
  revalidateCasePaths(caseId, clientSlug);
  return steps;
}

export async function updateAttendanceStep(
  id: number,
  input: Partial<AttendanceStepInput>,
  clientSlug?: string
) {
  const step = await getAttendanceStepById(id);
  if (!step) return;

  const status = input.status ?? step.status;
  const completedAt =
    status === "Concluído" && step.status !== "Concluído"
      ? new Date()
      : status !== "Concluído"
        ? null
        : step.completedAt;

  await db
    .update(attendanceSteps)
    .set({
      name: input.name ?? step.name,
      category: input.category ?? step.category,
      status,
      notes: input.notes ?? step.notes,
      sortOrder: input.sortOrder ?? step.sortOrder,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(attendanceSteps.id, id));

  const allSteps = await getAttendanceSteps(step.caseId);
  const allDone =
    allSteps.length > 0 &&
    allSteps.every((s) => (s.id === id ? status === "Concluído" : s.status === "Concluído"));

  if (allDone) {
    await db
      .update(attendanceCases)
      .set({ status: "Finalizado", finishedAt: new Date(), updatedAt: new Date() })
      .where(eq(attendanceCases.id, step.caseId));
  }

  revalidateCasePaths(step.caseId, clientSlug);
  revalidatePath(`/atendimento/demandas/${step.caseId}/etapas/${id}`);
}

export async function createAttendanceStep(input: AttendanceStepInput, clientSlug?: string) {
  const [row] = await db.insert(attendanceSteps).values({
    caseId: input.caseId,
    name: input.name,
    category: input.category ?? "",
    status: input.status ?? "Pendente",
    notes: input.notes ?? "",
    sortOrder: input.sortOrder ?? 0,
  }).returning();
  revalidateCasePaths(input.caseId, clientSlug);
  return row;
}

export async function deleteAttendanceCase(id: number, clientSlug?: string) {
  await db.delete(attendanceCases).where(eq(attendanceCases.id, id));
  revalidateCasePaths(id, clientSlug);
}
