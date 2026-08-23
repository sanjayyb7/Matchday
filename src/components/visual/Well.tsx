import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Well({
  children,
  filled = false,
  className,
}: {
  children?: ReactNode;
  filled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative size-14 overflow-hidden rounded-card border-[length:var(--border-well)]",
        filled
          ? "border-solid border-ink"
          : "border-dashed border-ink-muted-strong",
        className,
      )}
    >
      {children}
    </div>
  );
}
