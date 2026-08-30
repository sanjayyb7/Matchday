"use client";

import { getDerivedMatchStatus, getTeam } from "@/lib/mock/data";
import { cardSurface, Fold } from "@/components/visual/Card";
import { Crest } from "@/components/visual/Crest";
import { MicroLabel } from "@/components/visual/MicroLabel";
import { NameStack } from "@/components/visual/NameStack";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

function formatKickoffTime(kickoff: string): string {
  return new Date(kickoff).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface UpcomingMatchCardProps {
  match: Match;
  onSelect: (match: Match) => void;
  tone: string;
  /** Stretch to fill leftover viewport so the stack reaches the bottom. */
  fill?: boolean;
}

export function UpcomingMatchCard({ match, onSelect, tone, fill }: UpcomingMatchCardProps) {
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  const isLive = getDerivedMatchStatus(match) === "live";
  const elapsed =
    match.elapsedMinutes != null && match.elapsedMinutes >= 0
      ? `${match.elapsedMinutes}'`
      : null;
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className={cn(
        cardSurface,
        tone,
        fill &&
          "min-h-0 flex-1 pb-[calc(var(--card-pad-b)+var(--list-clearance)+env(safe-area-inset-bottom))]",
      )}
    >
      <Fold />

      <span className="flex items-baseline justify-between gap-3">
        <MicroLabel className="truncate">{match.league ?? ""}</MicroLabel>
        {/* The right margin keeps the status clear of the dog-ear. */}
        <span
          className={cn(
            "mr-[26px] flex shrink-0 items-center gap-1.5 font-display text-status",
            isLive ? "text-ink" : "text-ink-muted",
          )}
        >
          {isLive ? (
            <>
              <span className="live-pulse size-1.5 rounded-full bg-live" />
              {elapsed ?? "Live"}
            </>
          ) : (
            formatKickoffTime(match.kickoff)
          )}
        </span>
      </span>

      {/* 1fr / score / 1fr. The score is taken out of flow, so both team
          columns are pinned or the away side lands in the middle track. */}
      <span className="relative mt-6 grid grid-cols-[1fr_var(--score-column)_1fr] items-start">
        <span className="col-start-1 flex flex-col gap-3">
          <Crest src={homeTeam?.flagUrl} />
          <NameStack
            name={homeTeam?.name ?? "Home"}
            emphasize="first"
            className="text-team-list"
          />
        </span>

        {isLive && hasScore ? (
          /* Centred on the midpoint between the two crests, not the layout. */
          <span
            className="absolute flex items-center font-display text-score text-ink"
            style={{
              left: "calc(25% + 16.5px + var(--crest-list) / 2)",
              height: "var(--crest-list)",
              transform: "translateX(-50%)",
            }}
          >
            {match.homeScore}&#8211;{match.awayScore}
          </span>
        ) : null}

        <span className="col-start-3 flex flex-col gap-3">
          <Crest src={awayTeam?.flagUrl} />
          <NameStack
            name={awayTeam?.name ?? "Away"}
            emphasize="last"
            className="text-team-list"
          />
        </span>
      </span>
    </button>
  );
}
