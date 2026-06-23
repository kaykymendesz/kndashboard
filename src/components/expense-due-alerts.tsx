"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DUE_SOON_DAYS,
  dueDateLabel,
  getDueDateUrgency,
  type DueDateUrgency,
} from "@/lib/expense-due-date";
import { formatCurrency, formatDate } from "@/lib/format";

export type ExpenseDueAlertItem = {
  id: number;
  description: string;
  dueDate: Date | null;
  status: string | null;
  totalValue: string | null;
};

function sortByUrgency(a: ExpenseDueAlertItem, b: ExpenseDueAlertItem) {
  const order: Record<DueDateUrgency, number> = { overdue: 0, "due-soon": 1, ok: 2, none: 3 };
  const ua = getDueDateUrgency(a.dueDate, a.status);
  const ub = getDueDateUrgency(b.dueDate, b.status);
  if (order[ua] !== order[ub]) return order[ua] - order[ub];
  return (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0);
}

export function getExpenseDueAlerts(items: ExpenseDueAlertItem[]) {
  return items
    .filter((item) => {
      const urgency = getDueDateUrgency(item.dueDate, item.status);
      return urgency === "overdue" || urgency === "due-soon";
    })
    .sort(sortByUrgency);
}

type Props = {
  items: ExpenseDueAlertItem[];
};

export function ExpenseDueAlerts({ items }: Props) {
  const alerts = getExpenseDueAlerts(items);
  const overdueCount = alerts.filter((a) => getDueDateUrgency(a.dueDate, a.status) === "overdue").length;
  const soonCount = alerts.length - overdueCount;

  useEffect(() => {
    if (alerts.length === 0) return;

    const key = `kn-gastos-due-alert-${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const parts: string[] = [];
    if (overdueCount > 0) {
      parts.push(`${overdueCount} gasto${overdueCount === 1 ? "" : "s"} vencido${overdueCount === 1 ? "" : "s"}`);
    }
    if (soonCount > 0) {
      parts.push(
        `${soonCount} vence${soonCount === 1 ? "" : "m"} nos próximos ${DUE_SOON_DAYS} dias`
      );
    }

    toast.warning(`Atenção: ${parts.join(" · ")}`, {
      description: "Confira os vencimentos na lista abaixo.",
      duration: 9000,
    });
  }, [alerts.length, overdueCount, soonCount]);

  if (alerts.length === 0) return null;

  return (
    <Card
      className={
        overdueCount > 0
          ? "border-destructive/40 bg-destructive/5 mt-4"
          : "border-amber-500/40 bg-amber-500/5 mt-4"
      }
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={
              overdueCount > 0
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700"
            }
          >
            {overdueCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="font-semibold text-sm">
                {overdueCount > 0 ? "Vencimentos em atraso" : "Vencimentos próximos"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueCount > 0 && (
                  <span className="text-destructive font-medium">
                    {overdueCount} vencido{overdueCount === 1 ? "" : "s"}
                  </span>
                )}
                {overdueCount > 0 && soonCount > 0 && " · "}
                {soonCount > 0 && (
                  <span className="text-amber-700 font-medium">
                    {soonCount} nos próximos {DUE_SOON_DAYS} dias
                  </span>
                )}
              </p>
            </div>

            <ul className="space-y-2">
              {alerts.slice(0, 5).map((item) => {
                const urgency = getDueDateUrgency(item.dueDate, item.status);
                const label = dueDateLabel(item.dueDate, item.status);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/gastos/${item.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/30 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Vencimento: {formatDate(item.dueDate)} · {formatCurrency(item.totalValue)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {label && (
                          <Badge
                            variant={urgency === "overdue" ? "destructive" : "outline"}
                            className={
                              urgency === "due-soon"
                                ? "border-amber-500 text-amber-700 bg-amber-500/10"
                                : undefined
                            }
                          >
                            {label}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {alerts.length > 5 && (
              <p className="text-xs text-muted-foreground">
                + {alerts.length - 5} outro{alerts.length - 5 === 1 ? "" : "s"} na tabela abaixo
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
