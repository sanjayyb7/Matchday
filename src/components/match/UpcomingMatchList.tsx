"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, Globe, Shield } from "lucide-react";
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
      <div className="card-stack flex flex-col">
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

function LeagueMark({ league }: { league: string | null }) {
  if (!league) {
    return <Globe className="size-5" strokeWidth={2.25} />;
  }

  const src = getLeagueLogoUrl(league);
  if (!src) {
    return <Shield className="size-5" strokeWidth={2.25} />;
  }

  return (
    <span className="relative block size-5 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        sizes="20px"
        className="object-contain"
        unoptimized
      />
    </span>
  );
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
  const heading = activeLeague ?? "Matches Today";

  const leagueOptions: LeagueOption[] = [
    { id: null, label: "All", shortLabel: "All" },
    ...leagues.map((league) => ({
      id: league,
      label: league,
      shortLabel: shortenLeagueLabel(league),
    })),
  ];

  /* The bottom padding adds the card overlap back, so the first card can ride
     up over it without colliding with the filters. */
  const header = (
    <header className="px-[var(--gut)] pb-[var(--header-pad-b)] pt-[var(--header-pad-t)]">
      <h1>
        <NameStack name={heading} tone="ghost" className="text-page" />
      </h1>
      {leagueOptions.length > 1 && (
        <div
          className="mt-6 flex gap-2.5 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                mark={<LeagueMark league={option.id} />}
                onClick={() => setSelectedLeague(option.id)}
              >
                {option.shortLabel}
              </Pill>
            );
          })}
        </div>
      )}
    </header>
  );

  return (
    <div
      className="relative h-dvh overflow-y-auto overscroll-contain bg-paper"
      style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      {filtered.length === 0 ? (
        <>
          {header}
          <div className="flex flex-col items-center gap-4 px-[var(--gut)] pb-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-well border-[length:var(--border-quick)] border-dashed border-ink-muted">
              <Calendar className="size-6 text-ink-muted" strokeWidth={2} />
            </span>
            <p className="font-utility text-body text-ink-label">
              No matches in {activeLeague ?? "this filter"} right now.
            </p>
          </div>
        </>
      ) : (
        <div className="card-stack">
          {header}
          {showSections ? (
            <div className="card-stack">
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
      )}
    </div>
  );
}
