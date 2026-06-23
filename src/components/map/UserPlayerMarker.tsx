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
          <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-accent shadow-lg ring-2 ring-accent/60">
            <Image
              src={fallbackAvatarUrl}
              alt="You"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <span className="mt-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
            You
          </span>
        </div>
      );
    }
    return <UserLocationMarker />;
  }

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-accent shadow-lg ring-2 ring-accent/60">
        <Image
          src={player.imageUrl}
          alt={player.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
        {player.number}
      </span>
      <span className="mt-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
        You
      </span>
    </div>
  );
}

export type { UserPlayerMarkerProps };
