"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createCatalogGuarantee,
  createCatalogService,
  deleteCatalogGuarantee,
  deleteCatalogService,
} from "@/lib/actions/proposal-catalog";
import type { ProposalGuaranteeCatalog, ProposalServiceCatalog } from "@/lib/db/schema";

export function ProposalCatalogPage({
  services,
  guarantees,
}: {
  services: ProposalServiceCatalog[];
  guarantees: ProposalGuaranteeCatalog[];
}) {
  const [pending, startTransition] = useTransition();
  const [serviceName, setServiceName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [guaranteeName, setGuaranteeName] = useState("");

  const addService = () => {
    if (!serviceName.trim()) return;
    startTransition(async () => {
      await createCatalogService({ name: serviceName, category: serviceCategory });
      setServiceName("");
      setServiceCategory("");
      toast.success("Serviço adicionado");
    });
  };

  const addGuarantee = () => {
    if (!guaranteeName.trim()) return;
    startTransition(async () => {
      await createCatalogGuarantee({ name: guaranteeName });
      setGuaranteeName("");
      toast.success("Garantia adicionada");
    });
  };

  return (
    <div className="kn-page">
      <Link href="/propostas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar às propostas
      </Link>

      <PageHeader
        title="Catálogo de propostas"
        description="Serviços e garantias reutilizáveis nas propostas comerciais."
        icon={BookOpen}
      />

      <Tabs defaultValue="services" className="mt-4">
        <TabsList>
          <TabsTrigger value="services">Serviços ({services.length})</TabsTrigger>
          <TabsTrigger value="guarantees">Garantias ({guarantees.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4 mt-4">
          <Card className="kn-card">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="grid gap-2 sm:col-span-2">
                <Label>Nome do serviço</Label>
                <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} />
              </div>
              <Button className="kn-btn-primary gap-2 sm:col-span-3 w-fit" onClick={addService} disabled={pending}>
                <Plus className="h-4 w-4" /> Adicionar serviço
              </Button>
            </CardContent>
          </Card>
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Excluir serviço?")) return;
                    startTransition(async () => {
                      await deleteCatalogService(s.id);
                      toast.success("Serviço removido");
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="guarantees" className="space-y-4 mt-4">
          <Card className="kn-card">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="grid gap-2 flex-1">
                <Label>Nome da garantia</Label>
                <Input value={guaranteeName} onChange={(e) => setGuaranteeName(e.target.value)} />
              </div>
              <Button className="kn-btn-primary gap-2 self-end" onClick={addGuarantee} disabled={pending}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </CardContent>
          </Card>
          <ul className="space-y-2">
            {guarantees.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <p className="font-medium text-sm">{g.name}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Excluir garantia?")) return;
                    startTransition(async () => {
                      await deleteCatalogGuarantee(g.id);
                      toast.success("Garantia removida");
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
