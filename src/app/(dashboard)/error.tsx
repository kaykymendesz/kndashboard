"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDbError =
    error.message.includes("relation") ||
    error.message.includes("does not exist") ||
    error.message.includes("DATABASE_URL") ||
    error.message.includes("commercial_proposals");

  const isAuthError = error.message.includes("AUTH_SECRET");

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Erro ao carregar</CardTitle>
          <CardDescription>
            {isAuthError && "Falta configurar AUTH_SECRET no Vercel."}
            {isDbError && "O banco de dados ainda não foi inicializado."}
            {!isAuthError && !isDbError && "Ocorreu um erro inesperado."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDbError && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="font-medium">Execute no seu computador:</p>
              <code className="block text-xs">npm run db:push</code>
              <code className="block text-xs">npm run db:seed</code>
              <p className="text-muted-foreground text-xs mt-2">
                Use a DATABASE_URL de produção no .env.local antes de rodar.
              </p>
            </div>
          )}
          {isAuthError && (
            <div className="rounded-md bg-muted p-3 text-sm">
              Vercel → Settings → Environment Variables → adicione{" "}
              <code className="text-xs">AUTH_SECRET</code> e faça Redeploy.
            </div>
          )}
          <p className="text-xs text-muted-foreground break-words">{error.message}</p>
          <div className="flex gap-2">
            <Button onClick={reset}>Tentar novamente</Button>
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
