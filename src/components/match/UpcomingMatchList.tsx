"use client";

import { useState } from "react";
import { UpcomingMatchCard } from "./UpcomingMatchCard";
import { getDerivedMatchStatus } from "@/lib/mock/data";
import {
  filterMatchesByLeague,
  listLeaguesFromMatches,
} from "@/lib/matches/league-filter";
import { BOTTOM_NAV_CLEARANCE } from "@/lib/layout/constants";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

interface UpcomingMatchListProps {
  matches: Match[];
  onSelect: (match: Match) => void;
}

export function UpcomingMatchList({ matches, onSelect }: UpcomingMatchListProps) {
  const leagues = listLeaguesFromMatches(matches);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const activeLeague =
    selectedLeague && leagues.includes(selectedLeague) ? selectedLeague : null;
  const filtered = filterMatchesByLeague(matches, activeLeague);

  const hasLive = filtered.some(
    (match) => getDerivedMatchStatus(match) === "live",
  );
  const title =
    filtered.length === 1
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

        {leagues.length > 1 && (
          <div
            className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filter by league"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeLeague === null}
              onClick={() => setSelectedLeague(null)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeLeague === null
                  ? "bg-[#FFFC00] text-black"
                  : "bg-white/8 text-white/70 ring-1 ring-white/10 hover:bg-white/12",
              )}
            >
              All
            </button>
            {leagues.map((league) => (
              <button
                key={league}
                type="button"
                role="tab"
                aria-selected={activeLeague === league}
                onClick={() => setSelectedLeague(league)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  activeLeague === league
                    ? "bg-[#FFFC00] text-black"
                    : "bg-white/8 text-white/70 ring-1 ring-white/10 hover:bg-white/12",
                )}
              >
                {league}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/50">
            No matches in {activeLeague ?? "this filter"} right now.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((match) => (
              <UpcomingMatchCard
                key={match.id}
                match={match}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
