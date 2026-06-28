import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v9 — Financeiro / Clientes / Projetos...");

  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(30) DEFAULT 'interno'`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS contracted_revenue NUMERIC(12, 2)`;

  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_scope VARCHAR(30) DEFAULT 'kn_interno'`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS cost_center VARCHAR(300) DEFAULT ''`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_responsible VARCHAR(50) DEFAULT 'K&N'`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reimbursement_status VARCHAR(50) DEFAULT 'Não possui'`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS has_subscription BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT ''`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subscription_recurrence VARCHAR(50) DEFAULT ''`;

  await sql`
    UPDATE projects
    SET project_type = 'arquivado'
    WHERE LOWER(COALESCE(status, '')) LIKE '%arquiv%'
      AND COALESCE(project_type, 'interno') = 'interno'
  `;

  await sql`
    UPDATE projects p
    SET
      client_id = sub.client_id,
      project_type = 'cliente'
    FROM (
      SELECT DISTINCT ON (e.project_id) e.project_id, e.client_id
      FROM expenses e
      WHERE e.project_id IS NOT NULL AND e.client_id IS NOT NULL
      ORDER BY e.project_id, e.id DESC
    ) sub
    WHERE p.id = sub.project_id
      AND COALESCE(p.project_type, 'interno') = 'interno'
      AND p.slug NOT IN ('kn-empresa', 'wikinaya')
  `;

  await sql`
    UPDATE projects
    SET project_type = 'interno', client_id = NULL
    WHERE slug IN ('kn-empresa', 'wikinaya', 'dashboard-kn', 'dashboard', 'site-institucional')
  `;

  await sql`
    UPDATE expenses
    SET project_id = (SELECT id FROM projects WHERE slug = 'kn-empresa' LIMIT 1)
    WHERE project_id IS NULL
      AND EXISTS (SELECT 1 FROM projects WHERE slug = 'kn-empresa')
  `;

  await sql`
    UPDATE expenses e
    SET
      expense_scope = CASE
        WHEN e.client_id IS NOT NULL OR p.project_type = 'cliente' THEN 'projeto_cliente'
        ELSE 'kn_interno'
      END,
      client_id = COALESCE(e.client_id, p.client_id),
      cost_center = CASE
        WHEN e.client_id IS NOT NULL OR p.project_type = 'cliente' THEN
          TRIM(COALESCE(c.name, '') || CASE WHEN c.name IS NOT NULL THEN ' · ' ELSE '' END || p.name)
        ELSE p.name
      END
    FROM projects p
    LEFT JOIN clients c ON c.id = COALESCE(e.client_id, p.client_id)
    WHERE e.project_id = p.id
  `;

  await sql`
    UPDATE expenses
    SET has_subscription = true,
        subscription_recurrence = CASE expense_type
          WHEN 'Mensal' THEN 'Mensal'
          WHEN 'Anual' THEN 'Anual'
          ELSE subscription_recurrence
        END
    WHERE expense_type IN ('Mensal', 'Anual')
      AND has_subscription IS NOT TRUE
  `;

  await sql`
    UPDATE expenses
    SET subscription_plan = COALESCE(NULLIF(contracted_plan, ''), plan_variant, subscription_plan)
    WHERE has_subscription = true
      AND COALESCE(subscription_plan, '') = ''
  `;

  await sql`
    UPDATE projects p
    SET contracted_revenue = c.contract_value
    FROM clients c
    WHERE p.client_id = c.id
      AND p.project_type = 'cliente'
      AND p.contracted_revenue IS NULL
      AND c.contract_value IS NOT NULL
  `;

  console.log("Migração v9 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
