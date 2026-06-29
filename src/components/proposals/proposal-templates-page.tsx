"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createProposalTemplate,
  deleteProposalTemplate,
  setDefaultTemplate,
} from "@/lib/actions/proposal-catalog";
import { formatDate } from "@/lib/format";
import type { ProposalTemplate } from "@/lib/db/schema";

export function ProposalTemplatesPage({ templates }: { templates: ProposalTemplate[] }) {
  const [pending, startTransition] = useTransition();

  const handleCreate = () => {
    const name = prompt("Nome do novo modelo:");
    if (!name?.trim()) return;
    startTransition(async () => {
      await createProposalTemplate({ name: name.trim() });
      toast.success("Modelo criado");
    });
  };

  return (
    <div className="kn-page">
      <Link href="/propostas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar às propostas
      </Link>

      <PageHeader
        title="Biblioteca de modelos"
        description="Templates reutilizáveis para propostas, contratos, orçamentos e outros documentos K&N."
        icon={Layers}
      >
        <Button className="kn-btn-primary gap-2" onClick={handleCreate} disabled={pending}>
          Novo modelo
        </Button>
      </PageHeader>

      <div className="grid gap-3 mt-4">
        {templates.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{t.name}</p>
                {t.isDefault && <Badge>Padrão</Badge>}
                <Badge variant="outline">{t.templateType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado em {formatDate(t.updatedAt)} · slug: {t.slug}
              </p>
            </div>
            <div className="flex gap-2">
              {!t.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await setDefaultTemplate(t.id);
                      toast.success("Modelo definido como padrão");
                    })
                  }
                >
                  <Star className="h-3.5 w-3.5" /> Padrão
                </Button>
              )}
              {!t.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Excluir modelo?")) return;
                    startTransition(async () => {
                      await deleteProposalTemplate(t.id);
                      toast.success("Modelo excluído");
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
