/**
 * ERP v2.0 — histórico de pagamentos parciais dos sócios em gastos.
 */
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

async function tableExists(table: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
    LIMIT 1
  `);
  return (result.rows?.length ?? 0) > 0;
}

async function main() {
  console.log("migrate-v14: histórico pagamentos sócios\n");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS expense_partner_payments (
      id SERIAL PRIMARY KEY,
      expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      partner_slug VARCHAR(50) NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      notes TEXT DEFAULT '',
      created_by VARCHAR(200) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  if (!(await tableExists("expense_partner_payments"))) {
    throw new Error("expense_partner_payments não foi criada");
  }

  console.log("migrate-v14 concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
