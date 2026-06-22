"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error.message || "Erro interno do servidor";

  return (
    <html lang="pt-BR">
      <body className="min-h-svh flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Algo deu errado</CardTitle>
            <CardDescription>
              O dashboard encontrou um erro ao carregar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground break-words">{message}</p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">Código: {error.digest}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={reset}>Tentar novamente</Button>
              <Button variant="outline" asChild>
                <a href="/login">Ir para login</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
