import { cn } from "@/lib/utils";

/** Two stacked lines, one emphasised and one receding. Used for team names
 *  (the emphasis flip is what gives a fixture row its diagonal), for player
 *  names, and for page headlines where the second line is ghosted. */
export function NameStack({
  name,
  className,
  align = "left",
  emphasize = "first",
  tone = "ink",
}: {
  name: string;
  className?: string;
  align?: "left" | "right";
  emphasize?: "first" | "last";
  /** `ink` recedes to a tint of ink, for colour cards. `ghost` is the
   *  light grey used for the second line of a headline on white. */
  tone?: "ink" | "ghost";
}) {
  const parts = name.trim().split(/\s+/);
  const lead = parts[0] ?? "";
  const rest = parts.slice(1).join(" ");
  const recede = tone === "ghost" ? "text-ghost" : "text-ink-muted";
  const leadRecedes = emphasize === "last" && !!rest;

  return (
    <span
      className={cn(
        "font-display block",
        align === "right" && "text-right",
        className,
      )}
    >
      <span className={cn("block", leadRecedes ? recede : "text-ink")}>
        {lead}
      </span>
      {rest ? (
        <span className={cn("block", emphasize === "last" ? "text-ink" : recede)}>
          {rest}
        </span>
      ) : null}
    </span>
  );
}
