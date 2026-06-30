import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/db/env";
import { DEFAULT_LAYOUT_CONFIG } from "@/lib/proposals/layout-config";

const DEFAULT_SERVICES: [string, string, string][] = [
  ["Site Institucional", "Desenvolvimento", "Site corporativo responsivo"],
  ["Loja Virtual", "Desenvolvimento", "E-commerce completo"],
  ["Landing Page", "Desenvolvimento", "Página de conversão"],
  ["Sistema Web", "Desenvolvimento", "Sistema sob medida"],
  ["Aplicativo", "Desenvolvimento", "App mobile ou PWA"],
  ["Dashboard", "Desenvolvimento", "Painel administrativo"],
  ["Área do Cliente", "Desenvolvimento", "Portal do cliente"],
  ["Integração WhatsApp", "Integração", "API WhatsApp Business"],
  ["Integração Instagram", "Integração", "Feed e automações"],
  ["PIX", "Pagamento", "Gateway PIX"],
  ["Cartão", "Pagamento", "Pagamento com cartão"],
  ["Correios", "Integração", "Cálculo de frete"],
  ["SEO", "Marketing", "Otimização para buscadores"],
  ["Google Analytics", "Marketing", "Métricas e conversões"],
  ["Painel Administrativo", "Desenvolvimento", "Gestão de conteúdo"],
  ["Login Google", "Autenticação", "OAuth Google"],
  ["Login Facebook", "Autenticação", "OAuth Facebook"],
  ["Firebase", "Infraestrutura", "Backend Firebase"],
  ["Banco de Dados", "Infraestrutura", "PostgreSQL / Firestore"],
  ["API", "Desenvolvimento", "API REST ou GraphQL"],
  ["Segurança", "Infraestrutura", "Hardening e boas práticas"],
  ["SSL", "Infraestrutura", "Certificado HTTPS"],
  ["Domínio", "Infraestrutura", "Registro de domínio"],
  ["Hospedagem", "Infraestrutura", "Hospedagem cloud"],
  ["Backup", "Infraestrutura", "Rotina de backup"],
  ["Responsividade", "Design", "Layout mobile-first"],
];

const DEFAULT_GUARANTEES = [
  "Suporte durante implantação",
  "Correção de bugs",
  "Ajustes técnicos",
  "Segurança",
  "Configuração do domínio",
  "Configuração de hospedagem",
  "Publicação",
  "Entrega pronta para uso",
];

let ensured = false;

export async function ensureProposalsSchema() {
  if (ensured) return;
  const sql = neon(getDatabaseUrl());

  await sql`CREATE TABLE IF NOT EXISTS proposal_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    template_type VARCHAR(50) DEFAULT 'proposta_comercial',
    layout_config TEXT DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS proposal_service_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    description TEXT DEFAULT '',
    default_value NUMERIC(12, 2),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS proposal_guarantee_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS commercial_proposals (
    id SERIAL PRIMARY KEY,
    proposal_number VARCHAR(30) NOT NULL UNIQUE,
    template_id INTEGER REFERENCES proposal_templates(id),
    status VARCHAR(50) DEFAULT 'Em elaboração',
    version INTEGER DEFAULT 1,
    client_id INTEGER REFERENCES clients(id),
    project_id INTEGER REFERENCES projects(id),
    client_name VARCHAR(200) DEFAULT '',
    client_company VARCHAR(200) DEFAULT '',
    client_document VARCHAR(50) DEFAULT '',
    client_responsible VARCHAR(200) DEFAULT '',
    client_email VARCHAR(200) DEFAULT '',
    client_phone VARCHAR(50) DEFAULT '',
    project_name VARCHAR(300) NOT NULL DEFAULT '',
    service_type VARCHAR(100) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    project_objective TEXT DEFAULT '',
    description TEXT DEFAULT '',
    included_items TEXT DEFAULT '',
    dev_value NUMERIC(12, 2) DEFAULT 0,
    monthly_value NUMERIC(12, 2) DEFAULT 0,
    domain_value NUMERIC(12, 2) DEFAULT 0,
    hosting_value NUMERIC(12, 2) DEFAULT 0,
    ssl_value NUMERIC(12, 2) DEFAULT 0,
    additional_value NUMERIC(12, 2) DEFAULT 0,
    discount_value NUMERIC(12, 2) DEFAULT 0,
    total_value NUMERIC(12, 2) DEFAULT 0,
    payment_methods TEXT DEFAULT '[]',
    installments INTEGER DEFAULT 1,
    down_payment NUMERIC(12, 2) DEFAULT 0,
    installment_value NUMERIC(12, 2) DEFAULT 0,
    payment_notes TEXT DEFAULT '',
    validity_days INTEGER DEFAULT 60,
    issued_at TIMESTAMP,
    valid_until TIMESTAMP,
    delivery_deadline VARCHAR(200) DEFAULT '',
    city VARCHAR(100) DEFAULT 'São Paulo - SP',
    observations TEXT DEFAULT '',
    selected_services TEXT DEFAULT '[]',
    selected_guarantees TEXT DEFAULT '[]',
    custom_layout TEXT DEFAULT '{}',
    created_by VARCHAR(200) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS proposal_versions (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES commercial_proposals(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot TEXT NOT NULL,
    change_note TEXT DEFAULT '',
    created_by VARCHAR(200) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS proposal_exports (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES commercial_proposals(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL,
    version_number INTEGER,
    created_by VARCHAR(200) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  const layoutJson = JSON.stringify(DEFAULT_LAYOUT_CONFIG);
  await sql`
    INSERT INTO proposal_templates (name, slug, template_type, layout_config, is_default)
    SELECT 'Proposta Comercial K&N', 'proposta-comercial', 'proposta_comercial', ${layoutJson}, true
    WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE slug = 'proposta-comercial')
  `;

  for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
    const [name, category, description] = DEFAULT_SERVICES[i];
    await sql`
      INSERT INTO proposal_service_catalog (name, category, description, sort_order)
      SELECT ${name}, ${category}, ${description}, ${i + 1}
      WHERE NOT EXISTS (SELECT 1 FROM proposal_service_catalog WHERE name = ${name})
    `;
  }

  for (let i = 0; i < DEFAULT_GUARANTEES.length; i++) {
    const name = DEFAULT_GUARANTEES[i];
    await sql`
      INSERT INTO proposal_guarantee_catalog (name, sort_order)
      SELECT ${name}, ${i + 1}
      WHERE NOT EXISTS (SELECT 1 FROM proposal_guarantee_catalog WHERE name = ${name})
    `;
  }

  await sql`
    INSERT INTO menu_items (label, href, icon, group_label, sort_order, visible)
    SELECT 'Propostas', '/propostas', 'FileText', 'Navegação', 3, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE href = '/propostas')
  `;

  ensured = true;
}

/** Para scripts de migração (sem cache em memória entre invocações). */
export async function runProposalsSchemaMigration() {
  ensured = false;
  await ensureProposalsSchema();
}
