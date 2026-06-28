import { execSync } from "child_process";
import { getDatabaseUrl } from "../src/lib/db/env";

try {
  getDatabaseUrl();
  console.log("Inicializando banco...");
  execSync("npx tsx scripts/init-db.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v2...");
  execSync("npx tsx scripts/migrate-v2.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v3...");
  execSync("npx tsx scripts/migrate-v3.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v4...");
  execSync("npx tsx scripts/migrate-v4.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v5...");
  execSync("npx tsx scripts/migrate-v5.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v6...");
  execSync("npx tsx scripts/migrate-v6.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v7...");
  execSync("npx tsx scripts/migrate-v7.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v8...");
  execSync("npx tsx scripts/migrate-v8.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando migração v9...");
  execSync("npx tsx scripts/migrate-v9.ts", { stdio: "inherit", env: process.env });

  console.log("Verificando seed inicial...");
  execSync("npx tsx scripts/seed-if-empty.ts", { stdio: "inherit", env: process.env });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn("Setup do banco ignorado:", message);
}

console.log("Iniciando build Next.js...");
execSync("npx next build", { stdio: "inherit", env: process.env });
