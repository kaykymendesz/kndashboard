/** Tipos do Painel Operacional — leitura segura, sem segredos no front-end. */

export type MonitorServiceType =
  | "site"
  | "sistema"
  | "bot"
  | "api"
  | "banco"
  | "integracao"
  | "outro";

export type MonitorEnvironment = "producao" | "teste" | "desenvolvimento";

export type MonitorPriority = "critica" | "alta" | "media" | "baixa";

export type MonitorStatus = "online" | "instavel" | "offline" | "nao_configurado";

/** Como o servidor testa o serviço (somente no back-end). */
export type MonitorCheckKind = "http" | "internal_db" | "green_api";

export interface MonitorServiceConfig {
  /** Identificador único — use kebab-case, ex: gestao-saude */
  id: string;
  name: string;
  type: MonitorServiceType;
  environment: MonitorEnvironment;
  description?: string;
  /** Link para abrir o projeto (opcional). */
  projectUrl?: string;
  /** URL pública para teste HTTP (GET). Deixe vazio se usar internal_db. */
  healthCheckUrl?: string;
  checkKind?: MonitorCheckKind;
  priority: MonitorPriority;
  responsible?: string;
  /** false = não aparece no painel */
  enabled: boolean;
  /** Tempo máximo em ms antes de marcar instável (padrão 3000). */
  slowThresholdMs?: number;
  /** Timeout da requisição (padrão 12000). */
  timeoutMs?: number;
}

export interface MonitorCheckResult {
  serviceId: string;
  status: MonitorStatus;
  responseTimeMs: number | null;
  httpStatus: number | null;
  errorMessage: string | null;
  plainSummary: string;
  technicalDetail: string | null;
  suggestedSteps: string[];
  checkedAt: string;
}

export interface MonitorServiceView extends MonitorServiceConfig {
  status: MonitorStatus;
  lastCheck: MonitorCheckResult | null;
  recentChecks: MonitorCheckResult[];
}
