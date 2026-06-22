import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";

export async function POST(request: Request) {
  const key = request.headers.get("x-setup-key");
  if (!key || key !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(activities);
    const count = Number(existing[0]?.count ?? 0);

    if (count > 0) {
      return NextResponse.json({
        ok: true,
        message: `Banco já possui ${count} atividades. Seed ignorado.`,
      });
    }

    execSync("npx tsx scripts/seed.ts", {
      stdio: "pipe",
      env: process.env,
    });

    return NextResponse.json({ ok: true, message: "Tabelas populadas com dados da planilha." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(activities);
    const count = Number(existing[0]?.count ?? 0);
    return NextResponse.json({ ok: true, activities: count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
