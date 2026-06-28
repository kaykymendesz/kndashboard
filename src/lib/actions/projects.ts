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
  DEFAULT_CLIENT_PROJECT_STATUS,
  DEFAULT_INTERNAL_PROJECT_STATUS,
  type ProjectType,
} from "@/lib/db/schema";
import {
  filterActiveProjects,
  filterInternalProjects,
  filterAllClientProjects,
  filterActiveClientProjects,
  filterClosedClientProjects,
} from "@/lib/cost-center";
import { getProjectFinancialSummary } from "@/lib/project-finance";
import { slugify } from "@/lib/slug";
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

async function uniqueProjectSlug(name: string, clientId?: number | null, excludeId?: number) {
  const base = slugify(name) || "projeto";
  let slug = clientId ? `${base}-${clientId}` : base;
  let n = 1;
  while (true) {
    const existing = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
    if (!existing || existing.id === excludeId) return slug;
    slug = clientId ? `${base}-${clientId}-${n++}` : `${base}-${n++}`;
  }
}

async function enrichProject(project: typeof projects.$inferSelect) {
  const finance = await getProjectFinancialSummary(project.id);
  const activityRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activities)
    .where(eq(activities.projectId, project.id));

  const client = project.clientId
    ? await db.query.clients.findFirst({ where: eq(clients.id, project.clientId) })
    : null;

  return {
    ...project,
    clientName: client?.name ?? null,
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
}

export async function getProjects() {
  const all = await db.query.projects.findMany({
    orderBy: (p, { asc }) => [asc(p.name)],
  });

  const operational = filterActiveProjects(all.filter((p) => p.slug !== COMPANY_PROJECT_SLUG));
  return Promise.all(operational.map(enrichProject));
}

export async function getProjectsByClientId(clientId: number) {
  const all = await db.query.projects.findMany({
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
  });
  const clientProjects = filterAllClientProjects(all, clientId);
  return Promise.all(clientProjects.map(enrichProject));
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
  return filterAllClientProjects(all, clientId);
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
  const defaultStatus =
    projectType === "cliente" ? DEFAULT_CLIENT_PROJECT_STATUS : DEFAULT_INTERNAL_PROJECT_STATUS;
  const slug =
    input.slug?.trim() ||
    (await uniqueProjectSlug(input.name, projectType === "cliente" ? input.clientId : null));

  const [row] = await db
    .insert(projects)
    .values({
      name: input.name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      description: input.description ?? "",
      status: input.status ?? defaultStatus,
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

  revalidatePaths();
  return row;
}

export async function createClientProject(input: {
  clientId: number;
  name: string;
  status?: string;
  description?: string;
  contractedRevenue?: string;
  notes?: string;
}) {
  const slug = await uniqueProjectSlug(input.name, input.clientId);
  return createProject({
    name: input.name,
    slug,
    description: input.description ?? "",
    status: input.status ?? DEFAULT_CLIENT_PROJECT_STATUS,
    projectType: "cliente",
    clientId: input.clientId,
    contractedRevenue: input.contractedRevenue,
    notes: input.notes ?? "",
  });
}

export async function updateProject(id: number, input: ProjectInput) {
  const projectType = input.projectType ?? "interno";
  await db
    .update(projects)
    .set({
      name: input.name,
      slug: input.slug.toLowerCase().replace(/\s+/g, "-"),
      description: input.description ?? "",
      status: input.status ?? DEFAULT_INTERNAL_PROJECT_STATUS,
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
  revalidatePaths();
}

export async function updateProjectStatus(id: number, status: string) {
  await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, id));
  revalidatePaths();
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePaths();
}

function revalidatePaths() {
  revalidatePath("/projetos");
  revalidatePath("/clientes");
  revalidatePath("/configuracoes");
  revalidatePath("/gastos");
  revalidatePath("/cronograma");
  revalidatePath("/financeiro");
}

export { filterActiveClientProjects, filterClosedClientProjects };
