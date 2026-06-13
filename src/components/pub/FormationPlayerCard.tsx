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
  const borderColor = isPresent ? teamColor : "rgba(255,255,255,0.22)";
  const label = formatPlayerLabel(player.name);
  const gk = isGoalkeeper(player);
  const flip = inverted || gk;

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
          "relative transition-[transform,filter] duration-200 ease-[var(--ease-out-strong)] group-hover:scale-105",
          compact ? "h-[52px] w-[42px]" : "h-[72px] w-[58px]",
          flip && "order-2",
        )}
        style={{
          filter: isPresent
            ? `drop-shadow(0 0 10px ${teamColor}aa) drop-shadow(0 4px 12px ${teamColor}66)`
            : undefined,
        }}
      >
        {isPresent && fanCount > 1 && (
          <motion.span
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={uiTransition(reduced, 0.16)}
            className="absolute -right-1 -top-1 z-10 rounded-md bg-[#FFFC00] px-1 py-0.5 text-[9px] font-bold leading-none text-black"
          >
            ×{fanCount}
          </motion.span>
        )}
        {/* Hexagon border — highlight when a fan is present */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: flip
              ? "polygon(50% 100%, 92% 72%, 92% 18%, 50% 0%, 8% 18%, 8% 72%)"
              : "polygon(50% 0%, 92% 28%, 92% 82%, 50% 100%, 8% 82%, 8% 28%)",
            background: isPresent
              ? `linear-gradient(160deg, ${teamColor} 0%, ${teamColor}dd 100%)`
              : "linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 100%)",
            boxShadow: isPresent ? `0 0 0 1px ${teamColor}` : undefined,
          }}
        />
        <div
          className={cn(
            "absolute overflow-hidden bg-black",
            isPresent ? "inset-[4px]" : "inset-[3px]",
          )}
          style={{
            clipPath: flip
              ? "polygon(50% 98%, 89% 73%, 89% 21%, 50% 3%, 11% 21%, 11% 73%)"
              : "polygon(50% 2%, 89% 29%, 89% 79%, 50% 97%, 11% 79%, 11% 29%)",
          }}
        >
          <Image
            src={player.imageUrl}
            alt={player.name}
            fill
            className="object-cover object-top scale-110"
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
