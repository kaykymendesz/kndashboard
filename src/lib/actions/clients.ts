"use server";

import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { slugify } from "@/lib/slug";
import { parseNumber } from "@/lib/format";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ClientInput = {
  name: string;
  slug?: string;
  company?: string;
  email?: string;
  phone?: string;
  project?: string;
  status?: string;
  contractValue?: string;
  notes?: string;
};

async function uniqueSlug(name: string, excludeId?: number) {
  const base = slugify(name) || "cliente";
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await db.query.clients.findFirst({ where: eq(clients.slug, slug) });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

function mapClientInput(input: ClientInput, slug: string) {
  return {
    name: input.name,
    slug,
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
  const slug = input.slug ? slugify(input.slug) : await uniqueSlug(input.name);
  await db.insert(clients).values(mapClientInput(input, slug));
  revalidatePath("/clientes");
  revalidatePath("/gestao");
}

export async function updateClient(id: number, input: ClientInput) {
  const slug = input.slug ? slugify(input.slug) : await uniqueSlug(input.name, id);
  await db.update(clients).set(mapClientInput(input, slug)).where(eq(clients.id, id));
  revalidatePath("/clientes");
  revalidatePath("/gestao");
  revalidatePath(`/clientes/${slug}`);
}

export async function deleteClient(id: number) {
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clientes");
  revalidatePath("/gestao");
}

export async function getClients() {
  return db.query.clients.findMany({ orderBy: (c, { desc }) => [desc(c.createdAt)] });
}

export async function getClientsWithSummary() {
  const [allClients, allProjects] = await Promise.all([
    getClients(),
    db.query.projects.findMany(),
  ]);

  return allClients.map((client) => {
    const clientProjects = allProjects.filter(
      (p) => p.clientId === client.id && p.projectType === "cliente"
    );
    return {
      ...client,
      projectCount: clientProjects.length,
      activeProjects: clientProjects.filter(
        (p) => p.status !== "Concluído" && p.status !== "Cancelado"
      ).length,
    };
  });
}

export async function getClientBySlug(slug: string) {
  return db.query.clients.findFirst({ where: eq(clients.slug, slug) });
}

export async function getClientById(id: number) {
  return db.query.clients.findFirst({ where: eq(clients.id, id) });
}
