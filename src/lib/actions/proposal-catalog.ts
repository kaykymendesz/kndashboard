"use server";

import { db } from "@/lib/db";
import {
  proposalGuaranteeCatalog,
  proposalServiceCatalog,
  proposalTemplates,
} from "@/lib/db/schema";
import { slugify } from "@/lib/slug";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ensureProposalsSchema } from "@/lib/proposals/ensure-schema";

function revalidateCatalog() {
  revalidatePath("/propostas");
  revalidatePath("/propostas/catalogo");
  revalidatePath("/propostas/nova");
}

export async function getServiceCatalogAll() {
  await ensureProposalsSchema();
  return db.query.proposalServiceCatalog.findMany({
    orderBy: (s, { asc }) => [asc(s.sortOrder), asc(s.name)],
  });
}

export async function createCatalogService(input: {
  name: string;
  category?: string;
  description?: string;
  defaultValue?: string;
}) {
  const rows = await db.select().from(proposalServiceCatalog);
  await db.insert(proposalServiceCatalog).values({
    name: input.name,
    category: input.category ?? "",
    description: input.description ?? "",
    defaultValue: input.defaultValue ? input.defaultValue : null,
    sortOrder: rows.length + 1,
    active: true,
  });
  revalidateCatalog();
}

export async function updateCatalogService(
  id: number,
  input: { name: string; category?: string; description?: string; active?: boolean }
) {
  await db
    .update(proposalServiceCatalog)
    .set({
      name: input.name,
      category: input.category ?? "",
      description: input.description ?? "",
      active: input.active ?? true,
    })
    .where(eq(proposalServiceCatalog.id, id));
  revalidateCatalog();
}

export async function deleteCatalogService(id: number) {
  await db.delete(proposalServiceCatalog).where(eq(proposalServiceCatalog.id, id));
  revalidateCatalog();
}

export async function getGuaranteeCatalogAll() {
  await ensureProposalsSchema();
  return db.query.proposalGuaranteeCatalog.findMany({
    orderBy: (g, { asc }) => [asc(g.sortOrder), asc(g.name)],
  });
}

export async function createCatalogGuarantee(input: { name: string; description?: string }) {
  const rows = await db.select().from(proposalGuaranteeCatalog);
  await db.insert(proposalGuaranteeCatalog).values({
    name: input.name,
    description: input.description ?? "",
    sortOrder: rows.length + 1,
    active: true,
  });
  revalidateCatalog();
}

export async function updateCatalogGuarantee(
  id: number,
  input: { name: string; description?: string; active?: boolean }
) {
  await db
    .update(proposalGuaranteeCatalog)
    .set({
      name: input.name,
      description: input.description ?? "",
      active: input.active ?? true,
    })
    .where(eq(proposalGuaranteeCatalog.id, id));
  revalidateCatalog();
}

export async function deleteCatalogGuarantee(id: number) {
  await db.delete(proposalGuaranteeCatalog).where(eq(proposalGuaranteeCatalog.id, id));
  revalidateCatalog();
}

export async function getProposalTemplates() {
  await ensureProposalsSchema();
  return db.query.proposalTemplates.findMany({
    orderBy: (t, { desc }) => [desc(t.isDefault), desc(t.updatedAt)],
  });
}

export async function createProposalTemplate(input: {
  name: string;
  templateType?: string;
  layoutConfig?: string;
  isDefault?: boolean;
}) {
  const slug = slugify(input.name) || `template-${Date.now()}`;
  if (input.isDefault) {
    await db.update(proposalTemplates).set({ isDefault: false });
  }
  const [row] = await db
    .insert(proposalTemplates)
    .values({
      name: input.name,
      slug,
      templateType: input.templateType ?? "proposta_comercial",
      layoutConfig: input.layoutConfig ?? "{}",
      isDefault: input.isDefault ?? false,
    })
    .returning();
  revalidatePath("/propostas/templates");
  return row;
}

export async function setDefaultTemplate(id: number) {
  await db.update(proposalTemplates).set({ isDefault: false });
  await db.update(proposalTemplates).set({ isDefault: true, updatedAt: new Date() }).where(eq(proposalTemplates.id, id));
  revalidatePath("/propostas/templates");
}

export async function deleteProposalTemplate(id: number) {
  await db.delete(proposalTemplates).where(eq(proposalTemplates.id, id));
  revalidatePath("/propostas/templates");
}

export async function saveProposalAsTemplate(proposalId: number, name: string, layoutConfig: string) {
  return createProposalTemplate({
    name,
    layoutConfig,
    templateType: "proposta_comercial",
  });
}
