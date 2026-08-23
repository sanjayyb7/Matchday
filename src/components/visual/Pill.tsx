import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Pill({
  children,
  active = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center rounded-pill border-2 border-ink px-4 font-display text-chip transition-[transform,background-color,color] duration-[var(--duration-press)] ease-out",
        "active:scale-95",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-live",
        active ? "bg-ink text-paper" : "bg-paper text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
