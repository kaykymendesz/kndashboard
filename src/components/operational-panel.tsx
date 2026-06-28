"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MonitorServiceView, MonitorStatus } from "@/lib/monitor/types";
import { formatAiDiagnosis, statusLabel } from "@/lib/monitor/diagnosis";

type DashboardData = {
  services: MonitorServiceView[];
  summary: {
    online: number;
    instavel: number;
    offline: number;
    naoConfigurado: number;
    total: number;
  };
  lastRunAt: string | null;
};

const STATUS_STYLES: Record<
  MonitorStatus,
  { badge: string; dot: string; icon: typeof CheckCircle2 }
> = {
  online: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  instavel: {
    badge: "bg-amber-500/10 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    icon: AlertTriangle,
  },
  offline: {
    badge: "bg-red-500/10 text-red-700 border-red-200",
    dot: "bg-red-500",
    icon: XCircle,
  },
  nao_configurado: {
    badge: "bg-slate-500/10 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    icon: HelpCircle,
  },
};

const TYPE_LABELS: Record<string, string> = {
  site: "Site",
  sistema: "Sistema",
  bot: "Bot WhatsApp",
  api: "API",
  banco: "Banco de dados",
  integracao: "Integração",
  outro: "Outro",
};

const ENV_LABELS: Record<string, string> = {
  producao: "Produção",
  teste: "Teste",
  desenvolvimento: "Desenvolvimento",
};

function formatRelative(iso: string | null) {
  if (!iso) return "Nunca verificado";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora mesmo";
  if (mins < 60) return `Há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Há ${hours}h`;
  return d.toLocaleString("pt-BR");
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "success" | "warning" | "danger" | "muted";
}) {
  const colors = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    muted: "text-muted-foreground",
  };
  return (
    <Card className="kn-card">
      <CardContent className="p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-3xl font-bold tabular-nums", colors[accent])}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ServiceCard({
  service,
  onCopyDiagnosis,
}: {
  service: MonitorServiceView;
  onCopyDiagnosis: (service: MonitorServiceView) => void;
}) {
  const [open, setOpen] = useState(false);
  const styles = STATUS_STYLES[service.status];
  const StatusIcon = styles.icon;
  const check = service.lastCheck;

  return (
    <Card
      className={cn(
        "kn-card overflow-hidden transition-shadow",
        service.status === "offline" && "ring-1 ring-red-200",
        service.status === "instavel" && "ring-1 ring-amber-200"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", styles.dot)} />
              <CardTitle className="text-base font-semibold truncate">{service.name}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px] font-normal">
                {TYPE_LABELS[service.type] ?? service.type}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-normal">
                {ENV_LABELS[service.environment] ?? service.environment}
              </Badge>
              {service.priority === "critica" && (
                <Badge className="text-[10px] bg-red-600/90">Crítico</Badge>
              )}
            </div>
          </div>
          <Badge className={cn("shrink-0 border", styles.badge)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusLabel(service.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {service.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Última verificação</p>
            <p className="font-medium mt-0.5">{formatRelative(check?.checkedAt ?? null)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Tempo resposta</p>
            <p className="font-medium mt-0.5">
              {check?.responseTimeMs != null ? `${check.responseTimeMs} ms` : "—"}
            </p>
          </div>
        </div>

        {check?.plainSummary && (
          <p
            className={cn(
              "text-sm leading-relaxed rounded-lg px-3 py-2",
              service.status === "offline"
                ? "bg-red-50 text-red-900"
                : service.status === "instavel"
                  ? "bg-amber-50 text-amber-900"
                  : "bg-muted/30 text-foreground"
            )}
          >
            {check.plainSummary}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {service.projectUrl && (
            <Button variant="outline" size="sm" className="h-9 text-xs" asChild>
              <a href={service.projectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Abrir
              </a>
            </Button>
          )}
          {check && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => onCopyDiagnosis(service)}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copiar diagnóstico IA
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs ml-auto"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <>
                Ocultar <ChevronUp className="h-3.5 w-3.5 ml-1" />
              </>
            ) : (
              <>
                Ver detalhes <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>

        {open && check && (
          <div className="rounded-lg border border-border bg-slate-50/80 p-3 text-xs space-y-2">
            {service.responsible && (
              <p>
                <span className="text-muted-foreground">Responsável:</span> {service.responsible}
              </p>
            )}
            {check.httpStatus != null && (
              <p>
                <span className="text-muted-foreground">HTTP:</span> {check.httpStatus}
              </p>
            )}
            {check.suggestedSteps.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1">Próximos passos:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  {check.suggestedSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {check.technicalDetail && (
              <pre className="whitespace-pre-wrap break-words text-[10px] text-muted-foreground bg-white rounded p-2 border">
                {check.technicalDetail}
              </pre>
            )}
            {service.recentChecks.length > 1 && (
              <div>
                <p className="text-muted-foreground mb-1">Histórico recente:</p>
                <ul className="space-y-1">
                  {service.recentChecks.slice(0, 5).map((h) => (
                    <li key={h.checkedAt} className="flex justify-between gap-2">
                      <span>{statusLabel(h.status)}</span>
                      <span className="text-muted-foreground">
                        {new Date(h.checkedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {h.responseTimeMs != null ? ` · ${h.responseTimeMs}ms` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OperationalPanel() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (run = false) => {
    if (run) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/monitor", { method: run ? "POST" : "GET" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar");
      setData(json);
      if (run) toast.success("Verificação concluída");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no painel");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  async function copyDiagnosis(service: MonitorServiceView) {
    if (!service.lastCheck) return;
    const text = formatAiDiagnosis(service, service.lastCheck);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Diagnóstico copiado — cole no ChatGPT ou Cursor");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const summary = data?.summary;

  return (
    <div className="kn-page space-y-6">
      <PageHeader
        title="Painel Operacional"
        description="Veja se Gestão Saúde, Dr Zuki, backup no Drive e outros serviços estão ok — linguagem simples."
        icon={Activity}
      >
        <Button
          onClick={() => void load(true)}
          disabled={refreshing || loading}
          className="min-h-11"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          {refreshing ? "Verificando..." : "Atualizar agora"}
        </Button>
      </PageHeader>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Online" value={summary.online} accent="success" />
          <SummaryCard label="Instável" value={summary.instavel} accent="warning" />
          <SummaryCard label="Offline" value={summary.offline} accent="danger" />
          <SummaryCard label="Não config." value={summary.naoConfigurado} accent="muted" />
        </div>
      )}

      {data?.lastRunAt && (
        <p className="text-xs text-muted-foreground text-center">
          Última rodada completa: {formatRelative(data.lastRunAt)}
        </p>
      )}

      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      )}

      {data && data.services.length === 0 && (
        <Card className="kn-card">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum serviço cadastrado. Edite{" "}
            <code className="text-xs bg-muted px-1 rounded">src/lib/monitor/services.config.ts</code>
          </CardContent>
        </Card>
      )}

      {data && data.services.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.services.map((service) => (
            <ServiceCard key={service.id} service={service} onCopyDiagnosis={copyDiagnosis} />
          ))}
        </div>
      )}

      <Card className="kn-card border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Monitoramento automático</p>
          <p>
            Configure <code className="bg-muted px-1 rounded">CRON_SECRET</code> na Vercel e use o cron
            em <code className="bg-muted px-1 rounded">/api/cron/monitor</code>. No plano Hobby, o cron da
            Vercel roda ~1x/dia — use também o botão &quot;Atualizar agora&quot; ou um serviço externo
            (ex: cron-job.org) para checks a cada 15–30 min.
          </p>
          <p>
            Para adicionar projetos: edite{" "}
            <code className="bg-muted px-1 rounded">src/lib/monitor/services.config.ts</code> e faça
            deploy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
