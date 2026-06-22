import { execSync } from "child_process";
import { getDatabaseUrl } from "../src/lib/db/env";

try {
  getDatabaseUrl();
  console.log("Sincronizando schema do banco (drizzle push)...");
  execSync("npx drizzle-kit push --force", { stdio: "inherit", env: process.env });

  console.log("Verificando seed inicial...");
  execSync("npx tsx scripts/seed-if-empty.ts", { stdio: "inherit", env: process.env });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn("DB push ignorado:", message);
}

console.log("Iniciando build Next.js...");
execSync("npx next build", { stdio: "inherit", env: process.env });
