"use server";

import { db } from "@/lib/db";
import { expenses, vendors } from "@/lib/db/schema";
import { slugify } from "@/lib/slug";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type VendorInput = {
  name: string;
  slug?: string;
  category?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: string;
};

async function uniqueSlug(name: string, excludeId?: number) {
  const base = slugify(name) || "fornecedor";
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await db.query.vendors.findFirst({ where: eq(vendors.slug, slug) });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

function mapVendorInput(input: VendorInput, slug: string) {
  return {
    name: input.name,
    slug,
    category: input.category ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    notes: input.notes ?? "",
    status: input.status ?? "Ativo",
    updatedAt: new Date(),
  };
}

function revalidateVendorPaths() {
  revalidatePath("/fornecedores");
  revalidatePath("/financeiro");
  revalidatePath("/gastos");
}

export async function createVendor(input: VendorInput) {
  const slug = input.slug ? slugify(input.slug) : await uniqueSlug(input.name);
  const [row] = await db.insert(vendors).values(mapVendorInput(input, slug)).returning();
  revalidateVendorPaths();
  return row;
}

export async function updateVendor(id: number, input: VendorInput) {
  const slug = input.slug ? slugify(input.slug) : await uniqueSlug(input.name, id);
  await db.update(vendors).set(mapVendorInput(input, slug)).where(eq(vendors.id, id));
  revalidateVendorPaths();
}

export async function deleteVendor(id: number) {
  await db.delete(vendors).where(eq(vendors.id, id));
  revalidateVendorPaths();
}

export async function getVendors() {
  return db.query.vendors.findMany({ orderBy: (v, { asc }) => [asc(v.name)] });
}

export async function getVendorById(id: number) {
  return db.query.vendors.findFirst({ where: eq(vendors.id, id) });
}

export async function getVendorsWithTotals() {
  const allVendors = await getVendors();
  const totals = await db
    .select({
      vendorId: expenses.vendorId,
      vendorName: expenses.vendor,
      total: sql<string>`coalesce(sum(${expenses.totalValue}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(sql`${expenses.hasCost} IS NOT FALSE`)
    .groupBy(expenses.vendorId, expenses.vendor);

  const byId = new Map(totals.filter((t) => t.vendorId).map((t) => [t.vendorId!, t]));
  const byName = new Map(
    totals
      .filter((t) => !t.vendorId && t.vendorName)
      .map((t) => [t.vendorName!.toLowerCase(), t])
  );

  return allVendors.map((vendor) => {
    const row = byId.get(vendor.id);
    return {
      ...vendor,
      totalSpent: Number(row?.total ?? 0),
      expenseCount: row?.count ?? 0,
    };
  });
}

export async function getVendorTotalsForFinanceiro() {
  const rows = await db
    .select({
      name: sql<string>`coalesce(${vendors.name}, ${expenses.vendor}, 'Sem fornecedor')`,
      total: sql<string>`coalesce(sum(${expenses.totalValue}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .leftJoin(vendors, eq(expenses.vendorId, vendors.id))
    .where(sql`${expenses.hasCost} IS NOT FALSE`)
    .groupBy(vendors.name, expenses.vendor)
    .orderBy(sql`sum(${expenses.totalValue}) desc`);

  return rows.map((r) => ({
    name: r.name,
    total: Number(r.total ?? 0),
    count: r.count ?? 0,
  }));
}
