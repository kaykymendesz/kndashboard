import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/monitor/cron-auth";
import { runMonitorAndPersist, pruneOldMonitorLogs } from "@/lib/monitor/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron de monitoramento 24h.
 *
 * Vercel: configure CRON_SECRET e ver vercel.json
 * Externo (cron-job.org): GET/POST com header Authorization: Bearer SEU_CRON_SECRET
 *
 * Plano Hobby Vercel: cron limitado (~1x/dia). Para checks mais frequentes,
 * use cron-job.org apontando para esta URL a cada 15–30 min.
 */
export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await runMonitorAndPersist();
    await pruneOldMonitorLogs();
    return NextResponse.json({
      ok: true,
      checked: data.summary.total,
      summary: data.summary,
      lastRunAt: data.lastRunAt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Falha no cron de monitoramento",
      },
      { status: 500 }
    );
  }
}
