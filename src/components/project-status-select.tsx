"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProjectStatus } from "@/lib/actions/projects";
import { PROJECT_LIFECYCLE_STATUSES } from "@/lib/db/schema";

type Props = {
  projectId: number;
  currentStatus: string;
  isClientProject: boolean;
};

export function ProjectStatusSelect({ projectId, currentStatus, isClientProject }: Props) {
  const [pending, startTransition] = useTransition();

  if (!isClientProject) {
    return <span className="text-sm text-muted-foreground">{currentStatus}</span>;
  }

  return (
    <Select
      value={currentStatus}
      disabled={pending}
      onValueChange={(status) =>
        startTransition(async () => {
          try {
            await updateProjectStatus(projectId, status);
            toast.success(`Status atualizado para ${status}`);
          } catch {
            toast.error("Erro ao atualizar status");
          }
        })
      }
    >
      <SelectTrigger className="w-[220px] h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJECT_LIFECYCLE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
