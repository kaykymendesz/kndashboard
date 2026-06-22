import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  accent?: "default" | "warning" | "success";
};

const accentClasses = {
  default: "from-indigo-500/10 to-violet-500/10",
  warning: "from-amber-500/10 to-orange-500/10",
  success: "from-emerald-500/10 to-teal-500/10",
};

export function StatCard({ title, value, description, icon: Icon, accent = "default" }: StatCardProps) {
  return (
    <Card className={`bg-gradient-to-br ${accentClasses[accent]} border-0 shadow-sm`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
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
