"use client";

import { useState } from "react";
import {
  getLiveOrUpcomingMatch,
  getMatchLabel,
  getDerivedMatchStatus,
  getDisplayableUpcomingMatches,
  getLastMatchFetchError,
  isActiveMatchHydrated,
  isUsingFallbackFixtures,
} from "@/lib/mock/data";
import {
  formatTimeUntil,
  getSelectionOpensAt,
} from "@/lib/matches/match-window";
import { BOTTOM_NAV_CLEARANCE } from "@/lib/layout/constants";
import { useAuth } from "@/hooks/useAuth";
import { useMatchIdentity } from "@/hooks/useMatchIdentity";
import { MatchSelectionPanel } from "./MatchSelectionPanel";
import { UpcomingMatchList } from "./UpcomingMatchList";
import type { Match } from "@/types";

export function MatchChatGate() {
  const { user } = useAuth();
  const { tick } = useMatchIdentity(user?.id);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  void tick;

  const hydrated = isActiveMatchHydrated();
  const activeMatch = getLiveOrUpcomingMatch();
  const upcoming = getDisplayableUpcomingMatches();
  const matchStatus = activeMatch ? getDerivedMatchStatus(activeMatch) : null;
  const fetchError = getLastMatchFetchError();
  const showFallbackBanner = isUsingFallbackFixtures() && !!fetchError;

  const fallbackBanner = showFallbackBanner ? (
    <div className="border-b-2 border-ink bg-c-amber px-4 py-2 text-center font-utility text-xs text-ink">
      Live schedule unavailable — showing demo matches
      {fetchError ? (
        <span className="mt-0.5 block text-ink-muted">{fetchError}</span>
      ) : null}
    </div>
  ) : null;

  if (!hydrated) {
    return (
      <div
        className="flex h-dvh flex-col items-center justify-center gap-3 bg-paper"
        style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
      >
        <div className="live-pulse h-3 w-3 rounded-full bg-live" />
        <p className="font-utility text-sm text-ink-muted">Loading matches…</p>
      </div>
    );
  }

  if (selectedMatch) {
    return (
      <>
        {fallbackBanner}
        <MatchSelectionPanel
          match={selectedMatch}
          onBack={() => setSelectedMatch(null)}
        />
      </>
    );
  }

  // Always show the full live/upcoming list when fixtures exist. Auto-opening
  // the first live game (often an obscure league) hid every other match.
  if (upcoming.length > 0) {
    return (
      <>
        {fallbackBanner}
        <UpcomingMatchList matches={upcoming} onSelect={setSelectedMatch} />
      </>
    );
  }

  return (
    <div
      className="flex h-dvh flex-col items-center justify-center gap-4 bg-paper px-6 text-center"
      style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      {fallbackBanner}
      <p className="font-display text-block text-ink">
        Pick your side first
      </p>
      <p className="max-w-sm font-utility text-sm text-ink-muted">
        {activeMatch
          ? matchStatus === "finished"
            ? `Team selection for ${getMatchLabel(activeMatch)} has closed.`
            : `Team selection opens in ${formatTimeUntil(getSelectionOpensAt(activeMatch))} for ${getMatchLabel(activeMatch)}.`
          : "No live or upcoming soccer match right now. Check back soon."}
      </p>
    </div>
  );
}
