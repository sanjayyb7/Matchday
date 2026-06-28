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
  matches,
} from "@/lib/mock/data";
import {
  canPromptTeamSelection,
  formatTimeUntil,
  getSelectionOpensAt,
  isTeamSelectionOpen,
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
  const canPrompt = activeMatch
    ? canPromptTeamSelection(activeMatch, matches)
    : false;
  const matchStatus = activeMatch ? getDerivedMatchStatus(activeMatch) : null;
  const fetchError = getLastMatchFetchError();
  const showFallbackBanner = isUsingFallbackFixtures() && !!fetchError;

  const fallbackBanner = showFallbackBanner ? (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100/90">
      Live schedule unavailable — showing demo fixtures
      {fetchError ? (
        <span className="mt-0.5 block text-amber-100/70">{fetchError}</span>
      ) : null}
    </div>
  ) : null;

  if (!hydrated) {
    return (
      <div
        className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#0B0F14]"
        style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
      >
        <div className="live-pulse h-3 w-3 rounded-full bg-primary" />
        <p className="text-sm text-white/50">Loading matches…</p>
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

  if (activeMatch && isTeamSelectionOpen(activeMatch) && canPrompt) {
    return (
      <>
        {fallbackBanner}
        <MatchSelectionPanel match={activeMatch} />
      </>
    );
  }

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
      className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#0B0F14] px-6 text-center"
      style={{ paddingBottom: BOTTOM_NAV_CLEARANCE }}
    >
      {fallbackBanner}
      <p className="font-heading text-xl font-bold uppercase tracking-wide text-white">
        Pick your side first
      </p>
      <p className="max-w-sm text-sm text-white/55">
        {activeMatch
          ? matchStatus === "finished"
            ? `Team selection for ${getMatchLabel(activeMatch)} has closed.`
            : `Team selection opens in ${formatTimeUntil(getSelectionOpensAt(activeMatch))} for ${getMatchLabel(activeMatch)}.`
          : "No World Cup match scheduled right now. Check back on matchday."}
      </p>
    </div>
  );
}
