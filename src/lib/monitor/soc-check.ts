import type { MonitorCheckResult, MonitorServiceConfig, MonitorStatus } from "./types";
import { buildDiagnosis } from "./diagnosis";

type SocDiagItem = { ok: boolean; mensagem: string };

type SocDiagResponse = {
  ok?: boolean;
  error?: string;
  usuario?: string;
  empresaClienteAtiva?: string;
  modoTeste?: boolean;
  resultados?: {
    exportaDados?: SocDiagItem;
    licencaMedicaConsulta?: SocDiagItem;
    uploadArquivos?: SocDiagItem;
  };
  orientacao?: string;
};

/** Credenciais para chamar o diagnóstico SOC no Gestão Saúde (somente server-side). */
export function getGestaoSocMonitorEnv() {
  const baseUrl = (
    process.env.MONITOR_GESTAO_URL ?? "https://gestao-sa-de.vercel.app"
  )
    .trim()
    .replace(/\/$/, "");
  const cronSecret = process.env.MONITOR_GESTAO_CRON_SECRET?.trim();
  if (!cronSecret) return null;
  return { baseUrl, cronSecret };
}

function formatSocDetail(data: SocDiagResponse): string {
  const parts: string[] = [];
  if (data.empresaClienteAtiva) {
    parts.push(`empresa ${data.empresaClienteAtiva}${data.modoTeste ? " (teste)" : ""}`);
  }
  const r = data.resultados;
  if (r?.exportaDados) {
    parts.push(`Exporta: ${r.exportaDados.ok ? "OK" : "falha"} — ${r.exportaDados.mensagem}`);
  }
  if (r?.licencaMedicaConsulta) {
    parts.push(
      `Licença 1084: ${r.licencaMedicaConsulta.ok ? "OK" : "falha"} — ${r.licencaMedicaConsulta.mensagem}`
    );
  }
  if (r?.uploadArquivos) {
    parts.push(`SOCGED 611: ${r.uploadArquivos.ok ? "OK" : "falha"} — ${r.uploadArquivos.mensagem}`);
  }
  if (data.orientacao) parts.push(data.orientacao);
  return parts.join(" · ");
}

export async function checkGestaoSocApi(
  service: MonitorServiceConfig
): Promise<MonitorCheckResult> {
  const checkedAt = new Date().toISOString();
  const creds = getGestaoSocMonitorEnv();

  if (!creds) {
    const partial = {
      status: "nao_configurado" as MonitorStatus,
      httpStatus: null,
      responseTimeMs: null,
      errorMessage: null,
      technicalDetail:
        "MONITOR_GESTAO_CRON_SECRET não configurado na Vercel (use o mesmo valor de CRON_SECRET do Gestão Saúde)",
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
  const url = `${creds.baseUrl}/api/admin/soc-diagnostico`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${creds.cronSecret}` },
      cache: "no-store",
    });
    const ms = Date.now() - start;
    const text = await res.text();
    let data: SocDiagResponse = {};
    try {
      data = JSON.parse(text) as SocDiagResponse;
    } catch {
      data = { error: text.slice(0, 200) };
    }

    if (res.status === 401 || res.status === 403) {
      const partial = {
        status: "offline" as MonitorStatus,
        httpStatus: res.status,
        responseTimeMs: ms,
        errorMessage: data.error ?? "Não autorizado — confira MONITOR_GESTAO_CRON_SECRET",
        technicalDetail: data.error ?? text.slice(0, 200),
        checkedAt,
      };
      const diag = buildDiagnosis(service, partial);
      return { serviceId: service.id, ...partial, ...diag };
    }

    if (res.status === 503 || data.error === "SOC não configurado") {
      const partial = {
        status: "offline" as MonitorStatus,
        httpStatus: res.status,
        responseTimeMs: ms,
        errorMessage: data.error ?? "SOC não configurado no Gestão Saúde",
        technicalDetail: data.error ?? null,
        checkedAt,
      };
      const diag = buildDiagnosis(service, partial);
      return { serviceId: service.id, ...partial, ...diag };
    }

    if (!res.ok) {
      const partial = {
        status: "offline" as MonitorStatus,
        httpStatus: res.status,
        responseTimeMs: ms,
        errorMessage: data.error ?? `HTTP ${res.status}`,
        technicalDetail: formatSocDetail(data) || text.slice(0, 200),
        checkedAt,
      };
      const diag = buildDiagnosis(service, partial);
      return { serviceId: service.id, ...partial, ...diag };
    }

    const licencaOk = data.resultados?.licencaMedicaConsulta?.ok === true;
    const uploadOk = data.resultados?.uploadArquivos?.ok === true;
    const exportaOk = data.resultados?.exportaDados?.ok === true;
    const integracaoOk = data.ok === true && licencaOk && uploadOk;

    let status: MonitorStatus;
    if (!integracaoOk) {
      status = "offline";
    } else if (ms > (service.slowThresholdMs ?? 8000)) {
      status = "instavel";
    } else if (!exportaOk) {
      status = "instavel";
    } else {
      status = "online";
    }

    const errorMessage = integracaoOk
      ? !exportaOk
        ? "Exporta Dados com falha — licença e upload OK"
        : null
      : [
          !licencaOk ? "WS Licença Médica (1084) bloqueado" : null,
          !uploadOk ? "WS Upload / SOCGED (611) bloqueado" : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Integração SOC com falha";

    const partial = {
      status,
      httpStatus: res.status,
      responseTimeMs: ms,
      errorMessage,
      technicalDetail: formatSocDetail(data),
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
      plainSummary: integracaoOk
        ? exportaOk
          ? `Integração SOC operacional — licença 1084 e PDF 611 acessíveis (${ms} ms).`
          : `Licença e upload OK, mas Exporta Dados falhou — verifique cadastro de funcionários.`
        : data.orientacao ??
          "Um ou mais webservices SOC estão bloqueados — veja detalhes e tela 337 no SOC.",
      suggestedSteps: diag.suggestedSteps,
      technicalDetail: partial.technicalDetail,
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
