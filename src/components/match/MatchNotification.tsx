"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { mockHistoryAdapter } from "@/lib/history/mock-adapter";
import type { Player } from "@/types";

export function MatchNotification() {
  const { user } = useAuth();
  const { showMatchModal } = useMatchIdentity(user?.id);
  const matchModalStep = useMatchdayStore((s) => s.matchModalStep);
  const selectedTeamId = useMatchdayStore((s) => s.selectedTeamId);
  const setMatchModalStep = useMatchdayStore((s) => s.setMatchModalStep);
  const setSelectedTeamId = useMatchdayStore((s) => s.setSelectedTeamId);
  const closeMatchModal = useMatchdayStore((s) => s.closeMatchModal);
  const setIdentity = useMatchdayStore((s) => s.setIdentity);

  const match = getLiveOrUpcomingMatch();
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
    mockHistoryAdapter.recordMatchAttendance({
      userId: user.id,
      matchId: match.id,
      teamId: selectedTeamId,
      playerId: player.id,
      attendedAt: new Date().toISOString(),
      matchLabel: getMatchLabel(match),
    });
    closeMatchModal();
  };

  return (
    <Dialog open={showMatchModal} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md border-white/10 bg-card"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl uppercase tracking-wide">
            {matchModalStep === "team" ? "Pick your side" : "Pick your player"}
          </DialogTitle>
          <DialogDescription>
            {getMatchLabel(match)} — represent your team on the map
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
