"use client";

import { UpcomingMatchCard } from "./UpcomingMatchCard";
import { getDerivedMatchStatus } from "@/lib/mock/data";
import { BOTTOM_NAV_CLEARANCE } from "@/lib/layout/constants";
import type { Match } from "@/types";

interface UpcomingMatchListProps {
  matches: Match[];
  onSelect: (match: Match) => void;
}

export function UpcomingMatchList({ matches, onSelect }: UpcomingMatchListProps) {
  const hasLive = matches.some(
    (match) => getDerivedMatchStatus(match) === "live",
  );
  const title =
    matches.length === 1
      ? hasLive
        ? "Live match"
        : "Next match"
      : hasLive
        ? "Live & upcoming"
        : "Upcoming matches";

  return (
    <div
      className="flex h-dvh flex-col bg-[#0B0F14]"
      style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      <div className="border-b border-white/10 px-4 pb-4 pt-6">
        <h1 className="font-heading text-2xl uppercase tracking-wide text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Tap a match to pick your team and player
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <UpcomingMatchCard key={match.id} match={match} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
