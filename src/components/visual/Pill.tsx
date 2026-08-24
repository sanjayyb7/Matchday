import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bordered pill. Active is a solid ink fill. The label is the utility face —
 *  at this size the display face reads as a solid bar. */
export function Pill({
  children,
  active = false,
  mark,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  /** Optional leading mark. */
  mark?: ReactNode;
}) {
  return (
    <button
      type={type}
      className={cn(
        "press-pill focus-visible-live inline-flex shrink-0 items-center gap-2 rounded-pill",
        "min-h-[var(--pill-min)] border-[length:var(--border-ink)] border-ink px-4",
        "font-utility text-tab font-semibold uppercase tracking-[var(--micro-tracking)]",
        "transition-[transform,background-color,color]",
        active ? "bg-ink text-paper" : "bg-paper text-ink",
        className,
      )}
      {...props}
    >
      {mark ? (
        <span aria-hidden className="flex shrink-0 items-center">
          {mark}
        </span>
      ) : null}
      {children}
    </button>
  );
}
