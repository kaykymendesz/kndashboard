/** Dias antes do vencimento para considerar alerta "próximo". */
export const DUE_SOON_DAYS = 7;

export type DueDateUrgency = "overdue" | "due-soon" | "ok" | "none";

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntilDue(dueDate: Date | string | null | undefined): number | null {
  const due = toDate(dueDate);
  if (!due) return null;
  const diff = startOfDay(due).getTime() - startOfDay(new Date()).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function isDueDateActionable(status: string | null | undefined) {
  return status !== "Pago" && status !== "Cancelado";
}

export function getDueDateUrgency(
  dueDate: Date | string | null | undefined,
  status: string | null | undefined
): DueDateUrgency {
  if (!isDueDateActionable(status)) return "none";
  const days = daysUntilDue(dueDate);
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due-soon";
  return "ok";
}

export function dueDateLabel(dueDate: Date | string | null | undefined, status: string | null | undefined) {
  const days = daysUntilDue(dueDate);
  const urgency = getDueDateUrgency(dueDate, status);
  if (urgency === "none" || days === null) return null;
  if (urgency === "overdue") {
    const abs = Math.abs(days);
    return abs === 0 ? "Vence hoje" : `Vencido há ${abs} dia${abs === 1 ? "" : "s"}`;
  }
  if (urgency === "due-soon") {
    return days === 0 ? "Vence hoje" : `Vence em ${days} dia${days === 1 ? "" : "s"}`;
  }
  return null;
}
