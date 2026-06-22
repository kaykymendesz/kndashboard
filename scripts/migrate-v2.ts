import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";
import { DEFAULT_CLASSIFICATIONS, DEFAULT_MENUS } from "../src/lib/constants";

const WIKINAYA_EXPENSE_KEYWORDS = ["domínio", "dominio", "wikinaya", "play store", "google play"];
const WIKINAYA_INFO_SECTIONS = [
  "IDENTIDADE",
  "MARCA / INPI",
  "ESTRUTURA",
  "INFRAESTRUTURA",
  "FUTURO",
];

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v2...");

  await sql`CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'Ativo',
    color VARCHAR(20) DEFAULT '#1e3a5f',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    href VARCHAR(200) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'LayoutDashboard',
    group_label VARCHAR(100) DEFAULT 'Navegação',
    sort_order INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS classifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#1e3a5f',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`ALTER TABLE project_info ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id)`;
  await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id)`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id)`;
  await sql`ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id)`;

  const existingProjects = await sql`SELECT id, slug FROM projects` as { id: number; slug: string }[];
  let wikinayaId: number;
  let empresaId: number;

  const wikinaya = existingProjects.find((p) => p.slug === "wikinaya");
  if (wikinaya) {
    wikinayaId = wikinaya.id;
  } else {
    const inserted = await sql`
      INSERT INTO projects (name, slug, description, status, color, notes)
      VALUES (
        'Wikinaya',
        'wikinaya',
        'Rede social cinematográfica emocional e social. Gastos: domínio e Play Store.',
        'Ativo',
        '#2563eb',
        'Projeto principal da K&N. Atividades vinculadas exclusivamente a este projeto.'
      )
      RETURNING id
    `;
    wikinayaId = inserted[0].id;
  }

  const empresa = existingProjects.find((p) => p.slug === "kn-empresa");
  if (empresa) {
    empresaId = empresa.id;
  } else {
    const inserted = await sql`
      INSERT INTO projects (name, slug, description, status, color, notes)
      VALUES (
        'K&N Empresa',
        'kn-empresa',
        'K&N Desenvolvimento de Software LTDA — dados jurídicos e estrutura.',
        'Ativo',
        '#1e3a5f',
        ''
      )
      RETURNING id
    `;
    empresaId = inserted[0].id;
  }

  await sql`UPDATE activities SET project_id = ${wikinayaId} WHERE project_id IS NULL`;

  const allExpenses = await sql`SELECT id, description, category FROM expenses`;
  for (const exp of allExpenses as { id: number; description: string; category: string }[]) {
    const text = `${exp.description} ${exp.category}`.toLowerCase();
    const isWikinaya = WIKINAYA_EXPENSE_KEYWORDS.some((k) => text.includes(k));
    if (isWikinaya) {
      await sql`UPDATE expenses SET project_id = ${wikinayaId} WHERE id = ${exp.id}`;
    }
  }

  const allInfo = await sql`SELECT id, section FROM project_info WHERE project_id IS NULL`;
  for (const row of allInfo as { id: number; section: string }[]) {
    const section = row.section.trim().toUpperCase();
    const targetId = WIKINAYA_INFO_SECTIONS.some((s) => section.includes(s.split(" ")[0]))
      ? wikinayaId
      : empresaId;
    await sql`UPDATE project_info SET project_id = ${targetId} WHERE id = ${row.id}`;
  }

  const menuCount = await sql`SELECT count(*)::int as c FROM menu_items`;
  if (Number(menuCount[0].c) === 0) {
    for (const item of DEFAULT_MENUS) {
      await sql`
        INSERT INTO menu_items (label, href, icon, group_label, sort_order, visible)
        VALUES (${item.label}, ${item.href}, ${item.icon}, ${item.groupLabel}, ${item.sortOrder}, true)
      `;
    }
    console.log("Menus padrão criados.");
  }

  const classCount = await sql`SELECT count(*)::int as c FROM classifications`;
  if (Number(classCount[0].c) === 0) {
    for (const c of DEFAULT_CLASSIFICATIONS) {
      await sql`
        INSERT INTO classifications (type, name, color, sort_order)
        VALUES (${c.type}, ${c.name}, ${c.color}, ${c.sortOrder})
      `;
    }
    console.log("Classificações padrão criadas.");
  }

  console.log("Sincronizando menus Wikinaya...");
  await sql`UPDATE menu_items SET visible = false WHERE href = '/atividades'`;

  const wikinayaMenu = await sql`SELECT id FROM menu_items WHERE href = '/projetos/wikinaya'`;
  if (wikinayaMenu.length === 0) {
    await sql`
      INSERT INTO menu_items (label, href, icon, group_label, sort_order, visible)
      VALUES ('Projeto Wikinaya', '/projetos/wikinaya', 'FolderKanban', 'Projetos', 4, true)
    `;
  } else {
    await sql`
      UPDATE menu_items
      SET label = 'Projeto Wikinaya', group_label = 'Projetos', visible = true, sort_order = 4
      WHERE href = '/projetos/wikinaya'
    `;
  }

  console.log("Migração v2 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
