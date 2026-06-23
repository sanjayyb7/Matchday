"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getMatchLabel,
  getDerivedMatchStatus,
  getTeam,
  matches,
} from "@/lib/mock/data";
import {
  canPromptTeamSelection,
  formatTimeUntil,
  getSelectionOpensAt,
  isTeamSelectionOpen,
} from "@/lib/matches/match-window";
import type { Match } from "@/types";

function formatKickoff(kickoff: string): string {
  return new Date(kickoff).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface UpcomingMatchCardProps {
  match: Match;
  onSelect: (match: Match) => void;
}

export function UpcomingMatchCard({ match, onSelect }: UpcomingMatchCardProps) {
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  const matchStatus = getDerivedMatchStatus(match);
  const canPick = canPromptTeamSelection(match, matches);
  const selectionOpen = isTeamSelectionOpen(match);

  const actionLabel = canPick
    ? selectionOpen
      ? "Pick now"
      : "Pick early"
    : `Opens in ${formatTimeUntil(getSelectionOpensAt(match))}`;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(match)}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          {homeTeam && (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
              <Image
                src={homeTeam.flagUrl}
                alt={homeTeam.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <span className="text-xs font-bold uppercase text-white/40">vs</span>
          {awayTeam && (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
              <Image
                src={awayTeam.flagUrl}
                alt={awayTeam.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          {matchStatus === "live" && (
            <Badge className="ml-auto gap-1 bg-accent text-[10px] text-accent-foreground">
              <span className="live-pulse h-1.5 w-1.5 rounded-full bg-red-500" />
              LIVE
            </Badge>
          )}
        </div>
        <p className="font-heading text-base font-bold uppercase tracking-wide text-white">
          {getMatchLabel(match)}
        </p>
        <p className="text-xs text-white/50">{formatKickoff(match.kickoff)}</p>
        <p
          className={`text-xs font-semibold ${canPick ? "text-[#FFFC00]" : "text-white/40"}`}
        >
          {actionLabel}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/30" />
    </motion.button>
  );
}
