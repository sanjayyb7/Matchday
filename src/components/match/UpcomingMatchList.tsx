"use client";

import { useState } from "react";
import Image from "next/image";
import { UpcomingMatchCard } from "./UpcomingMatchCard";
import { getDerivedMatchStatus } from "@/lib/mock/data";
import {
  filterMatchesByLeague,
  listLeaguesFromMatches,
} from "@/lib/matches/league-filter";
import { getLeagueLogoUrl } from "@/lib/matches/league-logos";
import { BOTTOM_NAV_CLEARANCE } from "@/lib/layout/constants";
import { NameStack } from "@/components/visual/NameStack";
import { Pill } from "@/components/visual/Pill";
import { Well } from "@/components/visual/Well";
import type { Match } from "@/types";

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
      <h2 className="sr-only">{title}</h2>
      <div
        className={[
          "flex flex-col gap-3",
          "[&>*:nth-child(5n+1)]:bg-match-2",
          "[&>*:nth-child(5n+2)]:bg-match-3",
          "[&>*:nth-child(5n+3)]:bg-match-4",
          "[&>*:nth-child(5n+4)]:bg-match-5",
          "[&>*:nth-child(5n+5)]:bg-match-1",
        ].join(" ")}
      >
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
  const heading = activeLeague ?? "Matches";
  const headingLogo = activeLeague ? getLeagueLogoUrl(activeLeague) : null;

  const leagueOptions: LeagueOption[] = [
    { id: null, label: "All", shortLabel: "All" },
    ...leagues.map((league) => ({
      id: league,
      label: league,
      shortLabel: shortenLeagueLabel(league),
    })),
  ];

  return (
    <div
      className="relative h-dvh overflow-y-auto overscroll-contain bg-paper"
      style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      <div className="sticky top-0 z-10 bg-paper">
        <div className="px-5 pb-4 pt-5">
          {headingLogo ? (
            <Well className="mb-3 size-10">
              <Image
                src={headingLogo}
                alt=""
                fill
                className="object-contain p-1"
                unoptimized
              />
            </Well>
          ) : null}
          <h1 className="text-page">
            <NameStack name={heading} />
          </h1>
          {leagueOptions.length > 1 && (
            <div
              className="mt-4 flex gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Filter by league"
            >
              {leagueOptions.map((option) => {
                const isActive = activeLeague === option.id;
                return (
                  <Pill
                    key={option.id ?? "all"}
                    role="tab"
                    aria-selected={isActive}
                    active={isActive}
                    onClick={() => setSelectedLeague(option.id)}
                  >
                    {option.shortLabel}
                  </Pill>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center font-utility text-sm text-ink-muted">
            No matches in {activeLeague ?? "this filter"} right now.
          </p>
        ) : showSections ? (
          <div className="flex flex-col gap-3">
            <MatchSection
              title={liveMatches.length === 1 ? "Live Match" : "Live Matches"}
              matches={liveMatches}
              onSelect={onSelect}
            />
            <MatchSection
              title={
                upcomingMatches.length === 1
                  ? "Upcoming Match"
                  : "Upcoming Matches"
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
                  ? "Live Match"
                  : "Live Matches"
                : "Upcoming Matches"
            }
            matches={liveMatches.length > 0 ? liveMatches : upcomingMatches}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
