import { db } from "@/lib/db";
import { monitorCheckLogs } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import type { MonitorCheckResult, MonitorServiceConfig, MonitorServiceView } from "./types";
import { getEnabledMonitorServices } from "./services.config";
import { runAllServiceChecks } from "./run-checks";

const HISTORY_PER_SERVICE = 8;

function sanitizeDbText(value: string | null | undefined, maxLen = 4000): string | null {
  if (value == null) return null;
  const clean = value
    .slice(0, maxLen)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return clean || null;
}

function rowToResult(row: typeof monitorCheckLogs.$inferSelect): MonitorCheckResult {
  return {
    serviceId: row.serviceId,
    status: row.status as MonitorCheckResult["status"],
    responseTimeMs: row.responseTimeMs,
    httpStatus: row.httpStatus,
    errorMessage: row.errorMessage,
    plainSummary: row.plainSummary,
    technicalDetail: row.technicalDetail,
    suggestedSteps: row.suggestedSteps ? (JSON.parse(row.suggestedSteps) as string[]) : [],
    checkedAt: row.checkedAt.toISOString(),
  };
}

export async function saveCheckResults(results: MonitorCheckResult[]) {
  if (results.length === 0) return;
  await db.insert(monitorCheckLogs).values(
    results.map((r) => ({
      serviceId: r.serviceId,
      status: r.status,
      responseTimeMs: r.responseTimeMs,
      httpStatus: r.httpStatus,
      errorMessage: sanitizeDbText(r.errorMessage, 500),
      plainSummary: sanitizeDbText(r.plainSummary, 2000) ?? "",
      technicalDetail: sanitizeDbText(r.technicalDetail),
      suggestedSteps: JSON.stringify(r.suggestedSteps),
      checkedAt: new Date(r.checkedAt),
    }))
  );
}

async function getRecentChecksForServices(serviceIds: string[]) {
  if (serviceIds.length === 0) return new Map<string, MonitorCheckResult[]>();

  const rows = await db
    .select()
    .from(monitorCheckLogs)
    .where(inArray(monitorCheckLogs.serviceId, serviceIds))
    .orderBy(desc(monitorCheckLogs.checkedAt))
    .limit(serviceIds.length * HISTORY_PER_SERVICE);

  const map = new Map<string, MonitorCheckResult[]>();
  for (const row of rows) {
    const list = map.get(row.serviceId) ?? [];
    if (list.length < HISTORY_PER_SERVICE) {
      list.push(rowToResult(row));
      map.set(row.serviceId, list);
    }
  }
  return map;
}

function mergeServiceView(
  config: MonitorServiceConfig,
  recent: MonitorCheckResult[]
): MonitorServiceView {
  return {
    ...config,
    status: recent[0]?.status ?? "nao_configurado",
    lastCheck: recent[0] ?? null,
    recentChecks: recent,
  };
}

export async function getMonitorDashboard(): Promise<{
  services: MonitorServiceView[];
  summary: { online: number; instavel: number; offline: number; naoConfigurado: number; total: number };
  lastRunAt: string | null;
}> {
  const configs = getEnabledMonitorServices();
  const ids = configs.map((c) => c.id);
  const recentMap = await getRecentChecksForServices(ids);

  const services = configs.map((c) => mergeServiceView(c, recentMap.get(c.id) ?? []));

  const summary = {
    online: services.filter((s) => s.status === "online").length,
    instavel: services.filter((s) => s.status === "instavel").length,
    offline: services.filter((s) => s.status === "offline").length,
    naoConfigurado: services.filter((s) => s.status === "nao_configurado").length,
    total: services.length,
  };

  const lastRunAt =
    services
      .map((s) => s.lastCheck?.checkedAt)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;

  return { services, summary, lastRunAt };
}

export async function runMonitorAndPersist(): Promise<Awaited<ReturnType<typeof getMonitorDashboard>> & { lastRunAt: string }> {
  const configs = getEnabledMonitorServices();
  const results = await runAllServiceChecks(configs);
  await saveCheckResults(results);

  const ids = configs.map((c) => c.id);
  const recentMap = await getRecentChecksForServices(ids);
  const services = configs.map((c) => mergeServiceView(c, recentMap.get(c.id) ?? []));

  const summary = {
    online: services.filter((s) => s.status === "online").length,
    instavel: services.filter((s) => s.status === "instavel").length,
    offline: services.filter((s) => s.status === "offline").length,
    naoConfigurado: services.filter((s) => s.status === "nao_configurado").length,
    total: services.length,
  };

  return {
    services,
    summary,
    lastRunAt: new Date().toISOString(),
  };
}

export async function pruneOldMonitorLogs(keepPerService = 50) {
  for (const config of getEnabledMonitorServices()) {
    const rows = await db
      .select({ id: monitorCheckLogs.id })
      .from(monitorCheckLogs)
      .where(eq(monitorCheckLogs.serviceId, config.id))
      .orderBy(desc(monitorCheckLogs.checkedAt));

    const toDelete = rows.slice(keepPerService);
    if (toDelete.length === 0) continue;
    for (const row of toDelete) {
      await db.delete(monitorCheckLogs).where(eq(monitorCheckLogs.id, row.id));
    }
  }
}
