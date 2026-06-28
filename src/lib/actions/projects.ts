"use server";

import { db } from "@/lib/db";
import {
  projects,
  projectInfo,
  expenses,
  activities,
  clients,
  COMPANY_PROJECT_SLUG,
  WIKINAYA_SLUG,
  type ProjectType,
} from "@/lib/db/schema";
import { filterActiveProjects, filterInternalProjects } from "@/lib/cost-center";
import { getProjectFinancialSummary } from "@/lib/project-finance";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProjectInput = {
  name: string;
  slug: string;
  description?: string;
  status?: string;
  projectType?: ProjectType | string;
  clientId?: number | null;
  contractedRevenue?: string;
  color?: string;
  notes?: string;
};

export async function getProjects() {
  const all = await db.query.projects.findMany({
    orderBy: (p, { asc }) => [asc(p.name)],
  });

  const operational = filterActiveProjects(all.filter((p) => p.slug !== COMPANY_PROJECT_SLUG));
  const allClients = await db.query.clients.findMany();
  const clientMap = new Map(allClients.map((c) => [c.id, c.name]));

  return Promise.all(
    operational.map(async (project) => {
      const finance = await getProjectFinancialSummary(project.id);
      const activityRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(activities)
        .where(eq(activities.projectId, project.id));

      return {
        ...project,
        clientName: project.clientId ? clientMap.get(project.clientId) ?? null : null,
        totalExpenses: finance?.totalExpenses ?? 0,
        monthlyExpenses: finance?.monthlyExpenses ?? 0,
        expenseCount: finance?.expenseCount ?? 0,
        activityCount: activityRows[0]?.count ?? 0,
        contractedRevenue: finance?.contractedRevenue ?? 0,
        receivedRevenue: finance?.receivedRevenue ?? 0,
        grossProfit: finance?.grossProfit ?? 0,
        marginPercent: finance?.marginPercent,
        lastExpenseDate: finance?.lastExpenseDate ?? null,
      };
    })
  );
}

export async function getOperationalProjects() {
  const all = await db.query.projects.findMany({
    orderBy: (p, { asc }) => [asc(p.name)],
  });
  return filterActiveProjects(all.filter((p) => p.slug !== COMPANY_PROJECT_SLUG));
}

export async function getInternalProjects() {
  const all = await getOperationalProjects();
  return filterInternalProjects(all);
}

export async function getClientProjects(clientId?: number) {
  const all = await getOperationalProjects();
  if (!clientId) {
    return all.filter((p) => p.projectType === "cliente");
  }
  return all.filter((p) => p.projectType === "cliente" && p.clientId === clientId);
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

  const client = project.clientId
    ? await db.query.clients.findFirst({ where: eq(clients.id, project.clientId) })
    : null;

  const finance = await getProjectFinancialSummary(project.id);
  const totalSpent = finance?.totalExpenses ?? 0;

  return { project, client, details, expenses: projectExpenses, totalSpent, finance };
}

export async function getWikinayaProject() {
  return getProjectBySlug(WIKINAYA_SLUG);
}

export async function createProject(input: ProjectInput) {
  const projectType = input.projectType ?? "interno";
  const [row] = await db
    .insert(projects)
    .values({
      name: input.name,
      slug: input.slug.toLowerCase().replace(/\s+/g, "-"),
      description: input.description ?? "",
      status: input.status ?? "Ativo",
      projectType,
      clientId: projectType === "cliente" ? input.clientId ?? null : null,
      contractedRevenue:
        input.contractedRevenue && projectType === "cliente"
          ? String(parseFloat(input.contractedRevenue) || 0)
          : null,
      color: input.color ?? "#1e3a5f",
      notes: input.notes ?? "",
    })
    .returning();
  revalidatePath("/projetos");
  revalidatePath("/configuracoes");
  return row;
}

export async function updateProject(id: number, input: ProjectInput) {
  const projectType = input.projectType ?? "interno";
  await db
    .update(projects)
    .set({
      name: input.name,
      slug: input.slug.toLowerCase().replace(/\s+/g, "-"),
      description: input.description ?? "",
      status: input.status ?? "Ativo",
      projectType,
      clientId: projectType === "cliente" ? input.clientId ?? null : null,
      contractedRevenue:
        input.contractedRevenue && projectType === "cliente"
          ? String(parseFloat(input.contractedRevenue) || 0)
          : null,
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
