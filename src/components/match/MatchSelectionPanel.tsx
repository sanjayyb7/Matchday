"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TeamPicker } from "./TeamPicker";
import { PlayerPicker } from "./PlayerPicker";
import { useMatchdayStore } from "@/store/matchday-store";
import { useAuth } from "@/hooks/useAuth";
import {
  getMatchLabel,
  getDerivedMatchStatus,
  getPlayersByTeam,
  getTeam,
  matches,
  mergeMatchSquads,
} from "@/lib/mock/data";
import {
  formatTimeUntil,
  getSelectionOpensAt,
  isEarlyTeamSelection,
  isTeamSelectionOpen,
} from "@/lib/matches/match-window";
import { generateFallbackSquad } from "@/lib/matches/squad-fallback";
import { getHistoryAdapter } from "@/hooks/useHistory";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { upsertUserIdentity } from "@/lib/identity/insforge-identity";
import type { Match, Player, Team } from "@/types";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_CLEARANCE } from "@/lib/layout/constants";

function ensureLocalFallbackSquads(home?: Team, away?: Team): boolean {
  const missing: Player[] = [];
  if (home && getPlayersByTeam(home.id).length === 0) {
    missing.push(...generateFallbackSquad(home));
  }
  if (away && getPlayersByTeam(away.id).length === 0) {
    missing.push(...generateFallbackSquad(away));
  }
  if (missing.length === 0) return false;
  mergeMatchSquads([], missing);
  return true;
}

function formatKickoff(kickoff: string): string {
  return new Date(kickoff).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface MatchSelectionPanelProps {
  match: Match;
  onBack?: () => void;
  embedded?: boolean;
}

export function MatchSelectionPanel({
  match,
  onBack,
  embedded = false,
}: MatchSelectionPanelProps) {
  const router = useRouter();
  const { user } = useAuth();
  const setIdentity = useMatchdayStore((s) => s.setIdentity);
  const closeMatchReminder = useMatchdayStore((s) => s.closeMatchReminder);
  const [step, setStep] = useState<"team" | "player">("team");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [squadTick, setSquadTick] = useState(0);
  const [squadLoading, setSquadLoading] = useState(false);

  const matchStatus = getDerivedMatchStatus(match);
  const selectionOpen = isTeamSelectionOpen(match);
  const earlyPick = isEarlyTeamSelection(match, matches);

  void squadTick;
  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  const selectedTeam = selectedTeamId ? getTeam(selectedTeamId) : null;
  const players = selectedTeamId ? getPlayersByTeam(selectedTeamId) : [];
  const homePlayers = getPlayersByTeam(match.homeTeamId);
  const awayPlayers = getPlayersByTeam(match.awayTeamId);
  const needsSquadLoad = homePlayers.length === 0 || awayPlayers.length === 0;

  useEffect(() => {
    if (!needsSquadLoad) return;

    let cancelled = false;
    setSquadLoading(true);

    const finishWithFallback = () => {
      if (cancelled) return;
      if (ensureLocalFallbackSquads(getTeam(match.homeTeamId), getTeam(match.awayTeamId))) {
        setSquadTick((value) => value + 1);
      }
      setSquadLoading(false);
    };

    const hasSquadApi =
      match.id.startsWith("af-") || match.id.startsWith("fd-");

    if (!hasSquadApi) {
      finishWithFallback();
      return () => {
        cancelled = true;
      };
    }

    void fetch(`/api/matches/squads?matchId=${encodeURIComponent(match.id)}`)
      .then(async (response) => {
        if (!response.ok) {
          finishWithFallback();
          return;
        }
        const payload = (await response.json()) as {
          teams?: Team[];
          players?: Player[];
        };
        if (cancelled) return;
        mergeMatchSquads(payload.teams ?? [], payload.players ?? []);
        if (
          getPlayersByTeam(match.homeTeamId).length === 0 ||
          getPlayersByTeam(match.awayTeamId).length === 0
        ) {
          ensureLocalFallbackSquads(
            getTeam(match.homeTeamId),
            getTeam(match.awayTeamId),
          );
        }
        setSquadTick((value) => value + 1);
        setSquadLoading(false);
      })
      .catch(() => {
        finishWithFallback();
      });

    return () => {
      cancelled = true;
    };
  }, [match.id, match.homeTeamId, match.awayTeamId, needsSquadLoad]);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    setStep("player");
  };

  const handlePlayerSelect = (player: Player) => {
    if (!user || !selectedTeamId) return;
    const identity = {
      userId: user.id,
      matchId: match.id,
      teamId: selectedTeamId,
      playerId: player.id,
      updatedAt: new Date().toISOString(),
    };
    setIdentity(identity);
    closeMatchReminder();

    const history = getHistoryAdapter();
    void history.recordMatchAttendance({
      userId: user.id,
      matchId: match.id,
      teamId: selectedTeamId,
      playerId: player.id,
      attendedAt: new Date().toISOString(),
      matchLabel: getMatchLabel(match),
    });

    if (INSFORGE_ENABLED) {
      void upsertUserIdentity(identity).catch((err) => {
        console.error("[identity] squad pick not persisted", err);
      });
    }

    router.replace(`/chat/${selectedTeamId}`);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-[#0B0F14]",
        embedded ? "min-h-0 flex-1" : "h-dvh",
      )}
    >
      <div
        className={cn(
          "shrink-0 px-4 pb-4",
          embedded ? "pr-14 pt-10" : "pt-6",
        )}
      >
        <div className="flex items-center gap-3">
          {step === "team" && onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to matches"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 transition-colors hover:bg-white/25"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
          {step === "player" && (
            <button
              type="button"
              onClick={() => setStep("team")}
              aria-label="Change team"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 transition-colors hover:bg-white/25"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
          <div className="min-w-0 flex-1 text-center">
            <h1 className="font-heading text-lg font-semibold uppercase tracking-wide text-white">
              Match
            </h1>
            <p className="mt-0.5 truncate text-xs text-white/55">
              {match.league
                ? `${match.league} · ${
                    matchStatus === "live" ? "Live now" : formatKickoff(match.kickoff)
                  }`
                : matchStatus === "live"
                  ? "Live now"
                  : formatKickoff(match.kickoff)}
            </p>
          </div>
          {/* Spacer for header symmetry — mirrors the back button width. */}
          <div className="h-10 w-10 shrink-0" aria-hidden />
        </div>

        {step === "player" && (
          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-white/45">
            Pick your player
          </p>
        )}

        {!selectionOpen && !earlyPick && matchStatus === "upcoming" && (
          <p className="mt-3 text-center text-xs text-[#FFFC00]/80">
            Team selection opens in{" "}
            {formatTimeUntil(getSelectionOpensAt(match))}
          </p>
        )}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-4"
        style={
          embedded
            ? { paddingBottom: "1.5rem" }
            : { paddingBottom: BOTTOM_NAV_CLEARANCE }
        }
      >
        {step === "team" ? (
          homeTeam && awayTeam ? (
            <TeamPicker
              match={match}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              onSelect={handleTeamSelect}
            />
          ) : (
            <p className="text-sm text-white/55">
              Team details are still loading for this match. Go back and try
              again in a moment.
            </p>
          )
        ) : squadLoading && players.length === 0 ? (
          <p className="text-sm text-white/55">Loading players…</p>
        ) : (
          selectedTeam && (
            <PlayerPicker
              players={players}
              teamColor={selectedTeam.color}
              onSelect={handlePlayerSelect}
            />
          )
        )}
      </div>
    </div>
  );
}
