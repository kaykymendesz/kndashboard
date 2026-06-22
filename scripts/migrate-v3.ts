import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v3...");

  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_type VARCHAR(20) DEFAULT 'Único'`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS plan_variant VARCHAR(100) DEFAULT ''`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS plan_notes TEXT DEFAULT ''`;

  await sql`ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`;
  await sql`ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS flow_id INTEGER`;

  await sql`CREATE TABLE IF NOT EXISTS process_flows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS process_steps (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER NOT NULL REFERENCES process_flows(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS schedule_processes (
    id SERIAL PRIMARY KEY,
    schedule_item_id INTEGER NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES process_steps(id),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Pendente',
    notes TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  const concluido = await sql`
    SELECT id FROM classifications WHERE type = 'schedule_status' AND name = 'Concluído'
  `;
  if (concluido.length === 0) {
    await sql`
      INSERT INTO classifications (type, name, color, sort_order)
      VALUES ('schedule_status', 'Concluído', '#16a34a', 10)
    `;
    console.log("Status 'Concluído' adicionado ao cronograma.");
  }

  for (const [name, order] of [
    ["Planejado", 1],
    ["A fazer", 2],
    ["Em andamento", 3],
    ["Analisando", 4],
    ["Concluído", 5],
    ["Finalizado", 6],
    ["Futuro", 7],
    ["Verificar", 8],
  ] as const) {
    const exists = await sql`
      SELECT id FROM classifications WHERE type = 'schedule_status' AND name = ${name}
    `;
    if (exists.length === 0) {
      await sql`
        INSERT INTO classifications (type, name, color, sort_order)
        VALUES ('schedule_status', ${name}, '#1e3a5f', ${order})
      `;
    }
  }

  for (const [name, order] of [
    ["Análise", 1],
    ["Documentação", 2],
    ["Execução", 3],
    ["Revisão", 4],
    ["Aprovação", 5],
  ] as const) {
    const exists = await sql`
      SELECT id FROM classifications WHERE type = 'process_category' AND name = ${name}
    `;
    if (exists.length === 0) {
      await sql`
        INSERT INTO classifications (type, name, color, sort_order)
        VALUES ('process_category', ${name}, '#2563eb', ${order})
      `;
    }
  }

  const flowCount = await sql`SELECT count(*)::int as c FROM process_flows`;
  if (Number(flowCount[0].c) === 0) {
    const [flow] = await sql`
      INSERT INTO process_flows (name, description, is_default, sort_order)
      VALUES ('Fluxo Padrão', 'Processos padrão para itens do cronograma', true, 1)
      RETURNING id
    `;
    const steps = [
      { name: "Análise inicial", category: "Análise", sortOrder: 1 },
      { name: "Planejamento", category: "Documentação", sortOrder: 2 },
      { name: "Execução", category: "Execução", sortOrder: 3 },
      { name: "Revisão", category: "Revisão", sortOrder: 4 },
      { name: "Conclusão", category: "Aprovação", sortOrder: 5 },
    ];
    for (const step of steps) {
      await sql`
        INSERT INTO process_steps (flow_id, name, category, sort_order)
        VALUES (${flow.id}, ${step.name}, ${step.category}, ${step.sortOrder})
      `;
    }
    console.log("Fluxo padrão de processos criado.");
  }

  console.log("Migração v3 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
