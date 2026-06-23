"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Truck } from "lucide-react";
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
import { createVendor, deleteVendor, updateVendor, type VendorInput } from "@/lib/actions/vendors";
import type { Vendor } from "@/lib/db/schema";

const emptyForm: VendorInput = {
  name: "",
  category: "",
  email: "",
  phone: "",
  notes: "",
  status: "Ativo",
};

function toForm(vendor: Vendor): VendorInput {
  return {
    name: vendor.name,
    category: vendor.category ?? "",
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    notes: vendor.notes ?? "",
    status: vendor.status ?? "Ativo",
  };
}

export function VendorFormPage({ vendor }: { vendor?: Vendor }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<VendorInput>(vendor ? toForm(vendor) : emptyForm);

  const set = (key: keyof VendorInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (vendor) {
          await updateVendor(vendor.id, form);
          toast.success("Fornecedor atualizado");
        } else {
          await createVendor(form);
          toast.success("Fornecedor criado");
        }
        router.push("/fornecedores");
        router.refresh();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  };

  const handleDelete = () => {
    if (!vendor || !confirm("Excluir este fornecedor?")) return;
    startTransition(async () => {
      await deleteVendor(vendor.id);
      toast.success("Fornecedor excluído");
      router.push("/fornecedores");
    });
  };

  return (
    <div className="kn-page">
      <Link href="/fornecedores" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      <PageHeader
        title={vendor ? "Editar fornecedor" : "Novo fornecedor"}
        description="Cadastro usado nos gastos e consolidado no financeiro."
        icon={Truck}
      />

      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        <Card className="kn-card">
          <CardContent className="p-6 grid gap-4">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Ex: Cloud, Domínio" />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Ativo", "Inativo"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="kn-btn-primary" disabled={pending}>Salvar</Button>
          <Button type="button" variant="outline" asChild><Link href="/fornecedores">Cancelar</Link></Button>
          {vendor && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>Excluir</Button>
          )}
        </div>
      </form>
    </div>
  );
}
