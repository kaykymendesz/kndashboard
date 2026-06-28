import { notFound } from "next/navigation";
import { ProjectFormPage } from "@/components/project-form-page";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects } from "@/lib/db/schema";

type Props = { params: Promise<{ id: string }> };

export default async function EditarProjetoConfigPage({ params }: Props) {
  const { id } = await params;
  const projectId = Number(id);
  if (Number.isNaN(projectId)) notFound();
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) notFound();
  const clients = await db.query.clients.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });
  return <ProjectFormPage project={project} clients={clients} />;
}
