import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";
import { getDatabaseUrl } from "../src/lib/db/env";
import * as schema from "../src/lib/db/schema";

async function main() {
  const dbUrl = getDatabaseUrl();
  const db = drizzle(neon(dbUrl), { schema });

  const result = await db.select({ count: sql<number>`count(*)` }).from(schema.activities);
  const count = Number(result[0]?.count ?? 0);

  if (count > 0) {
    console.log(`Banco já possui ${count} atividades. Seed ignorado.`);
    return;
  }

  console.log("Banco vazio — importando dados da planilha...");
  execSync("npx tsx scripts/seed.ts", { stdio: "inherit", env: process.env });
  console.log("Seed concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
