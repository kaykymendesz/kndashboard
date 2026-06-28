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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject, updateProject, deleteProject, type ProjectInput } from "@/lib/actions/projects";
import { PROJECT_TYPES, type Client, type Project } from "@/lib/db/schema";

type Props = {
  project?: Project;
  clients?: Client[];
};

export function ProjectFormPage({ project, clients = [] }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ProjectInput>(
    project
      ? {
          name: project.name,
          slug: project.slug,
          description: project.description ?? "",
          status: project.status ?? "Ativo",
          projectType: project.projectType ?? "interno",
          clientId: project.clientId ?? null,
          contractedRevenue: project.contractedRevenue ? String(project.contractedRevenue) : "",
          color: project.color ?? "#1e3a5f",
          notes: project.notes ?? "",
        }
      : {
          name: "",
          slug: "",
          description: "",
          status: "Ativo",
          projectType: "interno",
          clientId: null,
          contractedRevenue: "",
          color: "#1e3a5f",
          notes: "",
        }
  );

  const isClientProject = form.projectType === "cliente";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClientProject && !form.clientId) {
      toast.error("Selecione o cliente do projeto.");
      return;
    }
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
            <div className="grid gap-2">
              <Label>Tipo de projeto</Label>
              <Select
                value={form.projectType ?? "interno"}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    projectType: v,
                    clientId: v === "cliente" ? form.clientId : null,
                    contractedRevenue: v === "cliente" ? form.contractedRevenue : "",
                  })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "interno" ? "Projeto interno K&N" : t === "cliente" ? "Projeto de cliente" : "Arquivado"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isClientProject && (
              <>
                <div className="grid gap-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={form.clientId ? String(form.clientId) : "none"}
                    onValueChange={(v) => setForm({ ...form, clientId: v === "none" ? null : Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecione</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Receita contratada (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.contractedRevenue}
                    onChange={(e) => setForm({ ...form, contractedRevenue: e.target.value })}
                    placeholder="Ex: 25000"
                  />
                </div>
              </>
            )}

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
