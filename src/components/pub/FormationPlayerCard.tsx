"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { getTeam } from "@/lib/mock/data";
import { formatPlayerLabel, isGoalkeeper } from "@/lib/squad/formation";
import { uiTransition } from "@/lib/motion/tokens";
import { useMatchdayStore } from "@/store/matchday-store";
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
  const setSelectedPlayerProfile = useMatchdayStore(
    (s) => s.setSelectedPlayerProfile,
  );

  const teamColor = team?.color ?? "#00C853";
  const label = formatPlayerLabel(player.name);
  const gk = isGoalkeeper(player);
  const flip = inverted || gk;
  const size = compact ? "h-11 w-11" : "h-14 w-14";

  return (
    <motion.button
      type="button"
      onClick={() => setSelectedPlayerProfile(player)}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      className={cn(
        "group relative flex flex-col items-center focus:outline-none",
        compact ? "gap-0.5" : "gap-1.5",
        !isPresent && "opacity-35 saturate-0",
        isPresent && "transition-[opacity,filter] duration-200 ease-[var(--ease-out-strong)]",
      )}
    >
      <div
        className={cn(
          "relative rounded-full transition-[transform,filter] duration-200 ease-[var(--ease-out-strong)] group-hover:scale-105",
          size,
          flip && "order-2",
        )}
        style={{
          boxShadow: isPresent
            ? `0 0 0 2px ${teamColor}, 0 0 12px ${teamColor}aa`
            : "0 0 0 1.5px rgba(255,255,255,0.28)",
          filter: isPresent
            ? `drop-shadow(0 4px 10px ${teamColor}66)`
            : undefined,
        }}
      >
        {isPresent && fanCount > 1 && (
          <motion.span
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={uiTransition(reduced, 0.16)}
            className="absolute -right-1 -top-1 z-10 rounded-full bg-[#FFFC00] px-1 py-0.5 text-[9px] font-bold leading-none text-black"
          >
            ×{fanCount}
          </motion.span>
        )}
        <div className="absolute inset-0 overflow-hidden rounded-full bg-black">
          <Image
            src={player.imageUrl}
            alt={player.name}
            fill
            className="object-cover object-top"
            unoptimized
          />
        </div>
      </div>

      <span
        className={cn(
          "truncate text-center font-semibold tracking-tight",
          compact ? "max-w-[64px] text-[9px]" : "max-w-[80px] text-[11px]",
          flip && "order-1",
          isPresent ? "text-white" : "text-white/45",
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}
