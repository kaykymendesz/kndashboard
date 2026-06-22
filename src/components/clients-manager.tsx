"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createClient,
  deleteClient,
  updateClient,
  type ClientInput,
} from "@/lib/actions/clients";
import { formatCurrency } from "@/lib/format";
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

function ClientForm({ initial, onDone }: { initial?: Client; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ClientInput>(
    initial
      ? {
          name: initial.name,
          company: initial.company ?? "",
          email: initial.email ?? "",
          phone: initial.phone ?? "",
          project: initial.project ?? "",
          status: initial.status ?? "Ativo",
          contractValue: String(initial.contractValue ?? ""),
          notes: initial.notes ?? "",
        }
      : emptyForm
  );

  const set = (key: keyof ClientInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          try {
            if (initial) await updateClient(initial.id, form);
            else await createClient(form);
            toast.success("Cliente salvo");
            onDone();
          } catch {
            toast.error("Erro ao salvar");
          }
        });
      }}
      className="grid gap-4"
    >
      <div className="grid gap-2">
        <Label>Nome *</Label>
        <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Empresa</Label>
          <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Projeto</Label>
          <Input value={form.project} onChange={(e) => set("project", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>E-mail</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
          <Input type="number" step="0.01" value={form.contractValue} onChange={(e) => set("contractValue", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}

export function ClientsManager({ items }: { items: Client[] }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Client | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">Cadastro de clientes e contratos</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editItem ? "Editar" : "Novo"} cliente</DialogTitle></DialogHeader>
            <ClientForm initial={editItem ?? undefined} onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum cliente cadastrado. Clique em &quot;Novo cliente&quot; para começar.
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.company}</TableCell>
                  <TableCell>{item.project}</TableCell>
                  <TableCell>
                    <div className="text-sm">{item.email}</div>
                    <div className="text-xs text-muted-foreground">{item.phone}</div>
                  </TableCell>
                  <TableCell>{item.contractValue ? formatCurrency(item.contractValue) : "—"}</TableCell>
                  <TableCell><Badge>{item.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditItem(item); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={pending} onClick={() => {
                      if (!confirm("Excluir cliente?")) return;
                      startTransition(async () => { await deleteClient(item.id); toast.success("Excluído"); });
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
