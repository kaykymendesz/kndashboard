"use client";

import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileToaster() {
  const isMobile = useIsMobile();

  return (
    <Toaster
      richColors
      position={isMobile ? "bottom-center" : "top-right"}
      toastOptions={
        isMobile
          ? {
              classNames: {
                toast: "max-md:mb-[env(safe-area-inset-bottom)]",
              },
            }
          : undefined
      }
    />
  );
}
