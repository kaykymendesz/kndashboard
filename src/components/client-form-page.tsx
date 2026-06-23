"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Users } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  createClient,
  deleteClient,
  updateClient,
  type ClientInput,
} from "@/lib/actions/clients";
import type { Client } from "@/lib/db/schema";

const emptyForm: ClientInput = {
  name: "",
  company: "",
  email: "",
  phone: "",
  project: "",
  status: "Ativo",
  contractValue: "",
  notes: "",
};

function toForm(client: Client): ClientInput {
  return {
    name: client.name,
    company: client.company ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    project: client.project ?? "",
    status: client.status ?? "Ativo",
    contractValue: String(client.contractValue ?? ""),
    notes: client.notes ?? "",
  };
}

type Props = {
  client?: Client;
  returnTo?: string;
};

export function ClientFormPage({ client, returnTo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ClientInput>(client ? toForm(client) : emptyForm);
  const isEdit = !!client;

  const set = (key: keyof ClientInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const backHref = returnTo ?? (isEdit ? "/clientes" : "/clientes");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateClient(client.id, form);
          toast.success("Cliente atualizado");
          router.push(returnTo ?? `/atendimento/clientes/${client.slug}`);
          router.refresh();
        } else {
          await createClient(form);
          toast.success("Cliente criado");
          router.push(returnTo ?? "/clientes");
          router.refresh();
        }
      } catch {
        toast.error("Erro ao salvar cliente");
      }
    });
  };

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = () => {
    if (!client) return;
    startTransition(async () => {
      try {
        await deleteClient(client.id);
        toast.success("Cliente excluído");
        router.push("/clientes");
        router.refresh();
      } catch {
        toast.error("Erro ao excluir — verifique se há demandas ou gastos vinculados");
      }
    });
  };

  return (
    <div className="kn-page max-w-2xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <PageHeader
        title={isEdit ? `Editar — ${client.name}` : "Novo cliente"}
        description="Cadastro completo do cliente — dados comerciais, contato e contrato."
        icon={Users}
      />

      <form onSubmit={onSubmit}>
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Empresa</Label>
                <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Projeto</Label>
                <Input value={form.project} onChange={(e) => set("project", e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Ativo", "Prospecto", "Inativo", "Concluído"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Valor do contrato (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.contractValue}
                  onChange={(e) => set("contractValue", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={pending} className="kn-btn-primary">
                {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar cliente"}
              </Button>
              {isEdit && client.slug && (
                <Button type="button" variant="outline" asChild>
                  <Link href={`/atendimento/clientes/${client.slug}`}>Ver atendimento</Link>
                </Button>
              )}
              {isEdit && (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2 ml-auto"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                  <ConfirmDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title="Excluir cliente?"
                    description={
                      <>
                        {client.name} será removido permanentemente. Demandas e cotações vinculadas também serão excluídas.
                      </>
                    }
                    confirmLabel="Excluir"
                    destructive
                    onConfirm={handleDelete}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
