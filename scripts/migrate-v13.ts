/**
 * ERP v2.0 — schema: catálogos, composição financeira, ledger unificado.
 */
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

const DEFAULT_INFRA = [
  { name: "Vercel", vendor: "Vercel", companyCost: "72.68", compositionValue: "120.00", periodicity: "Mensal" },
  { name: "Firebase", vendor: "Google", companyCost: "0", compositionValue: "80.00", periodicity: "Mensal" },
  { name: "Cloudinary", vendor: "Cloudinary", companyCost: "0", compositionValue: "60.00", periodicity: "Mensal" },
  { name: "API WhatsApp", vendor: "Meta", companyCost: "68.60", compositionValue: "120.00", periodicity: "Mensal" },
  { name: "OpenAI", vendor: "OpenAI", companyCost: "0", compositionValue: "100.00", periodicity: "Mensal" },
  { name: "Domínio", vendor: "Registro.br", companyCost: "40.00", compositionValue: "80.00", periodicity: "Anual" },
  { name: "GitHub", vendor: "GitHub", companyCost: "0", compositionValue: "40.00", periodicity: "Mensal" },
  { name: "Banco de Dados", vendor: "Neon", companyCost: "0", compositionValue: "50.00", periodicity: "Mensal" },
];

const DEFAULT_LABOR = [
  { name: "Desenvolvimento", defaultValue: "3500.00" },
  { name: "Implantação", defaultValue: "800.00" },
  { name: "Treinamento", defaultValue: "500.00" },
  { name: "Consultoria", defaultValue: "600.00" },
  { name: "Suporte Inicial", defaultValue: "400.00" },
  { name: "Migração", defaultValue: "700.00" },
  { name: "Parametrização", defaultValue: "450.00" },
];

const DEFAULT_EXCLUSIVE = [
  { name: "Designer", defaultValue: "800.00" },
  { name: "Freelancer", defaultValue: "1200.00" },
  { name: "Licença", defaultValue: "300.00" },
  { name: "Equipamentos", defaultValue: "500.00" },
  { name: "Viagens", defaultValue: "400.00" },
  { name: "Consultoria externa", defaultValue: "600.00" },
];

const DEFAULT_SETTINGS: Record<string, object> = {
  profit_distribution: {
    companyPercent: 20,
    partners: [
      { slug: "elaine", name: "Elaine Rebelo", percent: 40 },
      { slug: "kayky", name: "Kayky Mendes", percent: 40 },
    ],
  },
  company_profile: {
    name: "K&N Tecnologia",
    city: "São Paulo - SP",
    cnpj: "67.529.522/0001-56",
  },
};

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    LIMIT 1
  `);
  return (result.rows?.length ?? 0) > 0;
}

async function tableExists(table: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
    LIMIT 1
  `);
  return (result.rows?.length ?? 0) > 0;
}

async function addClientColumns() {
  const cols: [string, string][] = [
    ["responsible", "VARCHAR(200) DEFAULT ''"],
    ["role", "VARCHAR(100) DEFAULT ''"],
    ["whatsapp", "VARCHAR(50) DEFAULT ''"],
    ["cnpj", "VARCHAR(20) DEFAULT ''"],
    ["address", "TEXT DEFAULT ''"],
    ["internal_notes", "TEXT DEFAULT ''"],
    ["client_status", "VARCHAR(50) DEFAULT 'Cliente ativo'"],
  ];
  for (const [col, def] of cols) {
    if (!(await columnExists("clients", col))) {
      await db.execute(sql.raw(`ALTER TABLE clients ADD COLUMN ${col} ${def}`));
      console.log(`  + clients.${col}`);
    }
  }
}

async function addProjectColumns() {
  const cols: [string, string][] = [
    ["proposal_id", "INTEGER REFERENCES commercial_proposals(id)"],
    ["suggested_price", "NUMERIC(12,2) DEFAULT 0"],
    ["negotiated_price", "NUMERIC(12,2) DEFAULT 0"],
    ["discount_amount", "NUMERIC(12,2) DEFAULT 0"],
    ["discount_reason", "TEXT DEFAULT ''"],
  ];
  for (const [col, def] of cols) {
    if (!(await columnExists("projects", col))) {
      await db.execute(sql.raw(`ALTER TABLE projects ADD COLUMN ${col} ${def}`));
      console.log(`  + projects.${col}`);
    }
  }
}

async function createErpTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS catalog_infrastructure (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      vendor VARCHAR(200) DEFAULT '',
      description TEXT DEFAULT '',
      periodicity VARCHAR(50) DEFAULT 'Mensal',
      company_cost NUMERIC(12,2) DEFAULT 0,
      composition_value NUMERIC(12,2) DEFAULT 0,
      category VARCHAR(100) DEFAULT 'Infraestrutura',
      notes TEXT DEFAULT '',
      active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS catalog_labor (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      default_value NUMERIC(12,2) DEFAULT 0,
      category VARCHAR(100) DEFAULT 'Mão de Obra',
      notes TEXT DEFAULT '',
      active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS catalog_exclusive_costs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      default_value NUMERIC(12,2) DEFAULT 0,
      category VARCHAR(100) DEFAULT 'Custo Exclusivo',
      notes TEXT DEFAULT '',
      active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS company_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(120) NOT NULL UNIQUE,
      value TEXT NOT NULL DEFAULT '{}',
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS project_compositions (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
      proposal_id INTEGER REFERENCES commercial_proposals(id),
      infra_total NUMERIC(12,2) DEFAULT 0,
      labor_total NUMERIC(12,2) DEFAULT 0,
      exclusive_total NUMERIC(12,2) DEFAULT 0,
      suggested_price NUMERIC(12,2) DEFAULT 0,
      negotiated_price NUMERIC(12,2) DEFAULT 0,
      discount_amount NUMERIC(12,2) DEFAULT 0,
      discount_percent NUMERIC(8,4) DEFAULT 0,
      discount_reason TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS project_composition_lines (
      id SERIAL PRIMARY KEY,
      composition_id INTEGER NOT NULL REFERENCES project_compositions(id) ON DELETE CASCADE,
      line_type VARCHAR(30) NOT NULL,
      catalog_id INTEGER,
      label VARCHAR(300) NOT NULL,
      composition_value NUMERIC(12,2) NOT NULL DEFAULT 0,
      company_cost NUMERIC(12,2),
      notes TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS financial_entries (
      id SERIAL PRIMARY KEY,
      entry_type VARCHAR(20) NOT NULL,
      origin_type VARCHAR(30) NOT NULL DEFAULT 'manual',
      origin_id INTEGER,
      description VARCHAR(400) NOT NULL,
      original_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(30) DEFAULT 'Pendente',
      due_date TIMESTAMP,
      client_id INTEGER REFERENCES clients(id),
      project_id INTEGER REFERENCES projects(id),
      vendor_id INTEGER REFERENCES vendors(id),
      category VARCHAR(100) DEFAULT '',
      cost_type VARCHAR(50) DEFAULT '',
      financial_responsible VARCHAR(100) DEFAULT '',
      payment_method VARCHAR(50) DEFAULT '',
      is_reimbursable BOOLEAN DEFAULT FALSE,
      recurrence VARCHAR(50) DEFAULT 'Pagamento único',
      notes TEXT DEFAULT '',
      created_by VARCHAR(200) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS financial_entry_payments (
      id SERIAL PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL,
      payment_date TIMESTAMP DEFAULT NOW() NOT NULL,
      payment_method VARCHAR(50) DEFAULT '',
      notes TEXT DEFAULT '',
      created_by VARCHAR(200) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS financial_entry_history (
      id SERIAL PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL,
      amount NUMERIC(12,2),
      snapshot TEXT DEFAULT '{}',
      note TEXT DEFAULT '',
      created_by VARCHAR(200) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  console.log("  Tabelas ERP v2 verificadas/criadas.");
}

async function seedCatalogs() {
  const infraCount = await db.execute(sql`SELECT COUNT(*)::int AS c FROM catalog_infrastructure`);
  if ((infraCount.rows?.[0] as { c: number })?.c === 0) {
    for (let i = 0; i < DEFAULT_INFRA.length; i++) {
      const item = DEFAULT_INFRA[i];
      await db.execute(sql`
        INSERT INTO catalog_infrastructure (name, vendor, company_cost, composition_value, periodicity, sort_order)
        VALUES (${item.name}, ${item.vendor}, ${item.companyCost}, ${item.compositionValue}, ${item.periodicity}, ${i})
      `);
    }
    console.log(`  Seed: ${DEFAULT_INFRA.length} itens de infraestrutura.`);
  }

  const laborCount = await db.execute(sql`SELECT COUNT(*)::int AS c FROM catalog_labor`);
  if ((laborCount.rows?.[0] as { c: number })?.c === 0) {
    for (let i = 0; i < DEFAULT_LABOR.length; i++) {
      const item = DEFAULT_LABOR[i];
      await db.execute(sql`
        INSERT INTO catalog_labor (name, default_value, sort_order)
        VALUES (${item.name}, ${item.defaultValue}, ${i})
      `);
    }
    console.log(`  Seed: ${DEFAULT_LABOR.length} itens de mão de obra.`);
  }

  const exclusiveCount = await db.execute(sql`SELECT COUNT(*)::int AS c FROM catalog_exclusive_costs`);
  if ((exclusiveCount.rows?.[0] as { c: number })?.c === 0) {
    for (let i = 0; i < DEFAULT_EXCLUSIVE.length; i++) {
      const item = DEFAULT_EXCLUSIVE[i];
      await db.execute(sql`
        INSERT INTO catalog_exclusive_costs (name, default_value, sort_order)
        VALUES (${item.name}, ${item.defaultValue}, ${i})
      `);
    }
    console.log(`  Seed: ${DEFAULT_EXCLUSIVE.length} custos exclusivos.`);
  }
}

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.execute(sql`
      INSERT INTO company_settings (key, value)
      VALUES (${key}, ${JSON.stringify(value)})
      ON CONFLICT (key) DO NOTHING
    `);
  }
  console.log("  Configurações da empresa verificadas.");
}

async function main() {
  console.log("migrate-v13: ERP v2.0 — fundação arquitetural\n");

  await addClientColumns();
  await addProjectColumns();
  await createErpTables();
  await seedCatalogs();
  await seedSettings();

  const ok = await tableExists("financial_entries");
  if (!ok) throw new Error("financial_entries não foi criada");

  console.log("\nmigrate-v13 concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
