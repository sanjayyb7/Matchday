"use client";

import { useState } from "react";
import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import { color } from "@/lib/theme/tokens";
import type { FanPresence } from "@/types";

function fallbackAvatar(playerId: string, fill: string): string {
  const hex = fill.replace("#", "");
  return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(playerId)}&backgroundColor=${hex}`;
}

export function FanMarker({ fan }: { fan: FanPresence }) {
  const player = getPlayer(fan.playerId);
  const team = getTeam(fan.teamId);
  const fill = team?.color ?? color.lime;
  const [imageFailed, setImageFailed] = useState(false);
  const src =
    player && !imageFailed
      ? player.imageUrl
      : fallbackAvatar(fan.playerId, fill);

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative h-9 w-9 overflow-hidden rounded-full border-[3px] border-ink"
        style={{ backgroundColor: fill }}
      >
        <Image
          src={src}
          alt={player?.name ?? "Fan"}
          fill
          className="object-cover"
          unoptimized
          onError={() => {
            if (!imageFailed) setImageFailed(true);
          }}
        />
      </div>
      {player && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink font-display text-[8px] text-paper">
          {player.number}
        </span>
      )}
    </div>
  );
}
