import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v5...");

  // Gastos ↔ Cronograma
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS schedule_item_id INTEGER REFERENCES schedule_items(id)`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS has_cost BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS contracted_plan VARCHAR(100) DEFAULT ''`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS plan_change_variant VARCHAR(100) DEFAULT ''`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS plan_change_date TIMESTAMP`;

  await sql`ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS has_cost BOOLEAN DEFAULT FALSE`;

  // Copiar plan_variant existente para contracted_plan
  await sql`
    UPDATE expenses
    SET contracted_plan = plan_variant
    WHERE contracted_plan = '' AND plan_variant IS NOT NULL AND plan_variant <> ''
  `;

  // Itens do cronograma com valor previsto/realizado passam a ser "com custo"
  await sql`
    UPDATE schedule_items
    SET has_cost = TRUE
    WHERE has_cost = FALSE
      AND (
        COALESCE(planned_value, 0) > 0
        OR COALESCE(actual_value, 0) > 0
      )
  `;

  // Usuários para troca de senha no perfil
  await sql`CREATE TABLE IF NOT EXISTS app_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  const users = [
    {
      email: process.env.AUTH_ELAINE_EMAIL ?? "elaine@kn.dev",
      name: "Elaine Rebelo Anaya",
      password: process.env.AUTH_ELAINE_PASSWORD ?? "elaine2026",
    },
    {
      email: process.env.AUTH_KAYKY_EMAIL ?? "kayky@kn.dev",
      name: "Kayky Medes da Silva",
      password: process.env.AUTH_KAYKY_PASSWORD ?? "kayky2026",
    },
  ];

  for (const u of users) {
    const existing = await sql`SELECT id FROM app_users WHERE email = ${u.email}`;
    if (existing.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      await sql`
        INSERT INTO app_users (email, name, password_hash)
        VALUES (${u.email}, ${u.name}, ${hash})
      `;
      console.log(`Usuário ${u.email} criado.`);
    }
  }

  console.log("Migração v5 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
