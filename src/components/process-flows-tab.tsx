"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProcessFlow,
  updateProcessFlow,
  deleteProcessFlow,
  createProcessStep,
  updateProcessStep,
  deleteProcessStep,
  type ProcessFlowInput,
  type ProcessStepInput,
} from "@/lib/actions/process-flows";
import type { ProcessFlow, ProcessStep } from "@/lib/db/schema";

type FlowWithSteps = { flow: ProcessFlow; steps: ProcessStep[] };

export function ProcessFlowsTab({
  flowsWithSteps,
  categoryOptions,
}: {
  flowsWithSteps: FlowWithSteps[];
  categoryOptions: string[];
}) {
  const [expanded, setExpanded] = useState<number | null>(flowsWithSteps[0]?.flow.id ?? null);
  const [flowDialog, setFlowDialog] = useState(false);
  const [stepDialog, setStepDialog] = useState(false);
  const [editFlow, setEditFlow] = useState<ProcessFlow | null>(null);
  const [editStep, setEditStep] = useState<ProcessStep | null>(null);
  const [activeFlowId, setActiveFlowId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const [flowForm, setFlowForm] = useState<ProcessFlowInput>({ name: "", description: "", isDefault: false, sortOrder: 0 });
  const [stepForm, setStepForm] = useState<ProcessStepInput>({ flowId: 0, name: "", category: "", description: "", sortOrder: 0 });

  const openFlowEdit = (flow?: ProcessFlow) => {
    if (flow) {
      setEditFlow(flow);
      setFlowForm({ name: flow.name, description: flow.description ?? "", isDefault: flow.isDefault ?? false, sortOrder: flow.sortOrder ?? 0 });
    } else {
      setEditFlow(null);
      setFlowForm({ name: "", description: "", isDefault: false, sortOrder: flowsWithSteps.length + 1 });
    }
    setFlowDialog(true);
  };

  const openStepEdit = (flowId: number, step?: ProcessStep) => {
    setActiveFlowId(flowId);
    if (step) {
      setEditStep(step);
      setStepForm({ flowId, name: step.name, category: step.category ?? "", description: step.description ?? "", sortOrder: step.sortOrder ?? 0 });
    } else {
      setEditStep(null);
      const flow = flowsWithSteps.find((f) => f.flow.id === flowId);
      setStepForm({ flowId, name: "", category: categoryOptions[0] ?? "", description: "", sortOrder: (flow?.steps.length ?? 0) + 1 });
    }
    setStepDialog(true);
  };

  const saveFlow = () => {
    startTransition(async () => {
      try {
        if (editFlow) await updateProcessFlow(editFlow.id, flowForm);
        else await createProcessFlow(flowForm);
        toast.success("Fluxo salvo");
        setFlowDialog(false);
      } catch {
        toast.error("Erro ao salvar fluxo");
      }
    });
  };

  const saveStep = () => {
    startTransition(async () => {
      try {
        if (editStep) await updateProcessStep(editStep.id, stepForm);
        else await createProcessStep(stepForm);
        toast.success("Etapa salva");
        setStepDialog(false);
      } catch {
        toast.error("Erro ao salvar etapa");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Configure o fluxo de processos aplicado aos itens do cronograma.</p>
        <Button className="kn-btn-primary gap-2" onClick={() => openFlowEdit()}><Plus className="h-4 w-4" />Novo fluxo</Button>
      </div>

      {flowsWithSteps.map(({ flow, steps }) => (
        <Card key={flow.id} className="kn-card overflow-hidden">
          <CardHeader className="kn-card-header py-3 flex flex-row items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === flow.id ? null : flow.id)}>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">{flow.name}</CardTitle>
              {flow.isDefault && <Badge variant="secondary">Padrão</Badge>}
              <span className="text-xs text-muted-foreground">{steps.length} etapas</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openFlowEdit(flow); }}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" disabled={pending} onClick={(e) => {
                e.stopPropagation();
                if (!confirm("Excluir fluxo?")) return;
                startTransition(async () => { await deleteProcessFlow(flow.id); toast.success("Excluído"); });
              }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              {expanded === flow.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expanded === flow.id && (
            <CardContent className="p-0">
              {flow.description && <p className="px-6 py-3 text-sm text-muted-foreground border-b">{flow.description}</p>}
              <div className="divide-y divide-border/50">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex items-center justify-between px-6 py-3 kn-row-hover">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                      <div>
                        <p className="font-medium text-sm">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.category}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openStepEdit(flow.id, step)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" disabled={pending} onClick={() => {
                        if (!confirm("Excluir etapa?")) return;
                        startTransition(async () => { await deleteProcessStep(step.id); toast.success("Excluído"); });
                      }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openStepEdit(flow.id)}>
                  <Plus className="h-3.5 w-3.5" />Adicionar etapa
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <Dialog open={flowDialog} onOpenChange={setFlowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editFlow ? "Editar" : "Novo"} fluxo</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Nome</Label><Input value={flowForm.name} onChange={(e) => setFlowForm({ ...flowForm, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Descrição</Label><Input value={flowForm.description} onChange={(e) => setFlowForm({ ...flowForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Ordem</Label><Input type="number" value={flowForm.sortOrder} onChange={(e) => setFlowForm({ ...flowForm, sortOrder: Number(e.target.value) })} /></div>
              <div className="flex items-end gap-2 pb-1">
                <input type="checkbox" id="isDefault" checked={flowForm.isDefault} onChange={(e) => setFlowForm({ ...flowForm, isDefault: e.target.checked })} />
                <Label htmlFor="isDefault">Fluxo padrão</Label>
              </div>
            </div>
            <Button onClick={saveFlow} disabled={pending} className="kn-btn-primary">Salvar fluxo</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={stepDialog} onOpenChange={setStepDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editStep ? "Editar" : "Nova"} etapa do processo</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Nome</Label><Input value={stepForm.name} onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })} /></div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={stepForm.category} onValueChange={(v) => setStepForm({ ...stepForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Descrição</Label><Input value={stepForm.description} onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Ordem</Label><Input type="number" value={stepForm.sortOrder} onChange={(e) => setStepForm({ ...stepForm, sortOrder: Number(e.target.value) })} /></div>
            <Button onClick={saveStep} disabled={pending} className="kn-btn-primary">Salvar etapa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
