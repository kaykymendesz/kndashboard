"use server";

import { db } from "@/lib/db";
import { revenues } from "@/lib/db/schema";
import { parseDate, parseNumber } from "@/lib/format";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RevenueInput = {
  description: string;
  amount: string;
  receivedDate?: string;
  category?: string;
  status?: string;
  projectId?: number | null;
  clientId?: number | null;
  notes?: string;
};

function mapRevenueInput(input: RevenueInput) {
  return {
    description: input.description,
    amount: String(parseNumber(input.amount)),
    receivedDate: parseDate(input.receivedDate ?? ""),
    category: input.category ?? "",
    status: input.status ?? "Recebido",
    projectId: input.projectId ?? null,
    clientId: input.clientId ?? null,
    notes: input.notes ?? "",
    updatedAt: new Date(),
  };
}

function revalidateRevenuePaths() {
  revalidatePath("/lucro");
  revalidatePath("/financeiro");
  revalidatePath("/gestao");
}

export async function createRevenue(input: RevenueInput) {
  const [row] = await db.insert(revenues).values(mapRevenueInput(input)).returning();
  revalidateRevenuePaths();
  return row;
}

export async function updateRevenue(id: number, input: RevenueInput) {
  await db.update(revenues).set(mapRevenueInput(input)).where(eq(revenues.id, id));
  revalidateRevenuePaths();
}

export async function deleteRevenue(id: number) {
  await db.delete(revenues).where(eq(revenues.id, id));
  revalidateRevenuePaths();
}

export async function getRevenues() {
  return db.query.revenues.findMany({
    orderBy: (r, { desc }) => [desc(r.receivedDate), desc(r.id)],
  });
}

export async function getRevenueById(id: number) {
  return db.query.revenues.findFirst({ where: eq(revenues.id, id) });
}

export async function getRevenuesWithRelations() {
  const [allRevenues, allProjects, allClients] = await Promise.all([
    getRevenues(),
    db.query.projects.findMany(),
    db.query.clients.findMany(),
  ]);

  const projectMap = new Map(allProjects.map((p) => [p.id, p.name]));
  const clientMap = new Map(allClients.map((c) => [c.id, c.name]));

  return allRevenues.map((r) => ({
    ...r,
    projectName: r.projectId ? projectMap.get(r.projectId) ?? "—" : "—",
    clientName: r.clientId ? clientMap.get(r.clientId) ?? "—" : "—",
  }));
}
