"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startAttendance } from "@/lib/actions/attendance";

export function StartAttendanceButton({
  caseId,
  clientSlug,
}: {
  caseId: number;
  clientSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await startAttendance(caseId, clientSlug);
            toast.success("Atendimento iniciado");
            router.push(`/atendimento/demandas/${caseId}`);
            router.refresh();
          } catch {
            toast.error("Erro ao iniciar atendimento");
          }
        });
      }}
    >
      <Play className="h-3 w-3" />
      Atender
    </Button>
  );
}
