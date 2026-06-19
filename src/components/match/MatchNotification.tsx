"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { TeamPicker } from "./TeamPicker";
import { PlayerPicker } from "./PlayerPicker";
import { useMatchdayStore } from "@/store/matchday-store";
import { useAuth } from "@/hooks/useAuth";
import { useMatchIdentity } from "@/hooks/useMatchIdentity";
import {
  getLiveOrUpcomingMatch,
  getMatchLabel,
  getPlayersByTeam,
  getTeam,
} from "@/lib/mock/data";
import { getHistoryAdapter } from "@/hooks/useHistory";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { upsertUserIdentity } from "@/lib/identity/insforge-identity";
import type { Player } from "@/types";

function formatKickoff(kickoff: string): string {
  return new Date(kickoff).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MatchNotification() {
  const router = useRouter();
  const { user } = useAuth();
  const { showMatchModal, activeMatch } = useMatchIdentity(user?.id);
  const matchModalStep = useMatchdayStore((s) => s.matchModalStep);
  const selectedTeamId = useMatchdayStore((s) => s.selectedTeamId);
  const setMatchModalStep = useMatchdayStore((s) => s.setMatchModalStep);
  const setSelectedTeamId = useMatchdayStore((s) => s.setSelectedTeamId);
  const closeMatchModal = useMatchdayStore((s) => s.closeMatchModal);
  const setIdentity = useMatchdayStore((s) => s.setIdentity);

  const match = activeMatch ?? getLiveOrUpcomingMatch();
  if (!match) return null;

  const homeTeam = getTeam(match.homeTeamId)!;
  const awayTeam = getTeam(match.awayTeamId)!;
  const selectedTeam = selectedTeamId ? getTeam(selectedTeamId) : null;
  const players = selectedTeamId ? getPlayersByTeam(selectedTeamId) : [];

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    setMatchModalStep("player");
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

    closeMatchModal();
    router.push(`/chat/${selectedTeamId}`);
  };

  return (
    <Sheet open={showMatchModal} onOpenChange={() => {}}>
      <SheetContent
        side="bottom"
        elevated
        showCloseButton={false}
        className="max-h-[90vh] rounded-t-3xl border-white/10 bg-[#0B0F14] px-4 pb-8"
      >
        <SheetHeader className="px-0 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="font-heading text-2xl uppercase tracking-wide text-white">
                {matchModalStep === "team" ? "Pick your side" : "Pick your player"}
              </SheetTitle>
              <SheetDescription className="text-white/60">
                {getMatchLabel(match)} · {formatKickoff(match.kickoff)}
              </SheetDescription>
            </div>
            {match.status === "live" && (
              <Badge className="shrink-0 gap-1.5 bg-accent text-accent-foreground">
                <span className="live-pulse h-2 w-2 rounded-full bg-red-500" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs text-white/45">
            Join your team squad chat after you pick a player
          </p>
        </SheetHeader>

        <div className="mt-2 overflow-y-auto">
          {matchModalStep === "team" ? (
            <TeamPicker
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              onSelect={handleTeamSelect}
            />
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
      </SheetContent>
    </Sheet>
  );
}
