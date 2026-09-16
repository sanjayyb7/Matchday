"use client";

import { cn } from "@/lib/utils";

export function SegmentedTabs<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "flex overflow-hidden rounded-pill border-2 border-ink bg-paper",
        className,
      )}
    >
      {options.map((item) => {
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center rounded-pill px-4 font-display text-chip",
              "transition-colors duration-[var(--dur-press)] ease-[var(--ease-out)]",
              isActive ? "bg-ink text-paper" : "text-ink-muted",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
