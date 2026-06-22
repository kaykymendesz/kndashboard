import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";
import { slugify } from "../src/lib/slug";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v4 (atendimento)...");

  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug VARCHAR(120) UNIQUE`;

  const clients = await sql`SELECT id, name, slug FROM clients`;
  for (const c of clients) {
    if (!c.slug) {
      const base = slugify(String(c.name));
      let slug = base;
      let n = 1;
      while (true) {
        const exists = await sql`SELECT id FROM clients WHERE slug = ${slug} AND id != ${c.id}`;
        if (exists.length === 0) break;
        slug = `${base}-${n++}`;
      }
      await sql`UPDATE clients SET slug = ${slug} WHERE id = ${c.id}`;
    }
  }

  await sql`CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT DEFAULT '',
    value NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Rascunho',
    valid_until TIMESTAMP,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS attendance_cases (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quotation_id INTEGER REFERENCES quotations(id),
    title VARCHAR(300) NOT NULL,
    description TEXT DEFAULT '',
    demand_type VARCHAR(50) DEFAULT 'Novo projeto',
    status VARCHAR(50) DEFAULT 'Aguardando',
    responsible VARCHAR(100) DEFAULT '',
    notes TEXT DEFAULT '',
    attended_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS attendance_steps (
    id SERIAL PRIMARY KEY,
    case_id INTEGER NOT NULL REFERENCES attendance_cases(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Pendente',
    notes TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  const zuki = await sql`SELECT id, slug FROM clients WHERE slug = 'zuki' OR name ILIKE '%zuki%' LIMIT 1`;
  if (zuki.length === 0) {
    await sql`
      INSERT INTO clients (name, slug, company, status, notes)
      VALUES ('Zuki', 'zuki', 'Zuki', 'Ativo', 'Cliente de atendimento K&N')
    `;
    console.log("Cliente Zuki criado.");
  } else if (!zuki[0].slug) {
    await sql`UPDATE clients SET slug = 'zuki' WHERE id = ${zuki[0].id}`;
  }

  console.log("Migração v4 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
