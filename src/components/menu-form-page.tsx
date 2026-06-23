"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  type MenuItemInput,
} from "@/lib/actions/settings";
import { ICON_OPTIONS } from "@/lib/constants";
import type { MenuItem } from "@/lib/db/schema";

export function MenuFormPage({ item }: { item?: MenuItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<MenuItemInput>(
    item
      ? {
          label: item.label,
          href: item.href,
          icon: item.icon,
          groupLabel: item.groupLabel ?? "Navegação",
          sortOrder: item.sortOrder ?? 0,
          visible: item.visible ?? true,
        }
      : {
          label: "",
          href: "/",
          icon: "LayoutDashboard",
          groupLabel: "Navegação",
          sortOrder: 0,
          visible: true,
        }
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (item) {
          await updateMenuItem(item.id, form);
          toast.success("Menu atualizado");
        } else {
          await createMenuItem(form);
          toast.success("Menu criado");
        }
        router.push("/configuracoes?tab=menus");
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    if (!item || !confirm("Excluir este menu?")) return;
    startTransition(async () => {
      await deleteMenuItem(item.id);
      toast.success("Menu excluído");
      router.push("/configuracoes?tab=menus");
    });
  };

  return (
    <div className="kn-page max-w-xl">
      <Link href="/configuracoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Configurações
      </Link>
      <PageHeader title={item ? "Editar menu" : "Novo menu"} icon={Menu} />
      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>URL</Label>
                <Input required value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
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
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" className="kn-btn-primary" disabled={pending}>Salvar</Button>
              {item && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>Excluir</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
