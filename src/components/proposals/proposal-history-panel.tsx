"use client";

import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProposalExport, ProposalVersion } from "@/lib/db/schema";

export function ProposalHistoryPanel({
  versions,
  exports: exportRows,
}: {
  versions: ProposalVersion[];
  exports: ProposalExport[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="kn-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Versões salvas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma versão registrada.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="border-b pb-2 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">v{v.versionNumber}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(v.createdAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {v.createdBy || "Sistema"} — {v.changeNote || "Alteração"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="kn-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Exportações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto">
          {exportRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma exportação registrada.</p>
          ) : (
            exportRows.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
                <div>
                  <Badge variant="outline" className="uppercase text-[10px]">
                    {e.format}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    v{e.versionNumber ?? "—"} · {e.createdBy || "Sistema"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
