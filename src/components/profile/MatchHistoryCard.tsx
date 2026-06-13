"use client";

import Image from "next/image";
import { getPlayer, getTeam } from "@/lib/mock/data";
import type { MatchHistoryEntry } from "@/types";

interface MatchHistoryCardProps {
  entry: MatchHistoryEntry;
}

export function MatchHistoryCard({ entry }: MatchHistoryCardProps) {
  const player = getPlayer(entry.playerId);
  const team = getTeam(entry.teamId);

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-sm font-bold uppercase tracking-wide">
          {entry.matchLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(entry.attendedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {player && (
          <div className="relative h-12 w-12 overflow-hidden rounded-xl">
            <Image
              src={player.imageUrl}
              alt={player.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold">{player?.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {team && (
              <div className="relative h-4 w-4 overflow-hidden rounded-full">
                <Image src={team.flagUrl} alt="" fill className="object-cover" />
              </div>
            )}
            <span>{team?.name}</span>
            {player && <span>· #{player.number}</span>}
          </div>
        </div>
      </div>
      {entry.pubName && (
        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Watched at <span className="font-medium text-foreground">{entry.pubName}</span>
        </p>
      )}
    </div>
  );
}
