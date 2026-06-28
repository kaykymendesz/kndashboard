import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMonitorDashboard, runMonitorAndPersist, pruneOldMonitorLogs } from "@/lib/monitor/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET — estado atual (últimas verificações salvas). POST — rodar verificação agora. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await getMonitorDashboard();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao carregar painel" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const data = await runMonitorAndPersist();
    await pruneOldMonitorLogs();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao verificar serviços" },
      { status: 500 }
    );
  }
}
