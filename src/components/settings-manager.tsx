"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Settings, Menu, Tags, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createClassification,
  updateClassification,
  deleteClassification,
  type MenuItemInput,
  type ClassificationInput,
} from "@/lib/actions/settings";
import { createProject, updateProject, deleteProject, type ProjectInput } from "@/lib/actions/projects";
import type { MenuItem, Classification, Project } from "@/lib/db/schema";
import { CLASSIFICATION_TYPES, ICON_OPTIONS, getIcon } from "@/lib/constants";

type Props = {
  menus: MenuItem[];
  classifications: Classification[];
  projects: Project[];
};

export function SettingsManager({ menus, classifications, projects }: Props) {
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
      </Tabs>
    </div>
  );
}

function MenusTab({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<MenuItem | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<MenuItemInput>({
    label: "", href: "/", icon: "LayoutDashboard", groupLabel: "Navegação", sortOrder: 0, visible: true,
  });

  const openEdit = (item?: MenuItem) => {
    if (item) {
      setEdit(item);
      setForm({
        label: item.label,
        href: item.href,
        icon: item.icon,
        groupLabel: item.groupLabel ?? "Navegação",
        sortOrder: item.sortOrder ?? 0,
        visible: item.visible ?? true,
      });
    } else {
      setEdit(null);
      setForm({ label: "", href: "/", icon: "LayoutDashboard", groupLabel: "Navegação", sortOrder: items.length + 1, visible: true });
    }
    setOpen(true);
  };

  const save = () => {
    startTransition(async () => {
      try {
        if (edit) await updateMenuItem(edit.id, form);
        else await createMenuItem(form);
        toast.success("Menu salvo");
        setOpen(false);
      } catch {
        toast.error("Erro ao salvar menu");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="kn-btn-primary gap-2" onClick={() => openEdit()}><Plus className="h-4 w-4" />Novo menu</Button>
      </div>
      <div className="kn-table-wrap">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Ordem</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Ícone</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Visível</TableHead>
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
                  <TableCell>{item.icon}</TableCell>
                  <TableCell>{item.groupLabel}</TableCell>
                  <TableCell><Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "Sim" : "Não"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Novo"} item de menu</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>URL</Label>
                <Input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/pagina" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ícone</Label>
                <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Grupo</Label>
              <Input value={form.groupLabel} onChange={(e) => setForm({ ...form, groupLabel: e.target.value })} />
            </div>
            <Button onClick={save} disabled={pending} className="kn-btn-primary">{pending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClassificationsTab({ items }: { items: Classification[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Classification | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ClassificationInput>({ type: "expense_category", name: "", color: "#1e3a5f", sortOrder: 0 });

  const openEdit = (item?: Classification) => {
    if (item) {
      setEdit(item);
      setForm({ type: item.type, name: item.name, color: item.color ?? "#1e3a5f", sortOrder: item.sortOrder ?? 0 });
    } else {
      setEdit(null);
      setForm({ type: "expense_category", name: "", color: "#1e3a5f", sortOrder: items.length + 1 });
    }
    setOpen(true);
  };

  const save = () => {
    startTransition(async () => {
      try {
        if (edit) await updateClassification(edit.id, form);
        else await createClassification(form);
        toast.success("Classificação salva");
        setOpen(false);
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const grouped = CLASSIFICATION_TYPES.map((t) => ({
    ...t,
    items: items.filter((c) => c.type === t.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="kn-btn-primary gap-2" onClick={() => openEdit()}><Plus className="h-4 w-4" />Nova classificação</Button>
      </div>
      {grouped.map((group) => (
        <div key={group.value} className="kn-card overflow-hidden">
          <div className="kn-card-header text-sm font-semibold">{group.label}</div>
          <div className="p-4 flex flex-wrap gap-2">
            {group.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cadastrada.</p>
            ) : (
              group.items.map((item) => (
                <div key={item.id} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color ?? "#1e3a5f" }} />
                  <span className="text-sm font-medium">{item.name}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(item)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={pending} onClick={() => {
                    if (!confirm("Excluir?")) return;
                    startTransition(async () => { await deleteClassification(item.id); toast.success("Excluído"); });
                  }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Nova"} classificação</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASSIFICATION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cor</Label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Ordem</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <Button onClick={save} disabled={pending} className="kn-btn-primary">{pending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectsTab({ items }: { items: Project[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Project | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ProjectInput>({
    name: "", slug: "", description: "", status: "Ativo", color: "#1e3a5f", notes: "",
  });

  const openEdit = (item?: Project) => {
    if (item) {
      setEdit(item);
      setForm({
        name: item.name,
        slug: item.slug,
        description: item.description ?? "",
        status: item.status ?? "Ativo",
        color: item.color ?? "#1e3a5f",
        notes: item.notes ?? "",
      });
    } else {
      setEdit(null);
      setForm({ name: "", slug: "", description: "", status: "Ativo", color: "#1e3a5f", notes: "" });
    }
    setOpen(true);
  };

  const save = () => {
    startTransition(async () => {
      try {
        if (edit) await updateProject(edit.id, form);
        else await createProject(form);
        toast.success("Projeto salvo");
        setOpen(false);
      } catch {
        toast.error("Erro ao salvar projeto");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="kn-btn-primary gap-2" onClick={() => openEdit()}><Plus className="h-4 w-4" />Novo projeto</Button>
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
                  {item.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.slug}</TableCell>
                <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Novo"} projeto</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="meu-projeto" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Cor</Label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <Button onClick={save} disabled={pending} className="kn-btn-primary">{pending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
