"use client";

import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import { formatPlayerLabel } from "@/lib/squad/formation";
import { useMatchdayStore } from "@/store/matchday-store";
import type { FanPresence } from "@/types";
import { cn } from "@/lib/utils";

interface FormationPlayerCardProps {
  member: FanPresence;
  inverted?: boolean;
}

export function FormationPlayerCard({ member, inverted = false }: FormationPlayerCardProps) {
  const player = getPlayer(member.playerId);
  const team = getTeam(member.teamId);
  const setSelectedPlayerProfile = useMatchdayStore(
    (s) => s.setSelectedPlayerProfile,
  );

  if (!player) return null;

  const borderColor = team?.color ?? "#00C853";
  const label = formatPlayerLabel(player.name);

  return (
    <button
      type="button"
      onClick={() => setSelectedPlayerProfile(player)}
      className="group flex flex-col items-center gap-1.5 focus:outline-none"
    >
      <div
        className={cn(
          "relative h-[72px] w-[58px] transition-transform group-hover:scale-105",
          inverted && "order-2",
        )}
        style={{
          filter: `drop-shadow(0 4px 12px ${borderColor}55)`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            clipPath: inverted
              ? "polygon(50% 100%, 92% 72%, 92% 18%, 50% 0%, 8% 18%, 8% 72%)"
              : "polygon(50% 0%, 92% 28%, 92% 82%, 50% 100%, 8% 82%, 8% 28%)",
            background: `linear-gradient(160deg, ${borderColor} 0%, ${borderColor}cc 100%)`,
          }}
        />
        <div
          className="absolute inset-[3px] overflow-hidden bg-black"
          style={{
            clipPath: inverted
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
          "max-w-[76px] truncate text-center text-[11px] font-semibold tracking-tight text-white",
          inverted && "order-1",
        )}
      >
        {label}
      </span>
    </button>
  );
}
