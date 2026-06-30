import { execSync } from "child_process";
import { getDatabaseUrl } from "../src/lib/db/env";

const MIGRATIONS = [
  "init-db.ts",
  "migrate-v2.ts",
  "migrate-v3.ts",
  "migrate-v4.ts",
  "migrate-v5.ts",
  "migrate-v6.ts",
  "migrate-v7.ts",
  "migrate-v8.ts",
  "migrate-v9.ts",
  "migrate-v10.ts",
  "migrate-v11.ts",
  "migrate-v12.ts",
  "seed-if-empty.ts",
];

try {
  getDatabaseUrl();
  console.log("Inicializando banco e migrações...");

  for (const script of MIGRATIONS) {
    const label = script.replace(".ts", "");
    try {
      console.log(`Executando ${label}...`);
      execSync(`npx tsx scripts/${script}`, { stdio: "inherit", env: process.env });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`${label} falhou (continuando):`, message);
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn("Setup do banco ignorado:", message);
}

console.log("Iniciando build Next.js...");
execSync("npx next build", { stdio: "inherit", env: process.env });
