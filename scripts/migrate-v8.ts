import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v8 — Painel Operacional...");

  await sql`CREATE TABLE IF NOT EXISTS monitor_check_logs (
    id SERIAL PRIMARY KEY,
    service_id VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL,
    response_time_ms INTEGER,
    http_status INTEGER,
    error_message TEXT,
    plain_summary TEXT NOT NULL DEFAULT '',
    technical_detail TEXT,
    suggested_steps TEXT DEFAULT '[]',
    checked_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE INDEX IF NOT EXISTS monitor_check_logs_service_id_idx ON monitor_check_logs (service_id)`;
  await sql`CREATE INDEX IF NOT EXISTS monitor_check_logs_checked_at_idx ON monitor_check_logs (checked_at DESC)`;

  await sql`
    INSERT INTO menu_items (label, href, icon, group_label, sort_order, visible)
    SELECT 'Painel Operacional', '/operacional', 'Activity', 'Sistema', 0, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE href = '/operacional')
  `;

  console.log("Migração v8 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
