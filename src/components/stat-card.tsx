import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  accent?: "default" | "warning" | "success";
};

const accentStyles = {
  default: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  warning: {
    icon: "bg-amber-500/10 text-amber-600",
    value: "text-amber-700",
  },
  success: {
    icon: "bg-emerald-500/10 text-emerald-600",
    value: "text-emerald-700",
  },
};

export function StatCard({ title, value, description, icon: Icon, accent = "default" }: StatCardProps) {
  const styles = accentStyles[accent];
  const TrendIcon = accent === "warning" ? TrendingDown : accent === "success" ? TrendingUp : null;

  return (
    <Card className="kn-card group overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3 flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold tracking-tight tabular-nums", styles.value)}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                {description}
              </p>
            )}
          </div>
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105", styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MoneyStat({ title, amount, description, icon, accent }: Omit<StatCardProps, "value"> & { amount: number }) {
  return (
    <StatCard
      title={title}
      value={formatCurrency(amount)}
      description={description}
      icon={icon}
      accent={accent}
    />
  );
}
