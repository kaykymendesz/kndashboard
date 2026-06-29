"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ProposalDocument } from "@/components/proposals/proposal-document";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalLayoutEditor } from "@/components/proposals/proposal-layout-editor";
import { ProposalHistoryPanel } from "@/components/proposals/proposal-history-panel";
import { saveProposalAsTemplate } from "@/lib/actions/proposal-catalog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProposal,
  updateProposal,
  deleteProposal,
  convertProposalToProject,
  logProposalExport,
} from "@/lib/actions/proposals";
import { applyProposalCalculations } from "@/lib/proposals/calculations";
import { formToDocumentData, proposalToForm } from "@/lib/proposals/mapper";
import { DEFAULT_PROPOSAL_FORM, type ProposalFormData } from "@/lib/proposals/types";
import {
  PROPOSAL_PAYMENT_METHODS,
  PROPOSAL_STATUSES,
  type Client,
  type CommercialProposal,
  type ProposalGuaranteeCatalog,
  type ProposalServiceCatalog,
  type ProposalExport,
  type ProposalVersion,
} from "@/lib/db/schema";
import { formatCurrency } from "@/lib/format";

export function ProposalFormPage({
  proposal,
  clients,
  services,
  guarantees,
  versions = [],
  exportRows = [],
}: {
  proposal?: CommercialProposal;
  clients: Client[];
  services: ProposalServiceCatalog[];
  guarantees: ProposalGuaranteeCatalog[];
  versions?: ProposalVersion[];
  exportRows?: ProposalExport[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<ProposalFormData>(
    proposal ? proposalToForm(proposal) : DEFAULT_PROPOSAL_FORM
  );

  const set = <K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) =>
    setForm((f) => applyProposalCalculations({ ...f, [key]: value }));

  useEffect(() => {
    setForm((f) => applyProposalCalculations(f));
  }, []);

  const previewData = useMemo(
    () =>
      formToDocumentData(
        applyProposalCalculations(form),
        proposal?.proposalNumber ?? "KN-XXXX-0000"
      ),
    [form, proposal?.proposalNumber]
  );

  const toggleService = (service: ProposalServiceCatalog, checked: boolean) => {
    setForm((f) => {
      const list = [...f.selectedServices];
      if (checked) {
        if (!list.some((s) => s.id === service.id)) {
          list.push({
            id: service.id,
            name: service.name,
            category: service.category ?? undefined,
            description: service.description ?? undefined,
          });
        }
      } else {
        const idx = list.findIndex((s) => s.id === service.id);
        if (idx >= 0) list.splice(idx, 1);
      }
      const included = list.map((s) => `• ${s.name}`).join("\n");
      return applyProposalCalculations({ ...f, selectedServices: list, includedItems: included });
    });
  };

  const toggleGuarantee = (name: string, checked: boolean) => {
    setForm((f) => {
      const list = [...f.selectedGuarantees];
      if (checked && !list.includes(name)) list.push(name);
      if (!checked) {
        const idx = list.indexOf(name);
        if (idx >= 0) list.splice(idx, 1);
      }
      return { ...f, selectedGuarantees: list };
    });
  };

  const togglePaymentMethod = (method: string, checked: boolean) => {
    setForm((f) => {
      const methods = [...f.paymentMethods];
      if (checked && !methods.includes(method)) methods.push(method);
      if (!checked) {
        const idx = methods.indexOf(method);
        if (idx >= 0) methods.splice(idx, 1);
      }
      return applyProposalCalculations({ ...f, paymentMethods: methods });
    });
  };

  const fillClient = (clientId: string) => {
    const client = clients.find((c) => c.id === Number(clientId));
    if (!client) return;
    setForm((f) =>
      applyProposalCalculations({
        ...f,
        clientId: client.id,
        clientName: client.name,
        clientCompany: client.company ?? "",
        clientEmail: client.email ?? "",
        clientPhone: client.phone ?? "",
      })
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (proposal) {
          await updateProposal(proposal.id, form);
          toast.success("Proposta atualizada");
          router.refresh();
        } else {
          const created = await createProposal(form);
          toast.success("Proposta criada");
          router.push(`/propostas/${created.id}`);
        }
      } catch {
        toast.error("Erro ao salvar proposta");
      }
    });
  };

  const handleDelete = () => {
    if (!proposal || !confirm("Excluir esta proposta?")) return;
    startTransition(async () => {
      await deleteProposal(proposal.id);
      toast.success("Proposta excluída");
      router.push("/propostas");
    });
  };

  const handleConvert = () => {
    if (!proposal || !confirm("Converter proposta em projeto? Cliente, financeiro, cronograma e tarefas serão criados.")) return;
    startTransition(async () => {
      try {
        const result = await convertProposalToProject(proposal.id);
        toast.success(
          result.alreadyExists
            ? "Projeto já vinculado"
            : "Projeto criado com sucesso"
        );
        if (result.projectSlug) router.push(`/projetos/${result.projectSlug}`);
        else router.refresh();
      } catch {
        toast.error("Erro ao converter em projeto");
      }
    });
  };

  const handlePrint = () => {
    if (proposal) logProposalExport(proposal.id, "pdf");
    window.open(proposal ? `/propostas/${proposal.id}/imprimir` : "#", "_blank");
  };

  const handleDocx = () => {
    if (!proposal) return;
    startTransition(async () => {
      await logProposalExport(proposal.id, "docx");
      window.location.href = `/api/propostas/${proposal.id}/docx`;
    });
  };

  const handleSaveAsTemplate = () => {
    if (!proposal) return;
    const name = prompt("Nome do modelo:");
    if (!name?.trim()) return;
    startTransition(async () => {
      await saveProposalAsTemplate(proposal.id, name.trim(), form.customLayout);
      toast.success("Modelo salvo na biblioteca");
    });
  };

  return (
    <div className="kn-page">
      <Link
        href="/propostas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar às propostas
      </Link>

      <PageHeader
        title={proposal ? `Proposta ${proposal.proposalNumber}` : "Nova proposta comercial"}
        description="Cadastro com pré-visualização em tempo real — layout oficial K&N."
        icon={FileText}
      >
        <div className="flex flex-wrap gap-2">
          {proposal && (
            <>
              <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> PDF
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={handleDocx} disabled={pending}>
                <Download className="h-4 w-4" /> Word
              </Button>
              {proposal.status === "Aprovada" && !proposal.projectId && (
                <Button type="button" className="kn-btn-primary gap-2" onClick={handleConvert} disabled={pending}>
                  <CheckCircle2 className="h-4 w-4" /> Converter em projeto
                </Button>
              )}
              <Button type="button" variant="outline" className="gap-2" onClick={handleSaveAsTemplate} disabled={pending}>
                <Layers className="h-4 w-4" /> Salvar como modelo
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs defaultValue="dados">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              {proposal && <TabsTrigger value="historico">Histórico</TabsTrigger>}
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
          <Card className="kn-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dados do cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <Label>Cliente existente</Label>
                <Select onValueChange={fillClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Importar de cadastro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Cliente *</Label>
                  <Input required value={form.clientName} onChange={(e) => set("clientName", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Empresa</Label>
                  <Input value={form.clientCompany} onChange={(e) => set("clientCompany", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>CNPJ / CPF</Label>
                  <Input value={form.clientDocument} onChange={(e) => set("clientDocument", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Responsável</Label>
                  <Input value={form.clientResponsible} onChange={(e) => set("clientResponsible", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={form.clientPhone} onChange={(e) => set("clientPhone", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="kn-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dados do projeto</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <Label>Nome do projeto *</Label>
                <Input required value={form.projectName} onChange={(e) => set("projectName", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Tipo de serviço</Label>
                  <Input value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Objetivo do projeto</Label>
                <Textarea rows={3} value={form.projectObjective} onChange={(e) => set("projectObjective", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="kn-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Biblioteca de serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {services.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.selectedServices.some((x) => x.id === s.id)}
                      onCheckedChange={(v) => toggleService(s, v === true)}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="kn-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Valores</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {(
                [
                  ["devValue", "Desenvolvimento"],
                  ["monthlyValue", "Mensalidade"],
                  ["domainValue", "Domínio"],
                  ["hostingValue", "Hospedagem"],
                  ["sslValue", "SSL"],
                  ["additionalValue", "Adicionais"],
                  ["discountValue", "Desconto"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="grid gap-2">
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
              <div className="col-span-2 rounded-lg bg-muted/50 p-3 flex justify-between items-center">
                <span className="font-medium">Total calculado</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(form.totalValue)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="kn-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pagamento e validade</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap gap-3">
                {PROPOSAL_PAYMENT_METHODS.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.paymentMethods.includes(m)}
                      onCheckedChange={(v) => togglePaymentMethod(m, v === true)}
                    />
                    {m}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="grid gap-2">
                  <Label>Parcelas</Label>
                  <Input type="number" min={1} value={form.installments} onChange={(e) => set("installments", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Entrada</Label>
                  <Input type="number" step="0.01" value={form.downPayment} onChange={(e) => set("downPayment", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Valor parcela</Label>
                  <Input readOnly value={form.installmentValue} className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label>Validade (dias)</Label>
                  <Input type="number" value={form.validityDays} onChange={(e) => set("validityDays", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Emissão</Label>
                  <Input type="date" value={form.issuedAt} onChange={(e) => set("issuedAt", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Válida até</Label>
                  <Input readOnly value={form.validUntil} className="bg-muted" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações de pagamento</Label>
                <Textarea rows={2} value={form.paymentNotes} onChange={(e) => set("paymentNotes", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="kn-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Garantias</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {guarantees.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.selectedGuarantees.includes(g.name)}
                    onCheckedChange={(v) => toggleGuarantee(g.name, v === true)}
                  />
                  {g.name}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="kn-card">
            <CardContent className="p-4 grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROPOSAL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prazo de entrega</Label>
                  <Input value={form.deliveryDeadline} onChange={(e) => set("deliveryDeadline", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Cidade (rodapé)</Label>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações gerais</Label>
                <Textarea rows={3} value={form.observations} onChange={(e) => set("observations", e.target.value)} />
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="layout" className="mt-4">
              <ProposalLayoutEditor
                value={form.customLayout}
                onChange={(json) => set("customLayout", json)}
              />
            </TabsContent>

            {proposal && (
              <TabsContent value="historico" className="mt-4">
                <ProposalHistoryPanel versions={versions} exports={exportRows} />
              </TabsContent>
            )}
          </Tabs>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="kn-btn-primary gap-2" disabled={pending}>
              <Save className="h-4 w-4" />
              {proposal ? "Salvar alterações" : "Criar proposta"}
            </Button>
            {proposal && (
              <Button type="button" variant="destructive" className="gap-2" onClick={handleDelete} disabled={pending}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            )}
          </div>
        </form>

        <div className="xl:sticky xl:top-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Pré-visualização</h3>
            <Badge variant="outline">Layout oficial K&N</Badge>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-slate-100 p-4">
            <div className="origin-top-left scale-[0.45] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.5] xl:scale-[0.55] 2xl:scale-[0.62]">
              <ProposalDocument data={previewData} layoutJson={form.customLayout} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
