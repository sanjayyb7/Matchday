"use client";

import { useEffect } from "react";
import { getLiveOrUpcomingMatch } from "@/lib/mock/data";
import { useMatchdayStore } from "@/store/matchday-store";

export function useMatchIdentity(userId?: string) {
  const identity = useMatchdayStore((s) => s.identity);
  const showMatchModal = useMatchdayStore((s) => s.showMatchModal);
  const openMatchModal = useMatchdayStore((s) => s.openMatchModal);

  useEffect(() => {
    if (!userId) return;
    const match = getLiveOrUpcomingMatch();
    if (!match) return;
    if (identity?.matchId === match.id && identity.userId === userId) return;
    openMatchModal();
  }, [userId, identity, openMatchModal]);

  return { identity, showMatchModal, activeMatch: getLiveOrUpcomingMatch() };
}
