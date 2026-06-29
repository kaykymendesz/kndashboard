"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { logProposalExport } from "@/lib/actions/proposals";

export function PrintToolbar({ proposalId }: { proposalId: number }) {
  useEffect(() => {
    logProposalExport(proposalId, "pdf");
  }, [proposalId]);

  return (
    <div className="no-print sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-white/95 px-4 py-3 backdrop-blur">
      <p className="text-sm text-muted-foreground">
        Use Ctrl+P ou o botão abaixo para salvar como PDF.
      </p>
      <div className="flex gap-2">
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => window.close()}>
          <X className="h-4 w-4" /> Fechar
        </Button>
      </div>
    </div>
  );
}
