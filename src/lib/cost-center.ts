import type { Client, Project } from "@/lib/db/schema";
import { canAcceptNewExpenses, isArchivedProject, isClosedProject } from "@/lib/db/schema";
import { KN_GENERAL_COST_CENTER } from "@/lib/expense-allocation";

export { KN_GENERAL_COST_CENTER };

export function buildCostCenter(
  project: Pick<Project, "name" | "projectType"> | null | undefined,
  client: Pick<Client, "name"> | null | undefined,
  expenseScope?: string | null
): string {
  if (expenseScope === "kn_geral" || (!project && expenseScope !== "projeto_cliente")) {
    return KN_GENERAL_COST_CENTER;
  }
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
  if (scope === "projeto_cliente") return "Projeto de cliente";
  if (scope === "kn_geral") return "K&N — Geral";
  return "Empresa K&N";
}

export function filterInternalProjects<T extends Project>(projects: T[]): T[] {
  return projects.filter(
    (p) => p.projectType !== "cliente" && !isArchivedProject(p) && p.slug !== "kn-empresa"
  );
}

/** Projetos de cliente disponíveis para novos lançamentos (inclui Cotação, exclui Concluído/Cancelado). */
export function filterClientProjectsForExpenses<T extends Project>(projects: T[], clientId: number): T[] {
  return projects.filter(
    (p) =>
      p.projectType === "cliente" &&
      p.clientId === clientId &&
      canAcceptNewExpenses(p)
  );
}

export function filterAllClientProjects<T extends Project>(projects: T[], clientId: number): T[] {
  return projects.filter((p) => p.projectType === "cliente" && p.clientId === clientId);
}

export function filterActiveClientProjects<T extends Project>(projects: T[]): T[] {
  return projects.filter(
    (p) => p.projectType === "cliente" && !isClosedProject(p.status) && !isArchivedProject(p)
  );
}

export function filterClosedClientProjects<T extends Project>(projects: T[]): T[] {
  return projects.filter((p) => p.projectType === "cliente" && isClosedProject(p.status));
}

export function filterActiveProjects<T extends Project>(projects: T[]): T[] {
  return projects.filter((p) => !isArchivedProject(p) && p.slug !== "kn-empresa");
}
