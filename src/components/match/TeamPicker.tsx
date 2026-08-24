"use client";

import { cardSurface, Fold } from "@/components/visual/Card";
import { Crest } from "@/components/visual/Crest";
import { MicroLabel } from "@/components/visual/MicroLabel";
import { NameStack } from "@/components/visual/NameStack";
import { matchTone } from "@/components/visual/matchTone";
import { cn } from "@/lib/utils";
import type { Match, Team } from "@/types";

interface TeamPickerProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  onSelect: (teamId: string) => void;
}

export function TeamPicker({
  match,
  homeTeam,
  awayTeam,
  onSelect,
}: TeamPickerProps) {
  const sides = [
    {
      team: homeTeam,
      label: "Home",
      emphasize: "first" as const,
      tone: matchTone(match.id),
    },
    {
      team: awayTeam,
      label: "Away",
      emphasize: "last" as const,
      tone: matchTone(match.id, 2),
    },
  ];

  return (
    <div className="card-stack flex min-h-0 flex-1 flex-col px-[var(--gut)]">
      {sides.map(({ team, label, emphasize, tone }) => (
        <button
          key={team.id}
          type="button"
          onClick={() => onSelect(team.id)}
          className={cn(
            cardSurface,
            tone,
            "flex min-h-0 flex-1 flex-col justify-between",
          )}
        >
          <Fold />
          <MicroLabel>{label}</MicroLabel>
          <span className="mt-6 flex items-center gap-4">
            <Crest src={team.flagUrl} size="side" />
            <NameStack
              name={team.name}
              emphasize={emphasize}
              className="min-w-0 text-team-side"
            />
          </span>
        </button>
      ))}
    </div>
  );
}
