import { RevenueFormPage } from "@/components/revenue-form-page";
import { getOperationalProjects } from "@/lib/actions/projects";
import { db } from "@/lib/db";

export default async function NovaReceitaPage() {
  const [projects, clients] = await Promise.all([
    getOperationalProjects(),
    db.query.clients.findMany(),
  ]);
  return <RevenueFormPage projects={projects} clients={clients} />;
}
