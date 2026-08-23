"use client";

import Image from "next/image";
import { getPlayer } from "@/lib/mock/data";
import { UserLocationMarker } from "./UserLocationMarker";

interface UserPlayerMarkerProps {
  playerId: string;
  lat: number;
  lng: number;
}

export function UserPlayerMarkerContent({
  playerId,
  fallbackAvatarUrl,
}: {
  playerId: string;
  fallbackAvatarUrl?: string;
}) {
  const player = getPlayer(playerId);

  if (!player) {
    if (fallbackAvatarUrl) {
      return (
        <div className="relative flex flex-col items-center">
          <div
            className="relative h-12 w-12 overflow-hidden rounded-full border-[3px] border-ink"
            style={{ boxShadow: "var(--ring-avatar)" }}
          >
            <Image
              src={fallbackAvatarUrl}
              alt="You"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <span className="mt-1 rounded-pill bg-ink px-2 py-1 font-display text-micro text-paper">
            You
          </span>
        </div>
      );
    }
    return <UserLocationMarker />;
  }

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative h-12 w-12 overflow-hidden rounded-full border-[3px] border-ink"
        style={{ boxShadow: "var(--ring-avatar)" }}
      >
        <Image
          src={player.imageUrl}
          alt={player.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink font-display text-[10px] text-paper">
        {player.number}
      </span>
      <span className="mt-1 rounded-pill bg-ink px-2 py-1 font-display text-micro text-paper">
        You
      </span>
    </div>
  );
}

export type { UserPlayerMarkerProps };
