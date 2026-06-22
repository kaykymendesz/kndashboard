"use server";

import { db } from "@/lib/db";
import { projects, projectInfo, expenses, activities, WIKINAYA_SLUG } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProjectInput = {
  name: string;
  slug: string;
  description?: string;
  status?: string;
  color?: string;
  notes?: string;
};

export async function getProjects() {
  const all = await db.query.projects.findMany({
    orderBy: (p, { asc }) => [asc(p.name)],
  });

  return Promise.all(
    all.map(async (project) => {
      const expenseRows = await db
        .select({
          total: sql<string>`coalesce(sum(${expenses.totalValue}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(expenses)
        .where(eq(expenses.projectId, project.id));

      const activityRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(activities)
        .where(eq(activities.projectId, project.id));

      return {
        ...project,
        totalExpenses: Number(expenseRows[0]?.total ?? 0),
        expenseCount: expenseRows[0]?.count ?? 0,
        activityCount: activityRows[0]?.count ?? 0,
      };
    })
  );
}

export async function getProjectBySlug(slug: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });
  if (!project) return null;

  const details = await db.query.projectInfo.findMany({
    where: eq(projectInfo.projectId, project.id),
    orderBy: (p, { asc }) => [asc(p.section), asc(p.field)],
  });

  const projectExpenses = await db.query.expenses.findMany({
    where: eq(expenses.projectId, project.id),
    orderBy: (e, { desc }) => [desc(e.purchaseDate)],
  });

  const totalSpent = projectExpenses.reduce((s, e) => s + Number(e.totalValue ?? 0), 0);

  return { project, details, expenses: projectExpenses, totalSpent };
}

export async function getWikinayaProject() {
  return getProjectBySlug(WIKINAYA_SLUG);
}

export async function createProject(input: ProjectInput) {
  await db.insert(projects).values({
    name: input.name,
    slug: input.slug.toLowerCase().replace(/\s+/g, "-"),
    description: input.description ?? "",
    status: input.status ?? "Ativo",
    color: input.color ?? "#1e3a5f",
    notes: input.notes ?? "",
  });
  revalidatePath("/projetos");
  revalidatePath("/configuracoes");
}

export async function updateProject(id: number, input: ProjectInput) {
  await db
    .update(projects)
    .set({
      name: input.name,
      slug: input.slug.toLowerCase().replace(/\s+/g, "-"),
      description: input.description ?? "",
      status: input.status ?? "Ativo",
      color: input.color ?? "#1e3a5f",
      notes: input.notes ?? "",
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));
  revalidatePath("/projetos");
  revalidatePath("/configuracoes");
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/projetos");
}
