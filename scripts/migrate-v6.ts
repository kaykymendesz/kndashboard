import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v6...");

  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS contracted_plan_value NUMERIC(12, 2)`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT ''`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_card VARCHAR(120) DEFAULT ''`;

  await sql`CREATE TABLE IF NOT EXISTS expense_plan_changes (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT '',
    plan_value NUMERIC(12, 2),
    change_date TIMESTAMP,
    notes TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  // Migrar alteração única antiga para a nova tabela
  await sql`
    INSERT INTO expense_plan_changes (expense_id, plan_name, plan_value, change_date, sort_order)
    SELECT id, plan_change_variant, NULL, plan_change_date, 1
    FROM expenses
    WHERE plan_change_variant IS NOT NULL AND plan_change_variant <> ''
      AND NOT EXISTS (
        SELECT 1 FROM expense_plan_changes epc WHERE epc.expense_id = expenses.id
      )
  `;

  // payment_method legado → payment_type quando vazio
  await sql`
    UPDATE expenses
    SET payment_type = payment_method
    WHERE payment_type = '' AND payment_method IS NOT NULL AND payment_method <> ''
  `;

  console.log("Migração v6 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
