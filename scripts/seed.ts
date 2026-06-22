import "dotenv/config";
import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

type SpreadsheetData = Record<
  string,
  { columns: string[]; rows: string[][] }
>;

function parseBool(value: string) {
  return ["sim", "yes", "true", "1"].includes(value.toLowerCase().trim());
}

function parseDate(value: string): Date | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNum(value: string) {
  if (!value || !value.trim()) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

async function main() {
  const dataPath = path.resolve(process.cwd(), "data/spreadsheet_data.json");
  if (!fs.existsSync(dataPath)) {
    console.error("spreadsheet_data.json not found at", dataPath);
    process.exit(1);
  }

  const data: SpreadsheetData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log("Limpando tabelas...");
  await db.delete(schema.expenses);
  await db.delete(schema.activities);
  await db.delete(schema.scheduleItems);
  await db.delete(schema.projectInfo);
  await db.delete(schema.clients);

  console.log("Importando Dados do Projeto...");
  for (const row of data["Dados do Projeto"].rows) {
    const [section, field, value, notes] = row;
    if (!field?.trim()) continue;
    await db.insert(schema.projectInfo).values({
      section: section.trim(),
      field: field.trim(),
      value: value ?? "",
      notes: notes ?? "",
    });
  }

  console.log("Importando Atividades...");
  for (const row of data["Atividades"].rows) {
    const [externalId, area, feature, description, status, priority, responsible, notes] = row;
    if (!externalId?.trim()) continue;
    await db.insert(schema.activities).values({
      externalId: externalId.trim(),
      area: area ?? "",
      feature: feature ?? "",
      description: description ?? "",
      status: status ?? "A fazer",
      priority: priority ?? "Média",
      responsible: responsible ?? "",
      notes: notes ?? "",
    });
  }

  console.log("Importando Cronograma...");
  for (const row of data["Cronograma"].rows) {
    const [
      plannedDate,
      title,
      category,
      priority,
      status,
      plannedValue,
      actualValue,
      difference,
      responsible,
      notes,
    ] = row;
    if (!title?.trim()) continue;
    await db.insert(schema.scheduleItems).values({
      plannedDate: parseDate(plannedDate),
      title: title.trim(),
      category: category ?? "",
      priority: priority || "Média",
      status: status || "Planejado",
      plannedValue: plannedValue ? String(parseNum(plannedValue)) : null,
      actualValue: actualValue ? String(parseNum(actualValue)) : null,
      difference: difference ? String(parseNum(difference)) : null,
      responsible: responsible ?? "",
      notes: notes ?? "",
    });
  }

  console.log("Importando Gastos...");
  for (const row of data["Gastos"].rows) {
    const [
      ,
      description,
      category,
      vendor,
      purchaseDate,
      financialResponsible,
      totalValue,
      elaineShare,
      kaykyShare,
      isInstallment,
      installmentCount,
      installmentValue,
      paidInstallments,
      remainingInstallments,
      status,
      dueDate,
      paymentMethod,
      paidBy,
      elaineSettled,
      kaykySettled,
      elainePending,
      kaykyPending,
      linkedEmail,
      autoRenew,
      expirationDate,
      registeredBy,
    ] = row;
    if (!description?.trim()) continue;
    await db.insert(schema.expenses).values({
      description: description.trim(),
      category: category ?? "",
      vendor: vendor ?? "",
      purchaseDate: parseDate(purchaseDate),
      financialResponsible: financialResponsible ?? "",
      totalValue: String(parseNum(totalValue)),
      elaineShare: String(parseNum(elaineShare)),
      kaykyShare: String(parseNum(kaykyShare)),
      isInstallment: parseBool(isInstallment ?? "Não"),
      installmentCount: parseNum(installmentCount) || 1,
      installmentValue: String(parseNum(installmentValue)),
      paidInstallments: parseNum(paidInstallments),
      remainingInstallments: parseNum(remainingInstallments),
      status: status ?? "Pendente",
      dueDate: parseDate(dueDate),
      paymentMethod: paymentMethod ?? "",
      paidBy: paidBy ?? "",
      elaineSettled: parseBool(elaineSettled ?? ""),
      kaykySettled: parseBool(kaykySettled ?? ""),
      elainePending: String(parseNum(elainePending)),
      kaykyPending: String(parseNum(kaykyPending)),
      linkedEmail: linkedEmail ?? "",
      autoRenew: parseBool(autoRenew ?? ""),
      expirationDate: parseDate(expirationDate),
      registeredBy: registeredBy ?? "",
    });
  }

  console.log("Seed concluído com sucesso!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
