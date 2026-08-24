import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small uppercase label. Utility face at 600 — never the display face, which
 *  turns into a solid bar of ink at this size. */
export function MicroLabel({
  children,
  className,
  tone = "muted",
}: {
  children: ReactNode;
  className?: string;
  tone?: "muted" | "ink" | "paper";
}) {
  return (
    <span
      className={cn(
        "micro-label",
        tone === "muted" && "text-ink-label",
        tone === "ink" && "text-ink",
        tone === "paper" && "text-paper",
        className,
      )}
    >
      {children}
    </span>
  );
}
