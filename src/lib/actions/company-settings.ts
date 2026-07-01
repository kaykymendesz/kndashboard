"use server";

import { db } from "@/lib/db";
import {
  catalogExclusiveCosts,
  catalogInfrastructure,
  catalogLabor,
  companySettings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ProfitDistributionConfig } from "@/lib/erp-v2/financial";
import { getCompanySetting, getProfitDistribution } from "@/lib/erp-v2/financial";

export async function getErpCompanySettings() {
  const [profitDistribution, companyProfile, catalogs] = await Promise.all([
    getProfitDistribution(),
    getCompanySetting("company_profile", { name: "K&N Tecnologia", city: "São Paulo - SP", cnpj: "67.529.522/0001-56" }),
    Promise.all([
      db.select().from(catalogInfrastructure).orderBy(catalogInfrastructure.sortOrder),
      db.select().from(catalogLabor).orderBy(catalogLabor.sortOrder),
      db.select().from(catalogExclusiveCosts).orderBy(catalogExclusiveCosts.sortOrder),
    ]).then(([infra, labor, exclusive]) => ({ infra, labor, exclusive })),
  ]);

  return { profitDistribution, companyProfile, catalogs };
}

async function upsertSetting(key: string, value: object) {
  await db
    .insert(companySettings)
    .values({ key, value: JSON.stringify(value), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: companySettings.key,
      set: { value: JSON.stringify(value), updatedAt: new Date() },
    });
}

export async function saveProfitDistribution(config: ProfitDistributionConfig) {
  const total =
    config.companyPercent +
    config.partners.reduce((s, p) => s + p.percent, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new Error("A soma dos percentuais deve ser 100%");
  }
  await upsertSetting("profit_distribution", config);
  revalidatePath("/configuracoes");
  revalidatePath("/gestao");
}

export async function saveCompanyProfile(profile: { name: string; city: string; cnpj?: string }) {
  await upsertSetting("company_profile", profile);
  revalidatePath("/configuracoes");
}

type CatalogType = "infra" | "labor" | "exclusive";

export async function saveCatalogItem(
  type: CatalogType,
  id: number | null,
  data: Record<string, string | boolean | number>
) {
  const table =
    type === "infra" ? catalogInfrastructure : type === "labor" ? catalogLabor : catalogExclusiveCosts;

  const payload = {
    ...data,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(table).set(payload).where(eq(table.id, id));
  } else {
    await db.insert(table).values(payload as typeof catalogInfrastructure.$inferInsert);
  }

  revalidatePath("/configuracoes");
}

export async function toggleCatalogItem(type: CatalogType, id: number, active: boolean) {
  const table =
    type === "infra" ? catalogInfrastructure : type === "labor" ? catalogLabor : catalogExclusiveCosts;
  await db.update(table).set({ active, updatedAt: new Date() }).where(eq(table.id, id));
  revalidatePath("/configuracoes");
}
