import type { Client, Project } from "@/lib/db/schema";
import { isArchivedProject } from "@/lib/db/schema";

export function buildCostCenter(
  project: Pick<Project, "name" | "projectType"> | null | undefined,
  client: Pick<Client, "name"> | null | undefined
): string {
  if (!project) return "";
  if (project.projectType === "cliente" && client?.name) {
    return `${client.name} · ${project.name}`;
  }
  return project.name;
}

export function resolveExpenseScope(
  project: Pick<Project, "projectType"> | null | undefined
): "kn_interno" | "projeto_cliente" {
  if (project?.projectType === "cliente") return "projeto_cliente";
  return "kn_interno";
}

export function belongsToLabel(scope: string | null | undefined): string {
  return scope === "projeto_cliente" ? "Projeto de cliente" : "Empresa K&N";
}

export function filterInternalProjects<T extends Project>(projects: T[]): T[] {
  return projects.filter(
    (p) => p.projectType !== "cliente" && !isArchivedProject(p) && p.slug !== "kn-empresa"
  );
}

export function filterClientProjects<T extends Project>(projects: T[], clientId: number): T[] {
  return projects.filter(
    (p) => p.projectType === "cliente" && p.clientId === clientId && !isArchivedProject(p)
  );
}

export function filterActiveProjects<T extends Project>(projects: T[]): T[] {
  return projects.filter((p) => !isArchivedProject(p) && p.slug !== "kn-empresa");
}
