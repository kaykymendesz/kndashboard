"use server";

import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { parseNumber } from "@/lib/format";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ClientInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  project?: string;
  status?: string;
  contractValue?: string;
  notes?: string;
};

function mapClientInput(input: ClientInput) {
  return {
    name: input.name,
    company: input.company ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    project: input.project ?? "",
    status: input.status ?? "Ativo",
    contractValue: input.contractValue ? String(parseNumber(input.contractValue)) : null,
    notes: input.notes ?? "",
    updatedAt: new Date(),
  };
}

export async function createClient(input: ClientInput) {
  await db.insert(clients).values(mapClientInput(input));
  revalidatePath("/clientes");
  revalidatePath("/gestao");
}

export async function updateClient(id: number, input: ClientInput) {
  await db.update(clients).set(mapClientInput(input)).where(eq(clients.id, id));
  revalidatePath("/clientes");
  revalidatePath("/gestao");
}

export async function deleteClient(id: number) {
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clientes");
  revalidatePath("/gestao");
}

export async function getClients() {
  return db.query.clients.findMany({ orderBy: (c, { desc }) => [desc(c.createdAt)] });
}
