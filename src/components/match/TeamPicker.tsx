"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getDerivedMatchStatus } from "@/lib/mock/data";
import { CtaBar } from "@/components/visual/CtaBar";
import { NameStack } from "@/components/visual/NameStack";
import { Well } from "@/components/visual/Well";
import type { Match, Team } from "@/types";

function formatKickoff(kickoff: string): string {
  return new Date(kickoff).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return String(value).padStart(2, "0");
}

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
  const isLive = getDerivedMatchStatus(match) === "live";
  const elapsed =
    match.elapsedMinutes != null && match.elapsedMinutes >= 0
      ? `${match.elapsedMinutes}'`
      : null;

  const sides = [
    { team: homeTeam, score: match.homeScore, tone: "bg-c-pink" },
    { team: awayTeam, score: match.awayScore, tone: "bg-c-blue" },
  ] as const;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {isLive && (
        <span className="absolute left-1/2 top-3 z-20 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-pill bg-ink px-3 font-display text-chip text-paper">
          <span className="live-pulse size-2 rounded-full bg-live" />
          Live
          {elapsed ? (
            <span className="font-utility text-micro text-paper">{elapsed}</span>
          ) : null}
        </span>
      )}

      {sides.map(({ team, score, tone }) => (
        <motion.button
          key={team.id}
          type="button"
          whileTap={{ filter: "brightness(0.96)" }}
          onClick={() => onSelect(team.id)}
          className={`relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden ${tone} text-left transition-[filter] duration-[var(--duration-press)] ease-out focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-live`}
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-10">
            <Well filled className="size-16 bg-paper">
              <Image
                src={team.flagUrl}
                alt={team.name}
                fill
                className="object-contain p-2"
                unoptimized
              />
            </Well>
            <NameStack name={team.name} className="text-center text-block" />
            {isLive && (
              <p className="font-display text-score text-ink">
                {formatScore(score)}
              </p>
            )}
            <p className="font-display text-micro text-ink-muted">
              {match.league || "Matchday"}
              {!isLive ? ` · ${formatKickoff(match.kickoff)}` : ""}
            </p>
          </div>
          <CtaBar>Pick side</CtaBar>
        </motion.button>
      ))}

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-paper bg-ink font-display text-chip text-paper"
      >
        VS
      </div>
    </div>
  );
}
