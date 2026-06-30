import { formatCurrency, formatDate } from "@/lib/format";
import {
  DEFAULT_LAYOUT_CONFIG,
  mergeLayoutWithForm,
  parseLayoutConfig,
  type ProposalLayoutConfig,
} from "@/lib/proposals/layout-config";
import type { ProposalDocumentData } from "@/lib/proposals/types";
import { KnLogoMark } from "./kn-logo-mark";
import "./proposal-document.css";

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.4 4.8 6.2 6.2l2.1-2.1c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b" aria-hidden>
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z" />
    </svg>
  );
}

function ProposalPageShell({
  data,
  layout: layoutProp,
  children,
  pageNumber = 1,
  totalPages = 1,
}: {
  data: ProposalDocumentData;
  layout?: ProposalLayoutConfig;
  children: React.ReactNode;
  pageNumber?: number;
  totalPages?: number;
}) {
  const layout = mergeLayoutWithForm(layoutProp ?? DEFAULT_LAYOUT_CONFIG, data.city);
  const c1 = layout.contact1 ?? DEFAULT_LAYOUT_CONFIG.contact1!;
  const c2 = layout.contact2 ?? DEFAULT_LAYOUT_CONFIG.contact2!;
  const style = {
    ["--kn-purple" as string]: layout.colors?.purple ?? "#8e2de2",
    ["--kn-blue" as string]: layout.colors?.blue ?? "#4a00e0",
    ["--kn-body-padding" as string]: `${layout.bodyPaddingMm ?? 24}mm`,
  } as React.CSSProperties;

  return (
    <article className="kn-proposal-page" style={style}>
      <div className="kn-proposal-frame" />
      <div className="kn-proposal-corner-tr">
        <div className="fold-a" />
        <div className="fold-b" />
        <div className="fold-c" />
      </div>
      <div className="kn-proposal-corner-tl" />
      <div className="kn-proposal-corner-bl" />
      <div className="kn-proposal-corner-br" />
      <div className="kn-proposal-bar-left" />
      <div className="kn-proposal-bar-right" />

      <header className="kn-proposal-header">
        <div className="kn-proposal-logo">
          <KnLogoMark width={132} />
          <div className="kn-proposal-logo-text">{layout.subtitle ?? "Tecnologia"}</div>
        </div>
        <div className="kn-proposal-title-block">
          <h1>
            <span className="line-black">{layout.titleLine1 ?? "Proposta"}</span>
            <span className="line-gradient">{layout.titleLine2 ?? "Comercial"}</span>
          </h1>
          <div className="kn-proposal-title-underline">
            <span className="line" />
            <span className="dot" />
          </div>
        </div>
      </header>

      <div className="kn-proposal-body">{children}</div>

      <footer className="kn-proposal-footer-wrap">
        <div className="kn-proposal-contacts-label">Contatos</div>
        <div className="kn-proposal-contacts-box">
          <div className="mini-logo" aria-hidden>
            <KnLogoMark width={44} />
          </div>
          <div className="kn-proposal-contact">
            <div className="kn-proposal-contact-avatar">
              <PersonIcon />
            </div>
            <div>
              <strong>{c1.name}</strong>
              <span className="role">{c1.role}</span>
              <div className="phone">
                <PhoneIcon /> {c1.phone}
              </div>
              <span className="badge">Contato</span>
            </div>
          </div>
          <div className="kn-proposal-contact">
            <div className="kn-proposal-contact-avatar">
              <PersonIcon />
            </div>
            <div>
              <strong>{c2.name}</strong>
              <span className="role">{c2.role}</span>
              <div className="phone">
                <PhoneIcon /> {c2.phone}
              </div>
              <span className="badge">Contato</span>
            </div>
          </div>
          <div className="kn-proposal-location">
            <div className="kn-proposal-location-icon">
              <PinIcon />
            </div>
            {layout.city}
          </div>
        </div>
        <p className="kn-proposal-legal">{(layout.legalName ?? DEFAULT_LAYOUT_CONFIG.legalName!).toUpperCase()}</p>
      </footer>

      {layout.showPageNumber !== false && (
        <div className="kn-proposal-page-number">
          {pageNumber} / {totalPages}
        </div>
      )}
    </article>
  );
}

export function ProposalDocument({
  data,
  layoutJson,
}: {
  data: ProposalDocumentData;
  layoutJson?: string | null;
}) {
  const layout = parseLayoutConfig(layoutJson);
  const hasValues =
    data.devValue > 0 ||
    data.monthlyValue > 0 ||
    data.domainValue > 0 ||
    data.hostingValue > 0 ||
    data.sslValue > 0 ||
    data.additionalValue > 0;

  return (
    <ProposalPageShell
      data={data}
      layout={layout}
      pageNumber={data.pageNumber ?? 1}
      totalPages={data.totalPages ?? 1}
    >
      <dl className="kn-proposal-meta">
        <div>
          <dt>Proposta Nº</dt>
          <dd>{data.proposalNumber || "—"}</dd>
        </div>
        <div>
          <dt>Emissão</dt>
          <dd>{data.issuedAt ? formatDate(data.issuedAt) : "—"}</dd>
        </div>
        <div>
          <dt>Validade</dt>
          <dd>{data.validUntil ? formatDate(data.validUntil) : "—"}</dd>
        </div>
        <div>
          <dt>Cliente</dt>
          <dd>{data.clientName || data.clientCompany || "—"}</dd>
        </div>
        {data.clientCompany && data.clientName && (
          <div>
            <dt>Empresa</dt>
            <dd>{data.clientCompany}</dd>
          </div>
        )}
        {data.clientDocument && (
          <div>
            <dt>CNPJ / CPF</dt>
            <dd>{data.clientDocument}</dd>
          </div>
        )}
        {data.clientResponsible && (
          <div>
            <dt>Responsável</dt>
            <dd>{data.clientResponsible}</dd>
          </div>
        )}
        {(data.clientEmail || data.clientPhone) && (
          <div>
            <dt>Contato</dt>
            <dd>
              {[data.clientEmail, data.clientPhone].filter(Boolean).join(" • ")}
            </dd>
          </div>
        )}
      </dl>

      {data.projectName && (
        <section className="kn-proposal-section">
          <h2>Projeto — {data.projectName}</h2>
          {(data.serviceType || data.category) && (
            <p>
              <strong>Tipo:</strong> {[data.serviceType, data.category].filter(Boolean).join(" • ")}
            </p>
          )}
          {data.projectObjective && <p>{data.projectObjective}</p>}
        </section>
      )}

      {data.description && (
        <section className="kn-proposal-section">
          <h2>Descrição</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{data.description}</p>
        </section>
      )}

      {(data.services.length > 0 || data.includedItems) && (
        <section className="kn-proposal-section">
          <h2>Itens inclusos</h2>
          {data.services.length > 0 && (
            <div className="kn-proposal-services">
              {data.services.map((s) => (
                <span key={s.id} className="kn-proposal-service-tag">
                  {s.name}
                </span>
              ))}
            </div>
          )}
          {data.includedItems && (
            <p style={{ whiteSpace: "pre-wrap", marginTop: "3mm" }}>{data.includedItems}</p>
          )}
        </section>
      )}

      {hasValues && (
        <section className="kn-proposal-section">
          <h2>Investimento</h2>
          <table className="kn-proposal-values">
            <thead>
              <tr>
                <th>Item</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.devValue > 0 && (
                <tr>
                  <td>Desenvolvimento</td>
                  <td>{formatCurrency(data.devValue)}</td>
                </tr>
              )}
              {data.monthlyValue > 0 && (
                <tr>
                  <td>Mensalidade</td>
                  <td>{formatCurrency(data.monthlyValue)}</td>
                </tr>
              )}
              {data.domainValue > 0 && (
                <tr>
                  <td>Domínio</td>
                  <td>{formatCurrency(data.domainValue)}</td>
                </tr>
              )}
              {data.hostingValue > 0 && (
                <tr>
                  <td>Hospedagem</td>
                  <td>{formatCurrency(data.hostingValue)}</td>
                </tr>
              )}
              {data.sslValue > 0 && (
                <tr>
                  <td>SSL</td>
                  <td>{formatCurrency(data.sslValue)}</td>
                </tr>
              )}
              {data.additionalValue > 0 && (
                <tr>
                  <td>Serviços adicionais</td>
                  <td>{formatCurrency(data.additionalValue)}</td>
                </tr>
              )}
              {data.discountValue > 0 && (
                <tr>
                  <td>Desconto</td>
                  <td>- {formatCurrency(data.discountValue)}</td>
                </tr>
              )}
              <tr className="total">
                <td>Total</td>
                <td>{formatCurrency(data.totalValue)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {(data.paymentMethods.length > 0 || data.installments > 1 || data.paymentNotes) && (
        <section className="kn-proposal-section">
          <h2>Condições de pagamento</h2>
          {data.paymentMethods.length > 0 && (
            <p>
              <strong>Formas:</strong> {data.paymentMethods.join(", ")}
            </p>
          )}
          {data.downPayment > 0 && (
            <p>
              <strong>Entrada:</strong> {formatCurrency(data.downPayment)}
            </p>
          )}
          {data.installments > 1 && (
            <p>
              <strong>Parcelamento:</strong> {data.installments}x de{" "}
              {formatCurrency(data.installmentValue)}
            </p>
          )}
          {data.paymentNotes && <p style={{ whiteSpace: "pre-wrap" }}>{data.paymentNotes}</p>}
        </section>
      )}

      {data.guarantees.length > 0 && (
        <section className="kn-proposal-section">
          <h2>Garantias</h2>
          <ul>
            {data.guarantees.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      {(data.deliveryDeadline || data.observations) && (
        <section className="kn-proposal-section">
          <h2>Prazo e observações</h2>
          {data.deliveryDeadline && (
            <p>
              <strong>Prazo de entrega:</strong> {data.deliveryDeadline}
            </p>
          )}
          {data.observations && <p style={{ whiteSpace: "pre-wrap" }}>{data.observations}</p>}
        </section>
      )}
    </ProposalPageShell>
  );
}
