import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/db/env";
import type { MonitorCheckResult, MonitorServiceConfig, MonitorStatus } from "./types";
import { buildDiagnosis } from "./diagnosis";
import { checkGreenWhatsApp } from "./green-check";
import { checkGestaoSocApi } from "./soc-check";

function resolveAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

function resolveHealthUrl(service: MonitorServiceConfig): string | null {
  if (service.checkKind === "internal_db") return null;
  if (service.id === "kn-dashboard") {
    return `${resolveAppOrigin()}/api/health`;
  }
  return service.healthCheckUrl?.trim() || null;
}

async function checkInternalDb(): Promise<{
  ok: boolean;
  ms: number;
  error: string | null;
}> {
  const start = Date.now();
  try {
    const sql = neon(getDatabaseUrl());
    await sql`SELECT 1 AS ok`;
    return { ok: true, ms: Date.now() - start, error: null };
  } catch (err) {
    return {
      ok: false,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function sanitizeSnippet(text: string, maxLen = 200): string {
  return text
    .slice(0, maxLen)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function checkHttpUrl(
  url: string,
  timeoutMs: number
): Promise<{
  ok: boolean;
  ms: number;
  httpStatus: number | null;
  error: string | null;
  bodySnippet: string | null;
}> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "application/json, text/html, */*" },
      cache: "no-store",
    });
    const ms = Date.now() - start;
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text().catch(() => "");
    const snippet =
      contentType.includes("image/") || contentType.includes("octet-stream")
        ? `Resposta binária (${contentType || "arquivo"})`
        : sanitizeSnippet(text);

    // Vercel status API
    if (url.includes("vercel-status.com")) {
      try {
        const json = JSON.parse(text) as { status?: { indicator?: string } };
        const indicator = json.status?.indicator ?? "unknown";
        const ok = indicator === "none" || indicator === "minor";
        return {
          ok,
          ms,
          httpStatus: res.status,
          error: ok ? null : `Vercel status: ${indicator}`,
          bodySnippet: snippet,
        };
      } catch {
        /* fall through */
      }
    }

    const ok =
      (res.status >= 200 && res.status < 400) ||
      res.status === 405 ||
      res.status === 401;
    return {
      ok,
      ms,
      httpStatus: res.status,
      error: ok ? null : `HTTP ${res.status}`,
      bodySnippet: snippet,
    };
  } catch (err) {
    const ms = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const error =
      message.includes("abort") || message.includes("Abort")
        ? `timeout após ${timeoutMs}ms`
        : message;
    return { ok: false, ms, httpStatus: null, error, bodySnippet: null };
  } finally {
    clearTimeout(timer);
  }
}

function deriveStatus(
  service: MonitorServiceConfig,
  ok: boolean,
  ms: number,
  configured: boolean
): MonitorStatus {
  if (!configured) return "nao_configurado";
  if (!ok) return "offline";
  if (ms > (service.slowThresholdMs ?? 3000)) return "instavel";
  return "online";
}

export async function runServiceCheck(service: MonitorServiceConfig): Promise<MonitorCheckResult> {
  if (service.checkKind === "green_api") {
    return checkGreenWhatsApp(service);
  }

  if (service.checkKind === "gestao_soc_api") {
    return checkGestaoSocApi(service);
  }

  const checkedAt = new Date().toISOString();
  const timeoutMs = service.timeoutMs ?? 12000;

  if (service.checkKind === "internal_db") {
    const db = await checkInternalDb();
    const status = deriveStatus(service, db.ok, db.ms, true);
    const partial = {
      status,
      httpStatus: db.ok ? 200 : 503,
      responseTimeMs: db.ms,
      errorMessage: db.error,
      technicalDetail: db.error,
      checkedAt,
    };
    const diag = buildDiagnosis(service, partial);
    return {
      serviceId: service.id,
      status,
      responseTimeMs: db.ms,
      httpStatus: db.ok ? 200 : 503,
      errorMessage: db.error,
      checkedAt,
      ...diag,
    };
  }

  const url = resolveHealthUrl(service);
  if (!url) {
    const partial = {
      status: "nao_configurado" as MonitorStatus,
      httpStatus: null,
      responseTimeMs: null,
      errorMessage: null,
      technicalDetail: null,
      checkedAt,
    };
    const diag = buildDiagnosis(service, partial);
    return {
      serviceId: service.id,
      status: "nao_configurado",
      responseTimeMs: null,
      httpStatus: null,
      errorMessage: null,
      checkedAt,
      ...diag,
    };
  }

  const http = await checkHttpUrl(url, timeoutMs);
  const status = deriveStatus(service, http.ok, http.ms, true);
  const partial = {
    status,
    httpStatus: http.httpStatus,
    responseTimeMs: http.ms,
    errorMessage: http.error,
    technicalDetail: [http.error, http.bodySnippet ? `Resposta: ${http.bodySnippet}` : null]
      .filter(Boolean)
      .join(" · "),
    checkedAt,
  };
  const diag = buildDiagnosis(service, partial);

  return {
    serviceId: service.id,
    status,
    responseTimeMs: http.ms,
    httpStatus: http.httpStatus,
    errorMessage: http.error,
    checkedAt,
    ...diag,
  };
}

export async function runAllServiceChecks(
  services: MonitorServiceConfig[]
): Promise<MonitorCheckResult[]> {
  const results: MonitorCheckResult[] = [];
  for (const service of services) {
    results.push(await runServiceCheck(service));
    // Pequena pausa entre checks para não sobrecarregar
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}
