import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, icon: Icon, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between max-md:gap-3", className)}>
      <div className="flex items-start gap-3 md:gap-4 min-w-0">
        {Icon && (
          <div className="kn-kpi-icon shrink-0 mt-0.5 max-md:h-9 max-md:w-9">
            <Icon className="h-5 w-5 max-md:h-4 max-md:w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight sm:text-3xl max-md:text-xl">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl leading-relaxed max-md:text-[13px]">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 max-md:w-full max-md:[&>*]:flex-1 max-md:[&_button]:w-full max-md:[&_button]:min-h-11">
          {children}
        </div>
      )}
    </div>
  );
}
