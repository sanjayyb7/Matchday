"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  getDerivedMatchStatus,
  getTeam,
  isUsingFallbackFixtures,
  matches,
} from "@/lib/mock/data";
import {
  canPromptTeamSelection,
  formatTimeUntil,
  getSelectionOpensAt,
  isTeamSelectionOpen,
} from "@/lib/matches/match-window";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

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

function formatElapsed(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes < 0) return null;
  return `${minutes}'`;
}

interface UpcomingMatchCardProps {
  match: Match;
  onSelect: (match: Match) => void;
}

export function UpcomingMatchCard({ match, onSelect }: UpcomingMatchCardProps) {
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  const matchStatus = getDerivedMatchStatus(match);
  const isLive = matchStatus === "live";
  const canPick = canPromptTeamSelection(match, matches);
  const selectionOpen = isTeamSelectionOpen(match);
  const isDemo = isUsingFallbackFixtures() || match.id.startsWith("match-demo-");
  const elapsed = formatElapsed(match.elapsedMinutes);

  const footerLabel = isDemo
    ? "Demo — pick a side"
    : canPick
      ? selectionOpen
        ? "Tap to pick your team"
        : "Early pick available"
      : `Opens in ${formatTimeUntil(getSelectionOpensAt(match))}`;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(match)}
      className={cn(
        "relative w-full overflow-visible rounded-3xl border border-white/[0.06] bg-[#1A1D1E] px-4 pb-4 pt-6 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)] transition-colors",
        "hover:border-white/15 hover:bg-[#202425]",
        isLive && "border-red-500/35 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(225,29,46,0.12)]",
      )}
    >
      {isLive && (
        <span
          className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#E11D2E] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_16px_rgba(220,38,46,0.55)] ring-1 ring-white/10"
        >
          <span className="live-pulse h-2 w-2 rounded-full bg-white" />
          Live
        </span>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          {homeTeam ? (
            <div className="relative h-14 w-14">
              <Image
                src={homeTeam.flagUrl}
                alt={homeTeam.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-14 w-14" />
          )}
          <p className="line-clamp-2 min-h-[2.25rem] font-heading text-sm font-bold uppercase leading-tight tracking-wide text-white">
            {homeTeam?.name ?? "Home"}
          </p>
          {isLive && (
            <p className="font-heading text-2xl font-bold tabular-nums text-white">
              {formatScore(match.homeScore)}
            </p>
          )}
        </div>

        <div className="flex min-w-[5.5rem] flex-col items-center gap-1 px-1 text-center">
          <p className="line-clamp-2 min-h-[2.1rem] text-[11px] font-semibold uppercase leading-snug tracking-wide text-white/75">
            {match.league || "Matchday"}
          </p>
          {isLive ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
              <span className="live-pulse h-1.5 w-1.5 rounded-full bg-red-500" />
              {elapsed ?? "Live"}
            </p>
          ) : (
            <p className="text-[11px] font-medium text-white/45">
              {formatKickoff(match.kickoff)}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          {awayTeam ? (
            <div className="relative h-14 w-14">
              <Image
                src={awayTeam.flagUrl}
                alt={awayTeam.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-14 w-14" />
          )}
          <p className="line-clamp-2 min-h-[2.25rem] font-heading text-sm font-bold uppercase leading-tight tracking-wide text-white">
            {awayTeam?.name ?? "Away"}
          </p>
          {isLive && (
            <p className="font-heading text-2xl font-bold tabular-nums text-white">
              {formatScore(match.awayScore)}
            </p>
          )}
        </div>
      </div>

      <p
        className={cn(
          "mt-4 text-center text-[11px] font-semibold uppercase tracking-wide",
          canPick ? "text-[#FFFC00]" : "text-white/40",
        )}
      >
        {footerLabel}
      </p>
    </motion.button>
  );
}
