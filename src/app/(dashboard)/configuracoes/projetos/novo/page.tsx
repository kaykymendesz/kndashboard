import { ProjectFormPage } from "@/components/project-form-page";
import { db } from "@/lib/db";

export default async function NovoProjetoConfigPage() {
  const clients = await db.query.clients.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });
  return <ProjectFormPage clients={clients} />;
}
