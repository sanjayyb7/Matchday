"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getLiveOrUpcomingMatch,
  identityMatchesActiveMatch,
  matches,
  refreshActiveMatchFromApi,
} from "@/lib/mock/data";
import {
  canPromptTeamSelection,
  isEarlyTeamSelection,
  isTeamSelectionOpen,
} from "@/lib/matches/match-window";
import { useMatchdayStore } from "@/store/matchday-store";

const REFRESH_INTERVAL_MS = 60_000;

function reminderDismissKey(matchId: string): string {
  return `matchday:reminder-dismissed:${matchId}`;
}

export function useMatchIdentity(userId?: string) {
  const identity = useMatchdayStore((s) => s.identity);
  const setIdentity = useMatchdayStore((s) => s.setIdentity);
  const showMatchReminder = useMatchdayStore((s) => s.showMatchReminder);
  const openMatchReminder = useMatchdayStore((s) => s.openMatchReminder);
  const closeMatchReminder = useMatchdayStore((s) => s.closeMatchReminder);
  const pathname = usePathname();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      await refreshActiveMatchFromApi();
      if (!cancelled) setTick((value) => value + 1);
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const activeMatch = getLiveOrUpcomingMatch();
  const hasIdentity = identityMatchesActiveMatch(identity, userId, activeMatch);
  const canPrompt = activeMatch
    ? canPromptTeamSelection(activeMatch, matches)
    : false;
  const isEarlyPick = activeMatch
    ? isEarlyTeamSelection(activeMatch, matches)
    : false;
  const onChatPage = pathname.startsWith("/chat");

  useEffect(() => {
    if (!userId || !activeMatch || !identity) return;
    if (
      identity.userId === userId &&
      identity.matchId !== activeMatch.id
    ) {
      setIdentity(null);
    }
  }, [userId, activeMatch?.id, identity, setIdentity]);

  useEffect(() => {
    if (!userId || !activeMatch) {
      closeMatchReminder();
      return;
    }

    if (hasIdentity) {
      closeMatchReminder();
      return;
    }

    const inSelectionWindow =
      isTeamSelectionOpen(activeMatch) && canPrompt && !isEarlyPick;

    if (!inSelectionWindow || onChatPage) {
      closeMatchReminder();
      return;
    }

    const dismissed =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(reminderDismissKey(activeMatch.id)) === "1";

    if (!dismissed && !showMatchReminder) {
      openMatchReminder();
    }
  }, [
    userId,
    activeMatch?.id,
    activeMatch?.kickoff,
    hasIdentity,
    canPrompt,
    isEarlyPick,
    onChatPage,
    showMatchReminder,
    openMatchReminder,
    closeMatchReminder,
    tick,
  ]);

  return {
    identity,
    activeMatch,
    canPrompt,
    isEarlyPick,
    hasIdentity,
    tick,
  };
}

export function dismissMatchReminder(matchId: string): void {
  sessionStorage.setItem(reminderDismissKey(matchId), "1");
}
