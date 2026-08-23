"use client";

import { motion, useReducedMotion } from "framer-motion";
import { getTeam } from "@/lib/mock/data";
import { formatPlayerLabel, isGoalkeeper } from "@/lib/squad/formation";
import { useMatchdayStore } from "@/store/matchday-store";
import { color } from "@/lib/theme/tokens";
import type { Player } from "@/types";
import { cn } from "@/lib/utils";

interface FormationPlayerCardProps {
  player: Player;
  isPresent: boolean;
  fanCount?: number;
  inverted?: boolean;
  compact?: boolean;
}

export function FormationPlayerCard({
  player,
  isPresent,
  fanCount = 0,
  inverted = false,
  compact = false,
}: FormationPlayerCardProps) {
  const reduced = useReducedMotion() ?? false;
  const team = getTeam(player.teamId);
  const identity = useMatchdayStore((s) => s.identity);
  const setSelectedPlayerProfile = useMatchdayStore(
    (s) => s.setSelectedPlayerProfile,
  );

  const teamColor = team?.color ?? color.lime;
  const label = formatPlayerLabel(player.name);
  const gk = isGoalkeeper(player);
  const flip = inverted || gk;
  const size = compact ? "h-11 w-11" : "h-14 w-14";
  const isYou = identity?.playerId === player.id;

  return (
    <motion.button
      type="button"
      onClick={() => setSelectedPlayerProfile(player)}
      whileTap={reduced ? undefined : { scale: 0.95 }}
      className={cn(
        "group relative flex min-h-11 flex-col items-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-live",
        compact ? "gap-0.5" : "gap-1.5",
      )}
    >
      {isPresent ? (
        <div
          className={cn("relative rounded-full", size, flip && "order-2")}
          style={{
            backgroundColor: teamColor,
            boxShadow: isYou
              ? `0 0 0 3px ${color.paper}, 0 0 0 6px ${color.ink}`
              : `0 0 0 3px ${color.ink}`,
          }}
        >
          {fanCount > 1 && (
            <span className="absolute -right-1 -top-1 z-10 rounded-pill bg-ink px-1 py-0.5 font-display text-[9px] leading-none text-paper">
              ×{fanCount}
            </span>
          )}
          <span className="absolute -bottom-1 left-1/2 z-10 flex h-4 min-w-4 -translate-x-1/2 items-center justify-center rounded-pill bg-ink px-1 font-display text-[9px] text-paper">
            {player.number}
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-card border-[1.6px] border-dashed border-ink-muted-strong",
            size,
            flip && "order-2",
          )}
        >
          <span className="font-display text-micro text-ink-muted">
            {player.position.slice(0, 3)}
          </span>
        </div>
      )}

      <span
        className={cn(
          "truncate text-center font-display",
          compact ? "max-w-[64px] text-[9px]" : "max-w-[80px] text-[11px]",
          flip && "order-1",
          isPresent ? "text-ink" : "text-ink-muted",
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}
