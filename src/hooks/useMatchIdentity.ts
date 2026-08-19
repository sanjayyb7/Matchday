"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getLiveOrUpcomingMatch,
  isIdentityStillActive,
  matches,
  refreshActiveMatchFromApi,
} from "@/lib/mock/data";
import {
  canPromptTeamSelection,
  isEarlyTeamSelection,
  isTeamSelectionOpen,
} from "@/lib/matches/match-window";
import { useMatchdayStore } from "@/store/matchday-store";

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

  // One hydrate only — day schedule is shared server-side; no score polling.
  useEffect(() => {
    let cancelled = false;
    void refreshActiveMatchFromApi().then(() => {
      if (!cancelled) setTick((value) => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeMatch = getLiveOrUpcomingMatch();
  // Being in *a* squad is what matters, not being in the featured one.
  const hasIdentity = isIdentityStillActive(identity, userId);
  const canPrompt = activeMatch
    ? canPromptTeamSelection(activeMatch, matches)
    : false;
  const isEarlyPick = activeMatch
    ? isEarlyTeamSelection(activeMatch, matches)
    : false;
  const onChatPage = pathname.startsWith("/chat");

  // Retire a squad pick only once its own match is over. Clearing it because
  // some other fixture became "next" silently revoked chat access, since the
  // chat_messages RLS policy is keyed off the user's identity row.
  useEffect(() => {
    if (!userId || !identity) return;
    if (identity.userId !== userId) {
      setIdentity(null);
      return;
    }
    if (!isIdentityStillActive(identity, userId)) {
      setIdentity(null);
    }
  }, [userId, identity, setIdentity, tick]);

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
