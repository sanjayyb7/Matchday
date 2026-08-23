import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CtaBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 w-full items-center justify-center bg-ink px-4 text-center font-display text-chip tracking-[1.6px] text-paper",
        className,
      )}
    >
      {children}
    </div>
  );
}
