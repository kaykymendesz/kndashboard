"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createProject, updateProject, deleteProject, type ProjectInput } from "@/lib/actions/projects";
import type { Project } from "@/lib/db/schema";

export function ProjectFormPage({ project }: { project?: Project }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ProjectInput>(
    project
      ? {
          name: project.name,
          slug: project.slug,
          description: project.description ?? "",
          status: project.status ?? "Ativo",
          color: project.color ?? "#1e3a5f",
          notes: project.notes ?? "",
        }
      : { name: "", slug: "", description: "", status: "Ativo", color: "#1e3a5f", notes: "" }
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (project) {
          await updateProject(project.id, form);
          toast.success("Projeto atualizado");
          router.push(`/projetos/${project.slug}`);
        } else {
          const row = await createProject(form);
          toast.success("Projeto criado");
          router.push(`/projetos/${row.slug}`);
        }
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    if (!project || !confirm("Excluir projeto?")) return;
    startTransition(async () => {
      await deleteProject(project.id);
      toast.success("Projeto excluído");
      router.push("/configuracoes?tab=projects");
    });
  };

  return (
    <div className="kn-page max-w-xl">
      <Link href="/configuracoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Configurações
      </Link>
      <PageHeader title={project ? "Editar projeto" : "Novo projeto"} icon={FolderKanban} />
      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Cor</Label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" className="kn-btn-primary" disabled={pending}>Salvar</Button>
              {project && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>Excluir</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
