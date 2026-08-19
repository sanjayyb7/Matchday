"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe } from "lucide-react";
import { UpcomingMatchCard } from "./UpcomingMatchCard";
import { getDerivedMatchStatus } from "@/lib/mock/data";
import {
  filterMatchesByLeague,
  listLeaguesFromMatches,
} from "@/lib/matches/league-filter";
import { getLeagueLogoUrl } from "@/lib/matches/league-logos";
import { BOTTOM_NAV_CLEARANCE } from "@/lib/layout/constants";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

interface UpcomingMatchListProps {
  matches: Match[];
  onSelect: (match: Match) => void;
}

function MatchSection({
  title,
  matches,
  onSelect,
}: {
  title: string;
  matches: Match[];
  onSelect: (match: Match) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-base font-semibold uppercase tracking-wide text-white">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <UpcomingMatchCard
            key={match.id}
            match={match}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

interface LeagueOption {
  id: string | null;
  label: string;
  shortLabel: string;
  logoUrl: string | null;
}

function shortenLeagueLabel(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("premier")) return "PL";
  if (lower.includes("primera") || lower.includes("laliga") || lower.includes("la liga"))
    return "La Liga";
  if (lower.includes("bundesliga")) return "BL";
  if (lower.includes("serie a")) return "Serie A";
  if (lower.includes("ligue")) return "Ligue 1";
  if (lower.includes("champions")) return "UCL";
  if (lower.includes("europa")) return "UEL";
  if (lower.includes("mls") || lower.includes("major league")) return "MLS";
  return name.length > 8 ? name.slice(0, 8) + "…" : name;
}

export function UpcomingMatchList({ matches, onSelect }: UpcomingMatchListProps) {
  const leagues = listLeaguesFromMatches(matches);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const activeLeague =
    selectedLeague && leagues.includes(selectedLeague) ? selectedLeague : null;
  const filtered = filterMatchesByLeague(matches, activeLeague);
  const liveMatches = filtered.filter(
    (match) => getDerivedMatchStatus(match) === "live",
  );
  const upcomingMatches = filtered.filter(
    (match) => getDerivedMatchStatus(match) !== "live",
  );
  const showSections = liveMatches.length > 0 && upcomingMatches.length > 0;

  const leagueOptions: LeagueOption[] = [
    { id: null, label: "All", shortLabel: "All", logoUrl: null },
    ...leagues.map((league) => ({
      id: league,
      label: league,
      shortLabel: shortenLeagueLabel(league),
      logoUrl: getLeagueLogoUrl(league),
    })),
  ];

  return (
    <div
      className="relative h-dvh overflow-y-auto overscroll-contain bg-[#07090C]"
      style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-0 h-0"
      >
        <div className="absolute inset-x-0 -top-8 h-72 bg-[radial-gradient(ellipse_100%_90%_at_50%_-10%,rgba(255,220,70,0.28),rgba(255,252,0,0.08)_42%,transparent_72%)]" />
      </div>
      <div className="relative sticky top-0 z-10 bg-transparent pb-3 pt-6">
        <h1 className="px-5 pb-3 font-heading text-lg font-semibold uppercase tracking-wide text-white">
          Matches
        </h1>
        {leagueOptions.length > 1 && (
          <div
            className="flex gap-5 overflow-x-auto px-5 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filter by league"
          >
            {leagueOptions.map((option) => {
              const isActive = activeLeague === option.id;
              const isAll = option.id === null;
              return (
                <button
                  key={option.id ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedLeague(option.id)}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <div
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-2 transition-[transform,box-shadow,ring-color,background-color] duration-200 ease-[var(--ease-out-strong)] active:scale-[0.96]",
                      isAll ? "bg-white/[0.08]" : "bg-white",
                      isActive
                        ? "ring-[#FFFC00]"
                        : "ring-transparent hover:ring-white/20",
                    )}
                  >
                    {option.logoUrl ? (
                      <Image
                        src={option.logoUrl}
                        alt={option.label}
                        fill
                        className="object-contain p-1.5"
                        unoptimized
                      />
                    ) : (
                      <Globe
                        className="h-6 w-6 text-white"
                        strokeWidth={1.75}
                      />
                    )}
                  </div>
                    <span
                      className={cn(
                        "max-w-[3.75rem] truncate text-[11px] font-medium",
                        isActive ? "text-[#FFFC00]" : "text-white/60",
                      )}
                    >
                    {option.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Soft fade beneath the header so content dissolves in instead of
            hitting a hard divider. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-[#07090C]/80 to-transparent"
        />
      </div>

      <div className="mt-3 px-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/50">
            No matches in {activeLeague ?? "this filter"} right now.
          </p>
        ) : showSections ? (
          <div className="flex flex-col gap-7">
            <MatchSection
              title={liveMatches.length === 1 ? "Live match" : "Live matches"}
              matches={liveMatches}
              onSelect={onSelect}
            />
            <MatchSection
              title={
                upcomingMatches.length === 1
                  ? "Upcoming match"
                  : "Upcoming matches"
              }
              matches={upcomingMatches}
              onSelect={onSelect}
            />
          </div>
        ) : (
          <MatchSection
            title={
              liveMatches.length > 0
                ? liveMatches.length === 1
                  ? "Live match"
                  : "Live matches"
                : "Upcoming matches"
            }
            matches={liveMatches.length > 0 ? liveMatches : upcomingMatches}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
