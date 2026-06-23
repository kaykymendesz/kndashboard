"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Settings, Menu, Tags, FolderKanban, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteMenuItem,
  createClassification,
  updateClassification,
  deleteClassification,
  type ClassificationInput,
} from "@/lib/actions/settings";
import { deleteProject } from "@/lib/actions/projects";
import type { MenuItem, Classification, Project } from "@/lib/db/schema";
import { CLASSIFICATION_TYPES, ICON_OPTIONS, getIcon } from "@/lib/constants";
import { ProcessFlowsTab } from "@/components/process-flows-tab";
import { CadastroPanel } from "@/components/ui/cadastro-panel";
import type { ProcessFlow, ProcessStep } from "@/lib/db/schema";

type Props = {
  menus: MenuItem[];
  classifications: Classification[];
  projects: Project[];
  flowsWithSteps: { flow: ProcessFlow; steps: ProcessStep[] }[];
  processCategories: string[];
};

export function SettingsManager({ menus, classifications, projects, flowsWithSteps, processCategories }: Props) {
  return (
    <div className="kn-page">
      <PageHeader
        title="Configurações"
        description="Personalize menus, classificações, projetos e toda a estrutura do sistema."
        icon={Settings}
      />

      <Tabs defaultValue="menus" className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1">
          <TabsTrigger value="menus" className="gap-2"><Menu className="h-4 w-4" />Menus</TabsTrigger>
          <TabsTrigger value="classifications" className="gap-2"><Tags className="h-4 w-4" />Classificações</TabsTrigger>
          <TabsTrigger value="projects" className="gap-2"><FolderKanban className="h-4 w-4" />Projetos</TabsTrigger>
          <TabsTrigger value="flows" className="gap-2"><GitBranch className="h-4 w-4" />Fluxos de processo</TabsTrigger>
        </TabsList>

        <TabsContent value="menus">
          <MenusTab items={menus} />
        </TabsContent>
        <TabsContent value="classifications">
          <ClassificationsTab items={classifications} />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectsTab items={projects} />
        </TabsContent>
        <TabsContent value="flows">
          <ProcessFlowsTab flowsWithSteps={flowsWithSteps} categoryOptions={processCategories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MenusTab({ items }: { items: MenuItem[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/configuracoes/menus/novo"><Plus className="h-4 w-4" />Novo menu</Link>
        </Button>
      </div>
      <div className="kn-table-wrap">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Ordem</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <TableRow key={item.id} className="kn-row-hover">
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{item.href}</TableCell>
                  <TableCell>{item.groupLabel}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" asChild>
                      <Link href={`/configuracoes/menus/${item.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" disabled={pending} onClick={() => {
                      if (!confirm("Excluir menu?")) return;
                      startTransition(async () => { await deleteMenuItem(item.id); toast.success("Excluído"); });
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ClassificationsTab({ items }: { items: Classification[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const grouped = CLASSIFICATION_TYPES.map((t) => ({
    ...t,
    items: items.filter((c) => c.type === t.value),
  }));

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.value} className="kn-card overflow-hidden p-5">
          <h3 className="text-sm font-semibold mb-4">{group.label}</h3>
          <CadastroPanel
            title={group.label}
            items={group.items.map((c) => ({
              id: String(c.id),
              nome: c.name,
            }))}
            onCreate={(nome) =>
              new Promise((resolve, reject) => {
                startTransition(async () => {
                  try {
                    await createClassification({
                      type: group.value,
                      name: nome,
                      color: "#1e3a5f",
                      sortOrder: group.items.length + 1,
                    });
                    router.refresh();
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                });
              })
            }
            onEdit={(id, nome) =>
              new Promise((resolve, reject) => {
                const item = group.items.find((c) => String(c.id) === id);
                if (!item) return reject(new Error("Item não encontrado"));
                startTransition(async () => {
                  try {
                    await updateClassification(item.id, {
                      type: item.type,
                      name: nome,
                      color: item.color ?? "#1e3a5f",
                      sortOrder: item.sortOrder ?? 0,
                    });
                    router.refresh();
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                });
              })
            }
            onDelete={(id) =>
              new Promise((resolve, reject) => {
                startTransition(async () => {
                  try {
                    await deleteClassification(Number(id));
                    router.refresh();
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                });
              })
            }
            searchPlaceholder={`Buscar em ${group.label.toLowerCase()}...`}
          />
        </div>
      ))}
    </div>
  );
}

function ProjectsTab({ items }: { items: Project[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild className="kn-btn-primary gap-2">
          <Link href="/configuracoes/projetos/novo"><Plus className="h-4 w-4" />Novo projeto</Link>
        </Button>
      </div>
      <div className="kn-table-wrap">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="kn-row-hover">
                <TableCell className="font-medium flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color ?? "#1e3a5f" }} />
                  <Link href={`/projetos/${item.slug}`} className="hover:text-primary">{item.name}</Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.slug}</TableCell>
                <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" asChild>
                    <Link href={`/configuracoes/projetos/${item.id}`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" disabled={pending} onClick={() => {
                    if (!confirm("Excluir projeto?")) return;
                    startTransition(async () => { await deleteProject(item.id); toast.success("Excluído"); });
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
