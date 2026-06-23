import { notFound } from "next/navigation";
import { RevenueFormPage } from "@/components/revenue-form-page";
import { getOperationalProjects } from "@/lib/actions/projects";
import { getRevenueById } from "@/lib/actions/revenues";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function ReceitaDetailPage({ params }: Props) {
  const { id } = await params;
  const revenueId = Number(id);
  if (Number.isNaN(revenueId)) notFound();

  const revenue = await getRevenueById(revenueId);
  if (!revenue) notFound();

  const [projects, clients] = await Promise.all([
    getOperationalProjects(),
    db.query.clients.findMany(),
  ]);

  return <RevenueFormPage revenue={revenue} projects={projects} clients={clients} />;
}
