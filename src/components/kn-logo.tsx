import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function KnLogo({ size = 44, className, showText = false, subtitle, titleClassName, subtitleClassName }: Props) {
  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <Image
        src="/kn-logo.png"
        alt="K&N"
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
        priority
      />
      {showText && (
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold leading-tight truncate", titleClassName)}>K&N Dashboard</p>
          {subtitle && (
            <p className={cn("text-[11px] text-muted-foreground truncate", subtitleClassName)}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
