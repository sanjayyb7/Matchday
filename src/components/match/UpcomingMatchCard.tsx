"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getDerivedMatchStatus, getTeam } from "@/lib/mock/data";
import { Well } from "@/components/visual/Well";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

function formatMatchDate(kickoff: string): string {
  return new Date(kickoff).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
  });
}

function formatMatchTime(kickoff: string): string {
  return new Date(kickoff).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function Crest({ src, alt }: { src?: string; alt: string }) {
  return (
    <Well className="size-12 bg-paper/40">
      {src ? (
        <span className="absolute inset-1 overflow-hidden rounded-full">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain p-0.5"
            unoptimized
          />
        </span>
      ) : null}
    </Well>
  );
}

interface UpcomingMatchCardProps {
  match: Match;
  onSelect: (match: Match) => void;
}

export function UpcomingMatchCard({ match, onSelect }: UpcomingMatchCardProps) {
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  const isLive = getDerivedMatchStatus(match) === "live";

  return (
    <motion.button
      type="button"
      whileTap={{ filter: "brightness(0.96)" }}
      onClick={() => onSelect(match)}
      className={cn(
        "dog-ear relative min-h-[148px] w-full overflow-hidden rounded-card px-4 py-4 text-left",
        "transition-[filter] duration-[var(--duration-press)] ease-out",
        "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-live",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crest src={homeTeam?.flagUrl} alt={homeTeam?.name ?? "Home"} />
          <Crest src={awayTeam?.flagUrl} alt={awayTeam?.name ?? "Away"} />
        </div>
        <div className="flex min-h-11 flex-col items-end justify-start gap-2">
          <p className="font-display text-micro text-ink-muted">
            {formatMatchDate(match.kickoff)}
          </p>
          {isLive && (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-ink px-3 font-display text-chip text-paper">
              <span className="live-pulse size-2 rounded-full bg-live" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <p className="font-display text-block text-ink">
          {formatMatchTime(match.kickoff)}
        </p>
        <p className="text-right font-display text-name leading-[0.88]">
          <span className="block text-ink">{homeTeam?.name ?? "Home"}</span>
          <span className="block text-ink-muted-soft">
            {awayTeam?.name ?? "Away"}
          </span>
        </p>
      </div>
    </motion.button>
  );
}
