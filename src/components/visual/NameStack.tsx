import { cn } from "@/lib/utils";

export function NameStack({
  name,
  className,
  align = "left",
  emphasize = "first",
}: {
  name: string;
  className?: string;
  align?: "left" | "right";
  emphasize?: "first" | "last";
}) {
  const parts = name.trim().split(/\s+/);
  const lead = parts[0] ?? "";
  const rest = parts.slice(1).join(" ");
  const leadMuted = emphasize === "last" && !!rest;

  return (
    <span
      className={cn(
        "font-display block leading-[0.9]",
        align === "right" && "text-right",
        className,
      )}
    >
      <span className={cn("block", leadMuted ? "text-ink-muted-soft" : "text-ink")}>
        {lead}
      </span>
      {rest ? (
        <span
          className={cn(
            "block",
            emphasize === "last" ? "text-ink" : "text-ink-muted-soft",
          )}
        >
          {rest}
        </span>
      ) : null}
    </span>
  );
}
