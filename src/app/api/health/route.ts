import { NextResponse } from "next/server";
import { getDatabaseUrl } from "@/lib/db/env";
import { neon } from "@neondatabase/serverless";

/** Health check público do próprio K&N Dashboard (usado pelo Painel Operacional). */
export async function GET() {
  const started = Date.now();
  try {
    const sql = neon(getDatabaseUrl());
    await sql`SELECT 1 AS ok`;
    return NextResponse.json({
      ok: true,
      service: "kn-dashboard",
      database: "connected",
      responseTimeMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        service: "kn-dashboard",
        database: "error",
        error: err instanceof Error ? err.message : "Erro desconhecido",
        responseTimeMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

export const dynamic = "force-dynamic";
