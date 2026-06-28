import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Migrando schema v10 — unificação Clientes → Projetos...");

  await sql`
    INSERT INTO classifications (type, name, color, sort_order)
    SELECT 'project_status', s.name, s.color, s.ord
    FROM (VALUES
      ('Prospecção', '#6366f1', 1),
      ('Levantamento', '#8b5cf6', 2),
      ('Cotação', '#a855f7', 3),
      ('Em desenvolvimento', '#2563eb', 4),
      ('Homologação', '#0ea5e9', 5),
      ('Implantação', '#14b8a6', 6),
      ('Concluído', '#16a34a', 7),
      ('Cancelado', '#64748b', 8)
    ) AS s(name, color, ord)
    WHERE NOT EXISTS (
      SELECT 1 FROM classifications c WHERE c.type = 'project_status' AND c.name = s.name
    )
  `;

  await sql`
    UPDATE projects
    SET status = 'Prospecção'
    WHERE project_type = 'cliente'
      AND (status IS NULL OR status = '' OR status = 'Ativo')
  `;

  await sql`
    UPDATE projects
    SET status = 'Concluído'
    WHERE project_type = 'cliente'
      AND LOWER(COALESCE(status, '')) IN ('finalizado', 'entregue', 'concluido')
  `;

  await sql`
    INSERT INTO projects (name, slug, description, status, project_type, client_id, notes, color)
    SELECT
      ac.title,
      LOWER(REGEXP_REPLACE(TRIM(ac.title), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || ac.client_id::text,
      COALESCE(ac.description, ''),
      CASE ac.status
        WHEN 'Aguardando' THEN 'Prospecção'
        WHEN 'Em atendimento' THEN 'Levantamento'
        WHEN 'Finalizado' THEN 'Concluído'
        WHEN 'Cancelado' THEN 'Cancelado'
        ELSE 'Prospecção'
      END,
      'cliente',
      ac.client_id,
      COALESCE(ac.notes, ''),
      '#1e3a5f'
    FROM attendance_cases ac
    WHERE NOT EXISTS (
      SELECT 1 FROM projects p
      WHERE p.client_id = ac.client_id
        AND LOWER(TRIM(p.name)) = LOWER(TRIM(ac.title))
    )
  `;

  await sql`
    UPDATE projects p
    SET
      contracted_revenue = q.value,
      status = CASE
        WHEN q.status = 'Aprovada' THEN 'Em desenvolvimento'
        WHEN q.status IN ('Rascunho', 'Enviada') THEN 'Cotação'
        WHEN q.status = 'Recusada' THEN 'Cancelado'
        ELSE p.status
      END
    FROM quotations q
    WHERE p.client_id = q.client_id
      AND LOWER(TRIM(p.name)) = LOWER(TRIM(q.title))
  `;

  await sql`
    INSERT INTO projects (name, slug, description, status, project_type, client_id, contracted_revenue, notes, color)
    SELECT
      q.title,
      LOWER(REGEXP_REPLACE(TRIM(q.title), '[^a-zA-Z0-9]+', '-', 'g')) || '-q' || q.id::text,
      COALESCE(q.description, ''),
      CASE q.status
        WHEN 'Aprovada' THEN 'Em desenvolvimento'
        WHEN 'Recusada' THEN 'Cancelado'
        ELSE 'Cotação'
      END,
      'cliente',
      q.client_id,
      q.value,
      COALESCE(q.notes, ''),
      '#1e3a5f'
    FROM quotations q
    WHERE NOT EXISTS (
      SELECT 1 FROM projects p
      WHERE p.client_id = q.client_id
        AND LOWER(TRIM(p.name)) = LOWER(TRIM(q.title))
    )
  `;

  await sql`
    UPDATE menu_items SET visible = false
    WHERE href = '/atendimento' OR href LIKE '/atendimento/%'
  `;

  await sql`
    UPDATE menu_items SET visible = false, group_label = 'Legado'
    WHERE label ILIKE '%atendimento%'
  `;

  console.log("Migração v10 concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
