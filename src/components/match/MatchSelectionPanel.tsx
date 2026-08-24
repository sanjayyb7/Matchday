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
import { NameStack } from "@/components/visual/NameStack";
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

  const elapsed =
    match.elapsedMinutes != null && match.elapsedMinutes >= 0
      ? `${match.elapsedMinutes}'`
      : null;
  const statusLine =
    matchStatus === "live"
      ? `Live${elapsed ? ` · ${elapsed}` : ""}`
      : formatKickoff(match.kickoff);

  return (
    <div
      className={cn(
        "flex flex-col",
        embedded
          ? "min-h-0 flex-1 bg-paper"
          : "h-dvh overflow-hidden overscroll-contain bg-paper",
      )}
      style={embedded ? undefined : { paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      <div
        className={cn(
          "sticky top-0 z-10 shrink-0 bg-paper px-[var(--gut)]",
          embedded ? "pr-14 pt-10" : "pt-[var(--header-pad-t)]",
          step === "team" ? "pb-[var(--header-pad-b)]" : "pb-4",
        )}
      >
        <div className="flex items-center gap-3">
          {step === "team" && onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to matches"
              className="press-pill focus-visible-live flex size-11 shrink-0 items-center justify-center rounded-full border-[length:var(--border-ink)] border-ink bg-paper text-ink"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
          {step === "player" && (
            <button
              type="button"
              onClick={() => setStep("team")}
              aria-label="Change team"
              className="press-pill focus-visible-live flex size-11 shrink-0 items-center justify-center rounded-full border-[length:var(--border-ink)] border-ink bg-paper text-ink"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {step === "team" ? (
              <>
                <p className="truncate font-utility text-tab font-semibold uppercase tracking-[var(--micro-tracking)] text-ink">
                  {match.league || "Matchday"}
                </p>
                <p className="micro-label mt-0.5 text-ink-muted">{statusLine}</p>
              </>
            ) : (
              <p className="truncate font-utility text-tab font-semibold uppercase tracking-[var(--micro-tracking)] text-ink">
                {selectedTeam?.name ?? "Team"}
              </p>
            )}
          </div>
        </div>

        <h1 className="mt-5">
          <NameStack
            name={step === "team" ? "Pick a side" : "Pick your player"}
            tone="ghost"
            className="text-sub"
          />
        </h1>

        {!selectionOpen && !earlyPick && matchStatus === "upcoming" && (
          <p className="mt-3 font-utility text-micro font-medium text-ink-muted">
            Team selection opens in{" "}
            {formatTimeUntil(getSelectionOpensAt(match))}
          </p>
        )}
      </div>

      <div
        className={cn(
          step === "team"
            ? "flex min-h-0 flex-1 flex-col"
            : "min-h-0 flex-1 overflow-y-auto",
          embedded && step !== "team" && "pb-6",
        )}
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
            <p className="px-4 font-utility text-sm text-ink-muted">
              Team details are still loading for this match. Go back and try
              again in a moment.
            </p>
          )
        ) : squadLoading && players.length === 0 ? (
          <p className="px-4 font-utility text-sm text-ink-muted">Loading players…</p>
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
