"use client";

import { useEffect } from "react";
import {
  getLiveOrUpcomingMatch,
  identityMatchesActiveMatch,
} from "@/lib/mock/data";
import { useMatchdayStore } from "@/store/matchday-store";

export function useMatchIdentity(userId?: string) {
  const identity = useMatchdayStore((s) => s.identity);
  const showMatchModal = useMatchdayStore((s) => s.showMatchModal);
  const openMatchModal = useMatchdayStore((s) => s.openMatchModal);
  const activeMatch = getLiveOrUpcomingMatch();

  useEffect(() => {
    if (!userId || !activeMatch) return;
    if (identityMatchesActiveMatch(identity, userId, activeMatch)) return;
    openMatchModal();
  }, [userId, identity, activeMatch?.id, openMatchModal]);

  return { identity, showMatchModal, activeMatch };
}
