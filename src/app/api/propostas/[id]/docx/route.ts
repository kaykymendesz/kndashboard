import { notFound } from "next/navigation";
import { getProposalById } from "@/lib/actions/proposals";
import { proposalRowToDocument } from "@/lib/proposals/mapper";
import { formatCurrency, formatDate } from "@/lib/format";
import { COMPANY_LEGAL_NAME, COMPANY_CNPJ } from "@/lib/constants";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const proposalId = Number(id);
  if (!Number.isFinite(proposalId)) notFound();

  const proposal = await getProposalById(proposalId);
  if (!proposal) notFound();

  const data = proposalRowToDocument(proposal);

  const servicesHtml = data.services.map((s) => `<li>${escapeHtml(s.name)}</li>`).join("");
  const guaranteesHtml = data.guarantees.map((g) => `<li>${escapeHtml(g)}</li>`).join("");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<title>Proposta ${escapeHtml(data.proposalNumber)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1a1a2e; }
  h1 { color: #4a00e0; font-size: 18pt; }
  h2 { color: #8e2de2; font-size: 12pt; border-bottom: 1px solid #e2e8f0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  td, th { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
  th { text-align: left; color: #64748b; font-size: 9pt; text-transform: uppercase; }
  .total td { font-weight: bold; color: #4a00e0; font-size: 12pt; }
  .footer { margin-top: 24px; font-size: 9pt; color: #64748b; }
</style>
</head>
<body>
<h1>PROPOSTA COMERCIAL — ${escapeHtml(data.proposalNumber)}</h1>
<p><strong>Emissão:</strong> ${formatDate(data.issuedAt)} &nbsp;|&nbsp; <strong>Validade:</strong> ${formatDate(data.validUntil)}</p>
<p><strong>Cliente:</strong> ${escapeHtml(data.clientName || data.clientCompany || "—")}</p>
${data.clientCompany ? `<p><strong>Empresa:</strong> ${escapeHtml(data.clientCompany)}</p>` : ""}
${data.clientResponsible ? `<p><strong>Responsável:</strong> ${escapeHtml(data.clientResponsible)}</p>` : ""}

<h2>Projeto — ${escapeHtml(data.projectName)}</h2>
${data.projectObjective ? `<p>${escapeHtml(data.projectObjective)}</p>` : ""}
${data.description ? `<h2>Descrição</h2><p>${escapeHtml(data.description).replace(/\n/g, "<br>")}</p>` : ""}

${servicesHtml ? `<h2>Itens inclusos</h2><ul>${servicesHtml}</ul>` : ""}
${data.includedItems ? `<p>${escapeHtml(data.includedItems).replace(/\n/g, "<br>")}</p>` : ""}

<h2>Investimento</h2>
<table>
  <tr><th>Item</th><th>Valor</th></tr>
  ${data.devValue > 0 ? `<tr><td>Desenvolvimento</td><td>${formatCurrency(data.devValue)}</td></tr>` : ""}
  ${data.monthlyValue > 0 ? `<tr><td>Mensalidade</td><td>${formatCurrency(data.monthlyValue)}</td></tr>` : ""}
  ${data.domainValue > 0 ? `<tr><td>Domínio</td><td>${formatCurrency(data.domainValue)}</td></tr>` : ""}
  ${data.hostingValue > 0 ? `<tr><td>Hospedagem</td><td>${formatCurrency(data.hostingValue)}</td></tr>` : ""}
  ${data.sslValue > 0 ? `<tr><td>SSL</td><td>${formatCurrency(data.sslValue)}</td></tr>` : ""}
  ${data.additionalValue > 0 ? `<tr><td>Adicionais</td><td>${formatCurrency(data.additionalValue)}</td></tr>` : ""}
  ${data.discountValue > 0 ? `<tr><td>Desconto</td><td>- ${formatCurrency(data.discountValue)}</td></tr>` : ""}
  <tr class="total"><td>Total</td><td>${formatCurrency(data.totalValue)}</td></tr>
</table>

<h2>Condições de pagamento</h2>
<p><strong>Formas:</strong> ${escapeHtml(data.paymentMethods.join(", "))}</p>
${data.downPayment > 0 ? `<p><strong>Entrada:</strong> ${formatCurrency(data.downPayment)}</p>` : ""}
${data.installments > 1 ? `<p><strong>Parcelamento:</strong> ${data.installments}x de ${formatCurrency(data.installmentValue)}</p>` : ""}
${data.paymentNotes ? `<p>${escapeHtml(data.paymentNotes)}</p>` : ""}

${guaranteesHtml ? `<h2>Garantias</h2><ul>${guaranteesHtml}</ul>` : ""}
${data.deliveryDeadline ? `<p><strong>Prazo:</strong> ${escapeHtml(data.deliveryDeadline)}</p>` : ""}
${data.observations ? `<p><strong>Observações:</strong> ${escapeHtml(data.observations)}</p>` : ""}

<div class="footer">
  <p>Kayky Mendes — 11 99484-0027 | Elaine Anaya — 11 91369-3011</p>
  <p>${escapeHtml(data.city)}</p>
  <p>${escapeHtml(COMPANY_LEGAL_NAME.toUpperCase())}</p>
  <p>CNPJ ${escapeHtml(COMPANY_CNPJ)}</p>
</div>
</body>
</html>`;

  const filename = `proposta-${proposal.proposalNumber}.doc`;

  return new Response(html, {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
