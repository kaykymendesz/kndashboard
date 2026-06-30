import { runProposalsSchemaMigration } from "../src/lib/proposals/ensure-schema";

async function main() {
  console.log("Migrando schema v11 — Propostas Comerciais...");
  await runProposalsSchemaMigration();
  console.log("Migração v11 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
