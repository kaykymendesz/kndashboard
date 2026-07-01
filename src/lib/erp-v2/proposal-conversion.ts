import type { CommercialProposal } from "@/lib/db/schema";
import type { ProposalFormData } from "@/lib/proposals/types";
import { calculateProposalTotal } from "@/lib/proposals/calculations";
import { proposalToForm } from "@/lib/proposals/mapper";
import { parseNumber } from "@/lib/format";
import type { CompositionLineInput } from "./composition";

export type CompositionLineDraft = CompositionLineInput & {
  label: string;
  catalogId?: number | null;
  companyCost?: number | null;
};

export function buildCompositionFromProposal(
  proposal: CommercialProposal | ProposalFormData
): {
  lines: CompositionLineDraft[];
  suggestedPrice: number;
  negotiatedPrice: number;
  discountAmount: number;
  discountPercent: number;
  discountReason: string;
} {
  const form: ProposalFormData =
    "proposalNumber" in proposal ? proposalToForm(proposal as CommercialProposal) : proposal;

  const lines: CompositionLineDraft[] = [];

  const add = (
    lineType: CompositionLineDraft["lineType"],
    label: string,
    value: number,
    catalogId?: number | null
  ) => {
    if (value <= 0) return;
    lines.push({ lineType, label, compositionValue: value, catalogId: catalogId ?? null });
  };

  const dev = parseNumber(form.devValue);
  const monthly = parseNumber(form.monthlyValue);
  const domain = parseNumber(form.domainValue);
  const hosting = parseNumber(form.hostingValue);
  const ssl = parseNumber(form.sslValue);
  const additional = parseNumber(form.additionalValue);

  if (form.selectedServices?.length && dev <= 0) {
    for (const svc of form.selectedServices) {
      add("mao_obra", `Mão de Obra — ${svc.name}`, 0);
    }
  }

  add("mao_obra", "Mão de Obra — Desenvolvimento", dev);
  add("infraestrutura", "Infraestrutura — Hospedagem", hosting);
  add("infraestrutura", "Infraestrutura — Domínio", domain);
  add("infraestrutura", "Infraestrutura — SSL", ssl);
  add("infraestrutura", "Infraestrutura — Mensalidade", monthly);
  add("custo_exclusivo", "Custos Exclusivos — Adicionais", additional);

  const suggestedPrice = calculateProposalTotal({
    ...form,
    discountValue: "0",
  });
  const negotiatedPrice = parseNumber(form.totalValue) || calculateProposalTotal(form);
  const discountAmount = Math.max(0, suggestedPrice - negotiatedPrice);
  const discountPercent = suggestedPrice > 0 ? (discountAmount / suggestedPrice) * 100 : 0;

  return {
    lines,
    suggestedPrice,
    negotiatedPrice,
    discountAmount,
    discountPercent,
    discountReason: form.observations?.trim() ? form.observations : "",
  };
}

export type InstallmentDraft = {
  description: string;
  amount: number;
  category: string;
  recurrence: string;
  sortOrder: number;
};

export function buildInstallmentsFromProposal(proposal: CommercialProposal): InstallmentDraft[] {
  const form = proposalToForm(proposal);
  const total = parseNumber(proposal.totalValue);
  const down = parseNumber(proposal.downPayment);
  const installments = proposal.installments ?? 1;
  const installmentValue = parseNumber(proposal.installmentValue);
  const monthly = parseNumber(proposal.monthlyValue);
  const items: InstallmentDraft[] = [];
  let order = 0;

  if (down > 0) {
    items.push({
      description: `Entrada — ${proposal.proposalNumber}`,
      amount: down,
      category: "Receita Contratada",
      recurrence: "Pagamento único",
      sortOrder: order++,
    });
  }

  if (installments > 1 && installmentValue > 0) {
    for (let i = 1; i <= installments; i++) {
      items.push({
        description: `Parcela ${i}/${installments} — ${proposal.proposalNumber}`,
        amount: installmentValue,
        category: "Receita Contratada",
        recurrence: "Pagamento único",
        sortOrder: order++,
      });
    }
  } else if (total > down) {
    items.push({
      description: `Projeto — ${proposal.proposalNumber}`,
      amount: total - down,
      category: "Receita Contratada",
      recurrence: "Pagamento único",
      sortOrder: order++,
    });
  }

  if (monthly > 0) {
    items.push({
      description: `Mensalidade — ${proposal.projectName}`,
      amount: monthly,
      category: "Mensalidade",
      recurrence: "Mensal",
      sortOrder: order++,
    });
  }

  return items;
}
