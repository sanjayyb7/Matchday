"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

    if (!match.id.startsWith("af-")) {
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
      void upsertUserIdentity(identity);
    }

    router.replace(`/chat/${selectedTeamId}`);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-[#0B0F14]",
        embedded ? "min-h-0 flex-1" : "h-dvh",
      )}
      style={embedded ? undefined : { paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      <div className="border-b border-white/10 px-4 pb-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {step === "team" && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-3 flex items-center gap-1 text-sm text-white/60 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to matches
              </button>
            )}
            {step === "player" && (
              <button
                type="button"
                onClick={() => setStep("team")}
                className="mb-3 flex items-center gap-1 text-sm text-white/60 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Change team
              </button>
            )}
            <h1 className="font-heading text-2xl uppercase tracking-wide text-white">
              {step === "team" ? "Pick your side" : "Pick your player"}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {getMatchLabel(match)} · {formatKickoff(match.kickoff)}
            </p>
          </div>
          {matchStatus === "live" && (
            <Badge className="shrink-0 gap-1.5 bg-accent text-accent-foreground">
              <span className="live-pulse h-2 w-2 rounded-full bg-red-500" />
              LIVE
            </Badge>
          )}
        </div>
        {earlyPick && matchStatus !== "finished" && (
          <p className="mt-3 text-xs text-[#FFFC00]/80">
            No match in the next hour — pick your team and player for the next
            fixture.
          </p>
        )}
        {!selectionOpen &&
          !earlyPick &&
          matchStatus === "upcoming" && (
            <p className="mt-3 text-xs text-[#FFFC00]/80">
              Team selection opens in{" "}
              {formatTimeUntil(getSelectionOpensAt(match))}
            </p>
          )}
        <p className="mt-2 text-xs text-white/45">
          Join your team squad chat after you pick a player
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === "team" ? (
          homeTeam && awayTeam ? (
            <TeamPicker
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
