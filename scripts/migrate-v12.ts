import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

/** Garante item Propostas no menu (idempotente). */
async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v12 — menu Propostas...");

  await sql`
    INSERT INTO menu_items (label, href, icon, group_label, sort_order, visible)
    SELECT 'Propostas', '/propostas', 'FileText', 'Navegação', 3, true
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE href = '/propostas')
  `;

  await sql`
    UPDATE menu_items
    SET label = 'Propostas', icon = 'FileText', visible = true, group_label = 'Navegação', sort_order = 3
    WHERE href = '/propostas'
  `;

  console.log("Migração v12 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
