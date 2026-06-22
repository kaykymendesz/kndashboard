"use server";

import { db } from "@/lib/db";
import { processFlows, processSteps } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProcessFlowInput = {
  name: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
};

export type ProcessStepInput = {
  flowId: number;
  name: string;
  category?: string;
  description?: string;
  sortOrder?: number;
};

export async function getProcessFlows() {
  return db.query.processFlows.findMany({
    orderBy: [asc(processFlows.sortOrder), asc(processFlows.id)],
  });
}

export async function getProcessFlowWithSteps(id: number) {
  const flow = await db.query.processFlows.findFirst({
    where: eq(processFlows.id, id),
  });
  if (!flow) return null;
  const steps = await db.query.processSteps.findMany({
    where: eq(processSteps.flowId, id),
    orderBy: [asc(processSteps.sortOrder), asc(processSteps.id)],
  });
  return { flow, steps };
}

export async function getDefaultProcessFlow() {
  const flows = await getProcessFlows();
  return flows.find((f) => f.isDefault) ?? flows[0] ?? null;
}

export async function createProcessFlow(input: ProcessFlowInput) {
  if (input.isDefault) {
    await db.update(processFlows).set({ isDefault: false, updatedAt: new Date() });
  }
  const [flow] = await db
    .insert(processFlows)
    .values({
      name: input.name,
      description: input.description ?? "",
      isDefault: input.isDefault ?? false,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  revalidatePath("/configuracoes");
  return flow;
}

export async function updateProcessFlow(id: number, input: ProcessFlowInput) {
  if (input.isDefault) {
    await db.update(processFlows).set({ isDefault: false, updatedAt: new Date() });
  }
  await db
    .update(processFlows)
    .set({
      name: input.name,
      description: input.description ?? "",
      isDefault: input.isDefault ?? false,
      sortOrder: input.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(processFlows.id, id));
  revalidatePath("/configuracoes");
}

export async function deleteProcessFlow(id: number) {
  await db.delete(processFlows).where(eq(processFlows.id, id));
  revalidatePath("/configuracoes");
}

export async function createProcessStep(input: ProcessStepInput) {
  await db.insert(processSteps).values({
    flowId: input.flowId,
    name: input.name,
    category: input.category ?? "",
    description: input.description ?? "",
    sortOrder: input.sortOrder ?? 0,
  });
  revalidatePath("/configuracoes");
}

export async function updateProcessStep(id: number, input: Omit<ProcessStepInput, "flowId"> & { flowId?: number }) {
  await db
    .update(processSteps)
    .set({
      name: input.name,
      category: input.category ?? "",
      description: input.description ?? "",
      sortOrder: input.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(processSteps.id, id));
  revalidatePath("/configuracoes");
}

export async function deleteProcessStep(id: number) {
  await db.delete(processSteps).where(eq(processSteps.id, id));
  revalidatePath("/configuracoes");
}

export async function getAllFlowsWithSteps() {
  const flows = await getProcessFlows();
  const result = await Promise.all(
    flows.map(async (flow) => {
      const steps = await db.query.processSteps.findMany({
        where: eq(processSteps.flowId, flow.id),
        orderBy: [asc(processSteps.sortOrder), asc(processSteps.id)],
      });
      return { flow, steps };
    })
  );
  return result;
}
