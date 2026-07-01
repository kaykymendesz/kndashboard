import type { MonitorCheckResult, MonitorServiceConfig, MonitorStatus } from "./types";

export function buildDiagnosis(
  service: MonitorServiceConfig,
  partial: Pick<
    MonitorCheckResult,
    "status" | "httpStatus" | "responseTimeMs" | "errorMessage" | "technicalDetail" | "checkedAt"
  >
): Pick<MonitorCheckResult, "plainSummary" | "suggestedSteps" | "technicalDetail"> {
  const { status, httpStatus, responseTimeMs, errorMessage, technicalDetail, checkedAt } = partial;
  const when = new Date(checkedAt).toLocaleString("pt-BR");

  if (status === "nao_configurado") {
    const isSoc = service.checkKind === "gestao_soc_api";
    return {
      plainSummary: isSoc
        ? `${service.name}: configure MONITOR_GESTAO_CRON_SECRET na Vercel do K&N Dashboard (mesmo valor de CRON_SECRET do Gestão Saúde).`
        : `${service.name} ainda não tem URL de teste configurada.`,
      suggestedSteps: isSoc
        ? [
            "Vercel → kndashboard → Settings → Environment Variables",
            "Adicione MONITOR_GESTAO_CRON_SECRET com o mesmo valor de CRON_SECRET do projeto gestao-sa-de",
            "Faça redeploy e clique em Atualizar no painel",
          ]
        : [
            "Quando a integração estiver pronta, adicione healthCheckUrl em src/lib/monitor/services.config.ts",
            "Faça deploy e clique em Atualizar no painel",
          ],
      technicalDetail: technicalDetail ?? null,
    };
  }

  if (status === "online") {
    const slow =
      responseTimeMs != null &&
      responseTimeMs > (service.slowThresholdMs ?? 3000)
        ? " Resposta um pouco lenta, mas funcionando."
        : "";
    return {
      plainSummary: `${service.name} respondeu normalmente (${responseTimeMs ?? "?"} ms).${slow}`,
      suggestedSteps: ["Nenhuma ação necessária. Continue monitorando."],
      technicalDetail:
        technicalDetail ??
        `HTTP ${httpStatus ?? "OK"} · ${responseTimeMs ?? "?"} ms · ${when}`,
    };
  }

  if (status === "instavel") {
    return {
      plainSummary: `${service.name} respondeu, mas está lento ou instável (${responseTimeMs ?? "?"} ms). Pode afetar usuários no celular.`,
      suggestedSteps: [
        "Aguarde 5 minutos e clique em Atualizar no painel",
        "Se persistir: abra o projeto na Vercel → Deployments → verifique o último deploy",
        "Confira variáveis de ambiente (DATABASE_URL, AUTH_SECRET, etc.)",
      ],
      technicalDetail:
        technicalDetail ??
        `HTTP ${httpStatus ?? "?"} · ${responseTimeMs ?? "?"} ms · ${errorMessage ?? ""}`,
    };
  }

  // offline
  const cause =
    httpStatus === 500
      ? "erro 500 no servidor"
      : httpStatus === 404
        ? "página ou rota não encontrada (404)"
        : httpStatus === 403
          ? "acesso negado (403)"
          : errorMessage?.includes("timeout")
            ? "tempo esgotado — servidor não respondeu a tempo"
            : errorMessage?.includes("fetch failed")
              ? "falha de rede ou DNS"
              : errorMessage ?? "falha desconhecida";

  const steps = getStepsForService(service, httpStatus, cause);

  return {
    plainSummary: `${service.name} não respondeu corretamente nos últimos testes. Possível causa: ${cause}.`,
    suggestedSteps: steps,
    technicalDetail:
      technicalDetail ??
      [errorMessage, httpStatus != null ? `HTTP ${httpStatus}` : null, when].filter(Boolean).join(" · "),
  };
}

function getStepsForService(
  service: MonitorServiceConfig,
  httpStatus: number | null,
  cause: string
): string[] {
  const base = [
    "Abra o painel da Vercel do projeto → Logs → filtre erros recentes",
    "Confira se o último deploy foi bem-sucedido",
    "Verifique variáveis de ambiente na Vercel (Settings → Environment Variables)",
  ];

  if (service.type === "banco") {
    return [
      "Acesse console.neon.tech e verifique se o banco está ativo",
      "Confirme DATABASE_URL na Vercel",
      ...base,
    ];
  }

  if (service.type === "bot") {
    return [
      "Green API: console.green-api.com → instância authorized?",
      "Painel Dr Zuki → Ativar webhook",
      ...base,
    ];
  }

  if (service.checkKind === "gestao_soc_api") {
    return [
      "Gestão Saúde → Atestados → verifique último envio SOC",
      "SOC tela 337: WS Licença Médica + Upload de Arquivos habilitados para o usuário de integração",
      "Confirme variáveis SOC_* na Vercel do Gestão Saúde (empresa RZ, sem modo teste)",
      "Vercel gestao-sa-de → Logs → filtre erros [soc:]",
      ...base,
    ];
  }

  if (httpStatus === 404) {
    return [
      "Confira se a URL em services.config.ts está correta",
      "O deploy pode ter mudado rotas — teste a URL no navegador",
      ...base,
    ];
  }

  return base;
}

export function formatAiDiagnosis(
  service: MonitorServiceConfig,
  check: MonitorCheckResult
): string {
  return [
    "# Diagnóstico K&N — Painel Operacional",
    "",
    `Serviço: ${service.name}`,
    `Tipo: ${service.type} · Ambiente: ${service.environment}`,
    `Prioridade: ${service.priority}`,
    service.responsible ? `Responsável: ${service.responsible}` : "",
    "",
    `Status: ${statusLabel(check.status)}`,
    `Última verificação: ${new Date(check.checkedAt).toLocaleString("pt-BR")}`,
    check.responseTimeMs != null ? `Tempo de resposta: ${check.responseTimeMs} ms` : "",
    check.httpStatus != null ? `HTTP: ${check.httpStatus}` : "",
    "",
    "## Resumo",
    check.plainSummary,
    "",
    check.errorMessage ? `## Erro\n${check.errorMessage}` : "",
    "",
    "## Próximos passos sugeridos",
    ...check.suggestedSteps.map((s, i) => `${i + 1}. ${s}`),
    "",
    check.technicalDetail ? `## Detalhes técnicos\n${check.technicalDetail}` : "",
    "",
    service.projectUrl ? `Link do projeto: ${service.projectUrl}` : "",
    "",
    "---",
    "Cole este texto no ChatGPT ou Cursor para ajuda na correção.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function statusLabel(status: MonitorStatus): string {
  switch (status) {
    case "online":
      return "Online";
    case "instavel":
      return "Instável";
    case "offline":
      return "Offline";
    case "nao_configurado":
      return "Não configurado";
  }
}
