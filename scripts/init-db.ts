import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../src/lib/db/env";

async function main() {
  const sql = neon(getDatabaseUrl());
  console.log("Criando tabelas (se não existirem)...");

  await sql`CREATE TABLE IF NOT EXISTS project_info (
    id SERIAL PRIMARY KEY,
    section VARCHAR(100) NOT NULL,
    field VARCHAR(200) NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(20),
    area VARCHAR(100) NOT NULL DEFAULT '',
    feature VARCHAR(200) NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'A fazer',
    priority VARCHAR(20) NOT NULL DEFAULT 'Média',
    responsible VARCHAR(100) DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS schedule_items (
    id SERIAL PRIMARY KEY,
    planned_date TIMESTAMP,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    priority VARCHAR(20) DEFAULT 'Média',
    status VARCHAR(50) DEFAULT 'Planejado',
    planned_value NUMERIC(12, 2),
    actual_value NUMERIC(12, 2),
    difference NUMERIC(12, 2),
    responsible VARCHAR(100) DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(300) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    vendor VARCHAR(200) DEFAULT '',
    purchase_date TIMESTAMP,
    financial_responsible VARCHAR(100) DEFAULT '',
    total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    elaine_share NUMERIC(12, 2) DEFAULT 0,
    kayky_share NUMERIC(12, 2) DEFAULT 0,
    is_installment BOOLEAN DEFAULT FALSE,
    installment_count INTEGER DEFAULT 1,
    installment_value NUMERIC(12, 2),
    paid_installments INTEGER DEFAULT 0,
    remaining_installments INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pendente',
    due_date TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT '',
    paid_by VARCHAR(100) DEFAULT '',
    elaine_settled BOOLEAN DEFAULT FALSE,
    kayky_settled BOOLEAN DEFAULT FALSE,
    elaine_pending NUMERIC(12, 2) DEFAULT 0,
    kayky_pending NUMERIC(12, 2) DEFAULT 0,
    linked_email VARCHAR(200) DEFAULT '',
    auto_renew BOOLEAN DEFAULT FALSE,
    expiration_date TIMESTAMP,
    registered_by VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    company VARCHAR(200) DEFAULT '',
    email VARCHAR(200) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    project VARCHAR(200) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Ativo',
    contract_value NUMERIC(12, 2),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;

  console.log("Tabelas OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
