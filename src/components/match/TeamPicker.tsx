"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getDerivedMatchStatus } from "@/lib/mock/data";
import type { Match, Team } from "@/types";
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

  return (
    <div className="relative overflow-visible rounded-3xl border border-white/10 bg-[#141A22] p-3">
      {isLive && (
        <span className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#E11D2E] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg shadow-red-900/40">
          <span className="live-pulse h-1.5 w-1.5 rounded-full bg-white" />
          Live
        </span>
      )}

      <div className="grid grid-cols-2 gap-2">
        {[
          { team: homeTeam, score: match.homeScore, side: "Home" },
          { team: awayTeam, score: match.awayScore, side: "Away" },
        ].map(({ team, score, side }) => (
          <motion.button
            key={team.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(team.id)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-5 text-center transition-colors",
              "hover:border-[#FFFC00]/50 hover:bg-[#FFFC00]/8",
            )}
            style={{
              background: `linear-gradient(165deg, ${team.color}40 0%, transparent 70%)`,
            }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {side}
            </span>
            <div className="relative h-16 w-16">
              <Image
                src={team.flagUrl}
                alt={team.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-white">
              {team.name}
            </span>
            {isLive && (
              <span className="font-heading text-3xl font-bold tabular-nums text-white">
                {formatScore(score)}
              </span>
            )}
            <span className="rounded-full bg-[#FFFC00] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
              Pick side
            </span>
          </motion.button>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {match.league || "Matchday"}
        </p>
        {isLive ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <span className="live-pulse h-1.5 w-1.5 rounded-full bg-red-500" />
            {elapsed ?? "Live now"}
          </p>
        ) : (
          <p className="text-xs text-white/45">{formatKickoff(match.kickoff)}</p>
        )}
      </div>
    </div>
  );
}
