"use server";

import { db } from "@/lib/db";
import { menuItems, classifications } from "@/lib/db/schema";
import { DEFAULT_MENUS, DEFAULT_CLASSIFICATIONS } from "@/lib/constants";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type MenuItemInput = {
  label: string;
  href: string;
  icon: string;
  groupLabel?: string;
  sortOrder?: number;
  visible?: boolean;
};

export type ClassificationInput = {
  type: string;
  name: string;
  color?: string;
  sortOrder?: number;
};

export async function getMenuItems() {
  const items = await db.query.menuItems.findMany({
    orderBy: [asc(menuItems.sortOrder), asc(menuItems.id)],
  });

  if (items.length === 0) {
    return DEFAULT_MENUS.map((m, i) => ({
      id: i,
      label: m.label,
      href: m.href,
      icon: m.icon,
      groupLabel: m.groupLabel,
      sortOrder: m.sortOrder,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  const visible = items.filter((m) => m.visible);
  const hrefs = new Set(visible.map((m) => m.href));

  const missingDefaults = DEFAULT_MENUS.filter((m) => !hrefs.has(m.href)).map((m, i) => ({
    id: -(i + 1),
    label: m.label,
    href: m.href,
    icon: m.icon,
    groupLabel: m.groupLabel,
    sortOrder: m.sortOrder,
    visible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return [...visible, ...missingDefaults].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id
  );
}

export async function getAllMenuItems() {
  return db.query.menuItems.findMany({
    orderBy: [asc(menuItems.sortOrder), asc(menuItems.id)],
  });
}

export async function createMenuItem(input: MenuItemInput) {
  await db.insert(menuItems).values({
    label: input.label,
    href: input.href,
    icon: input.icon,
    groupLabel: input.groupLabel ?? "Navegação",
    sortOrder: input.sortOrder ?? 0,
    visible: input.visible ?? true,
  });
  revalidatePath("/", "layout");
  revalidatePath("/configuracoes");
}

export async function updateMenuItem(id: number, input: MenuItemInput) {
  await db
    .update(menuItems)
    .set({ ...input, groupLabel: input.groupLabel ?? "Navegação", updatedAt: new Date() })
    .where(eq(menuItems.id, id));
  revalidatePath("/", "layout");
  revalidatePath("/configuracoes");
}

export async function deleteMenuItem(id: number) {
  await db.delete(menuItems).where(eq(menuItems.id, id));
  revalidatePath("/", "layout");
  revalidatePath("/configuracoes");
}

export async function getClassifications(type?: string) {
  const items = await db.query.classifications.findMany({
    orderBy: [asc(classifications.sortOrder), asc(classifications.name)],
  });
  if (items.length === 0) {
    const defaults = type
      ? DEFAULT_CLASSIFICATIONS.filter((c) => c.type === type)
      : DEFAULT_CLASSIFICATIONS;
    return defaults.map((c, i) => ({
      id: i,
      type: c.type,
      name: c.name,
      color: c.color,
      sortOrder: c.sortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
  return type ? items.filter((c) => c.type === type) : items;
}

export async function createClassification(input: ClassificationInput) {
  await db.insert(classifications).values({
    type: input.type,
    name: input.name,
    color: input.color ?? "#1e3a5f",
    sortOrder: input.sortOrder ?? 0,
  });
  revalidatePath("/configuracoes");
}

export async function updateClassification(id: number, input: ClassificationInput) {
  await db
    .update(classifications)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(classifications.id, id));
  revalidatePath("/configuracoes");
}

export async function deleteClassification(id: number) {
  await db.delete(classifications).where(eq(classifications.id, id));
  revalidatePath("/configuracoes");
}

export async function getClassificationNames(type: string) {
  const items = await getClassifications(type);
  return items.map((c) => c.name);
}
