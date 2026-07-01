import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** Garante tabelas ERP v2 no primeiro acesso (fallback se migrate-v13 não rodou). */
export async function ensureErpV2Schema(): Promise<void> {
  const result = await db.execute(sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'financial_entries'
    LIMIT 1
  `);
  if ((result.rows?.length ?? 0) > 0) return;

  const { execSync } = await import("child_process");
  execSync("npx tsx scripts/migrate-v13.ts", { stdio: "pipe", env: process.env });
}
