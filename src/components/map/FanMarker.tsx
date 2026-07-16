"use client";

import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import type { FanPresence } from "@/types";

export function FanMarker({ fan }: { fan: FanPresence }) {
  const player = getPlayer(fan.playerId);
  const team = getTeam(fan.teamId);
  const borderColor = team?.color ?? "#ffffff";

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative h-9 w-9 overflow-hidden rounded-full border-2 shadow-md"
        style={{ borderColor }}
      >
        {player ? (
          <Image
            src={player.imageUrl}
            alt={player.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundColor: borderColor }}
          />
        )}
      </div>
      {player && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-black"
          style={{ backgroundColor: borderColor }}
        >
          {player.number}
        </span>
      )}
    </div>
  );
}
