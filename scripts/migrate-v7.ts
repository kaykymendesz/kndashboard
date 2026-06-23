import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v7...");

  await sql`CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(100) DEFAULT '',
    email VARCHAR(200) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    notes TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS revenues (
    id SERIAL PRIMARY KEY,
    description VARCHAR(300) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    received_date TIMESTAMP,
    category VARCHAR(100) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Recebido',
    project_id INTEGER REFERENCES projects(id),
    client_id INTEGER REFERENCES clients(id),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id)`;

  // Backfill fornecedores a partir do texto livre
  await sql`
    INSERT INTO vendors (name, slug, category, status)
    SELECT DISTINCT TRIM(vendor), LOWER(REGEXP_REPLACE(TRIM(vendor), '[^a-zA-Z0-9]+', '-', 'g')), 'Geral', 'Ativo'
    FROM expenses
    WHERE vendor IS NOT NULL AND TRIM(vendor) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM vendors v WHERE LOWER(v.name) = LOWER(TRIM(expenses.vendor))
      )
  `;

  await sql`
    UPDATE expenses e
    SET vendor_id = v.id
    FROM vendors v
    WHERE e.vendor_id IS NULL
      AND TRIM(e.vendor) <> ''
      AND LOWER(v.name) = LOWER(TRIM(e.vendor))
  `;

  // Menus Fornecedores e Lucro
  await sql`
    INSERT INTO menu_items (label, href, icon, group_label, sort_order, visible)
    SELECT 'Fornecedores', '/fornecedores', 'Truck', 'Navegação', 4, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE href = '/fornecedores')
  `;

  await sql`
    INSERT INTO menu_items (label, href, icon, group_label, sort_order, visible)
    SELECT 'Lucro', '/lucro', 'TrendingUp', 'Navegação', 5, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE href = '/lucro')
  `;

  console.log("Migração v7 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
