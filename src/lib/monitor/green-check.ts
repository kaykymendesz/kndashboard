import type { MonitorCheckResult, MonitorServiceConfig, MonitorStatus } from "./types";
import { buildDiagnosis } from "./diagnosis";

/** Credenciais Green API — só via variáveis de ambiente (nunca no front-end). */
export function getGreenMonitorEnv() {
  const apiUrl = (
    process.env.MONITOR_GREEN_API_URL ??
    process.env.GREEN_API_URL ??
    "https://api.green-api.com"
  )
    .trim()
    .replace(/\/$/, "");
  const idInstance = process.env.MONITOR_GREEN_ID_INSTANCE?.trim();
  const apiToken = process.env.MONITOR_GREEN_API_TOKEN?.trim();
  if (!idInstance || !apiToken) return null;
  return { apiUrl, idInstance, apiToken };
}

export async function checkGreenWhatsApp(
  service: MonitorServiceConfig
): Promise<MonitorCheckResult> {
  const checkedAt = new Date().toISOString();
  const creds = getGreenMonitorEnv();

  if (!creds) {
    const partial = {
      status: "nao_configurado" as MonitorStatus,
      httpStatus: null,
      responseTimeMs: null,
      errorMessage: null,
      technicalDetail: "MONITOR_GREEN_ID_INSTANCE e MONITOR_GREEN_API_TOKEN não configurados na Vercel",
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

  const start = Date.now();
  const url = `${creds.apiUrl}/waInstance${creds.idInstance}/getStateInstance/${creds.apiToken}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const ms = Date.now() - start;
    const text = await res.text();
    let state = "desconhecido";
    try {
      const json = JSON.parse(text) as { stateInstance?: string };
      state = json.stateInstance ?? state;
    } catch {
      /* ignore */
    }

    const authorized = state === "authorized";
    const ok = res.ok && authorized;
    const status: MonitorStatus = !res.ok
      ? "offline"
      : authorized
        ? ms > (service.slowThresholdMs ?? 3000)
          ? "instavel"
          : "online"
        : state === "starting"
          ? "instavel"
          : "offline";

    const errorMessage = ok
      ? null
      : !res.ok
        ? `HTTP ${res.status}`
        : `WhatsApp ${state} — escaneie QR no console Green API`;

    const partial = {
      status,
      httpStatus: res.status,
      responseTimeMs: ms,
      errorMessage,
      technicalDetail: `Green API stateInstance=${state}`,
      checkedAt,
    };
    const diag = buildDiagnosis(service, partial);

    return {
      serviceId: service.id,
      status,
      responseTimeMs: ms,
      httpStatus: res.status,
      errorMessage,
      checkedAt,
      ...diag,
    };
  } catch (err) {
    const ms = Date.now() - start;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const partial = {
      status: "offline" as MonitorStatus,
      httpStatus: null,
      responseTimeMs: ms,
      errorMessage,
      technicalDetail: errorMessage,
      checkedAt,
    };
    const diag = buildDiagnosis(service, partial);
    return {
      serviceId: service.id,
      status: "offline",
      responseTimeMs: ms,
      httpStatus: null,
      errorMessage,
      checkedAt,
      ...diag,
    };
  }
}
