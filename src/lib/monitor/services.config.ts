/**
 * ═══════════════════════════════════════════════════════════════════
 *  CADASTRO DE SERVIÇOS — edite este arquivo para adicionar projetos
 * ═══════════════════════════════════════════════════════════════════
 *
 * Monitoramento 24h: CRON_SECRET na Vercel → /api/cron/monitor (1x/dia no Hobby)
 * Green API (Dr Zuki): MONITOR_GREEN_* na Vercel (somente leitura, server-side)
 * SOC (Gestão Saúde): MONITOR_GESTAO_CRON_SECRET = mesmo CRON_SECRET do Gestão Saúde
 *
 * NÃO coloque senhas, tokens ou chaves de API neste arquivo.
 */
import type { MonitorServiceConfig } from "./types";

const KN_URL = "https://kndashboard-rho.vercel.app";
const GESTAO_URL = "https://gestao-sa-de.vercel.app";

export const MONITOR_SERVICES: MonitorServiceConfig[] = [
  {
    id: "kn-dashboard",
    name: "K&N Dashboard",
    type: "sistema",
    environment: "producao",
    description: "Este painel — gestão interna K&N.",
    projectUrl: KN_URL,
    checkKind: "http",
    priority: "critica",
    responsible: "Kayky",
    enabled: true,
  },
  {
    id: "gestao-saude",
    name: "Gestão Saúde",
    type: "sistema",
    environment: "producao",
    description: "Sistema de saúde ocupacional (Corp Services). Se estiver offline, equipe não acessa processos e atestados.",
    projectUrl: GESTAO_URL,
    healthCheckUrl: `${GESTAO_URL}/login`,
    priority: "critica",
    responsible: "Kayky",
    enabled: true,
    slowThresholdMs: 5000,
  },
  {
    id: "gestao-backup-drive",
    name: "Backup Gestão Saúde (Drive)",
    type: "integracao",
    environment: "producao",
    description: "Excel semanal com processos e atestados — pasta do Google Drive. Toda segunda substitui o mesmo arquivo.",
    projectUrl: "https://drive.google.com/drive/folders/1nJEn0hr7tipd9xkU00qxxJ106SOHqjDf",
    healthCheckUrl:
      "https://script.google.com/macros/s/AKfycbw-ZPwsPO60u-Y6PR9JhIaMQYxwiktB2qdsHT3DO_m7I7KvNcbJy004KJS1cp8LnBVtMw/exec",
    priority: "alta",
    responsible: "Kayky",
    enabled: true,
  },
  {
    id: "dr-zuki-whatsapp",
    name: "Dr Zuki — WhatsApp (Green API)",
    type: "bot",
    environment: "producao",
    description: "Bot de atestados no WhatsApp. Se cair, colaborador manda foto e não recebe resposta.",
    projectUrl: `${GESTAO_URL}/atestados-zuki`,
    checkKind: "green_api",
    priority: "critica",
    responsible: "Kayky",
    enabled: true,
  },
  {
    id: "kn-database",
    name: "Banco K&N (Neon)",
    type: "banco",
    environment: "producao",
    description: "PostgreSQL do dashboard K&N.",
    checkKind: "internal_db",
    priority: "critica",
    responsible: "Kayky",
    enabled: true,
  },
  {
    id: "vercel-hospedagem",
    name: "Hospedagem Vercel",
    type: "integracao",
    environment: "producao",
    description: "Status global da plataforma Vercel.",
    projectUrl: "https://www.vercel-status.com",
    healthCheckUrl: "https://www.vercel-status.com/api/v2/status.json",
    priority: "media",
    responsible: "Kayky",
    enabled: true,
  },
  {
    id: "cloudinary",
    name: "Cloudinary (arquivos)",
    type: "integracao",
    environment: "producao",
    description: "CDN de laudos e PDFs (Gestão Saúde e outros).",
    projectUrl: "https://cloudinary.com",
    healthCheckUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    priority: "media",
    responsible: "Kayky",
    enabled: true,
  },
  {
    id: "soc-integracao-gestao",
    name: "SOC — integração API (Gestão)",
    type: "api",
    environment: "producao",
    description:
      "Webservices SOC via Gestão Saúde: Licença Médica (1084), PDF no SOCGED (611) e Exporta Dados. Não monitora tela 726 (INSS).",
    projectUrl: "https://sistema.soc.com.br",
    checkKind: "gestao_soc_api",
    priority: "critica",
    responsible: "Kayky",
    enabled: true,
    slowThresholdMs: 8000,
    timeoutMs: 60000,
  },
];

export function getEnabledMonitorServices(): MonitorServiceConfig[] {
  const order: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };
  return MONITOR_SERVICES.filter((s) => s.enabled).sort(
    (a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9)
  );
}
