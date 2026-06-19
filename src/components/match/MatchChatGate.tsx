"use client";

import { getLiveOrUpcomingMatch, getMatchLabel } from "@/lib/mock/data";
import { useMatchdayStore } from "@/store/matchday-store";
import { Button } from "@/components/ui/button";

export function MatchChatGate() {
  const openMatchModal = useMatchdayStore((s) => s.openMatchModal);
  const match = getLiveOrUpcomingMatch();

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#0B0F14] px-6 text-center">
      <p className="font-heading text-xl font-bold uppercase tracking-wide text-white">
        Pick your side first
      </p>
      <p className="max-w-sm text-sm text-white/55">
        {match
          ? `Choose a team and player for ${getMatchLabel(match)} to join your squad chat.`
          : "No active match right now. Check back when the next matchday starts."}
      </p>
      {match && (
        <Button
          className="rounded-xl"
          onClick={() => openMatchModal()}
        >
          Open match picker
        </Button>
      )}
    </div>
  );
}
