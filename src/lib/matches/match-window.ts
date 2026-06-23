import type { Match, MatchStatus } from "@/types";
import {
  getFixtureDurationMinutes,
  ONE_HOUR_MS,
  SELECTION_OPENS_MS,
} from "@/lib/matches/config";

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD"]);
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);

export function getKickoffMs(match: Match): number {
  return new Date(match.kickoff).getTime();
}

export function getFixtureEndMs(match: Match, now = Date.now()): number {
  if (match.fixtureEndAt) {
    return new Date(match.fixtureEndAt).getTime();
  }
  return getKickoffMs(match) + getFixtureDurationMinutes() * 60 * 1000;
}

export function deriveMatchStatus(match: Match, now = new Date()): MatchStatus {
  const nowMs = now.getTime();
  const kickoffMs = getKickoffMs(match);
  const endMs = getFixtureEndMs(match, nowMs);

  if (match.apiStatus && FINISHED_STATUSES.has(match.apiStatus)) {
    return "finished";
  }

  if (match.apiStatus && LIVE_STATUSES.has(match.apiStatus)) {
    return "live";
  }

  if (nowMs >= endMs) return "finished";
  if (nowMs >= kickoffMs) return "live";
  return "upcoming";
}

export function isTeamSelectionOpen(match: Match, now = new Date()): boolean {
  const nowMs = now.getTime();
  const kickoffMs = getKickoffMs(match);
  const opensAt = kickoffMs - SELECTION_OPENS_MS;
  const endMs = getFixtureEndMs(match, nowMs);

  if (deriveMatchStatus(match, now) === "finished") return false;
  return nowMs >= opensAt && nowMs < endMs;
}

export function getSelectionOpensAt(match: Match): Date {
  return new Date(getKickoffMs(match) - SELECTION_OPENS_MS);
}

/** True when the match is live or kicks off within the next hour. */
export function isMatchLiveOrKickoffWithinHour(
  match: Match,
  now = new Date(),
): boolean {
  const nowMs = now.getTime();
  const status = deriveMatchStatus(match, now);
  if (status === "finished") return false;
  if (status === "live") return true;

  const kickoffMs = getKickoffMs(match);
  return kickoffMs > nowMs && kickoffMs <= nowMs + ONE_HOUR_MS;
}

export function hasAnyMatchInNextHour(
  matchList: Match[],
  now = new Date(),
): boolean {
  return matchList.some((match) => isMatchLiveOrKickoffWithinHour(match, now));
}

/**
 * User can pick team/player when:
 * - the match is in the T-60min selection window, or
 * - no match is live/kickoff within the next hour (early pick for latest upcoming).
 */
export function canPromptTeamSelection(
  match: Match | undefined,
  matchList: Match[],
  now = new Date(),
): boolean {
  if (!match) return false;

  const status = deriveMatchStatus(match, now);
  if (status === "finished") return false;

  if (isTeamSelectionOpen(match, now)) return true;

  if (!hasAnyMatchInNextHour(matchList, now) && status === "upcoming") {
    return true;
  }

  return false;
}

export function isEarlyTeamSelection(
  match: Match,
  matchList: Match[],
  now = new Date(),
): boolean {
  return canPromptTeamSelection(match, matchList, now) && !isTeamSelectionOpen(match, now);
}

export function getActiveMatch(
  matchList: Match[],
  now = new Date(),
): Match | undefined {
  if (matchList.length === 0) return undefined;

  const nowMs = now.getTime();
  const withDerived = matchList.map((match) => ({
    match,
    status: deriveMatchStatus(match, now),
    kickoffMs: getKickoffMs(match),
  }));

  const inWindow = withDerived
    .filter(({ match }) => isTeamSelectionOpen(match, now))
    .sort((a, b) => a.kickoffMs - b.kickoffMs);
  if (inWindow.length > 0) return inWindow[0].match;

  const live = withDerived
    .filter(({ status }) => status === "live")
    .sort((a, b) => a.kickoffMs - b.kickoffMs);
  if (live.length > 0) return live[0].match;

  const upcoming = withDerived
    .filter(({ status }) => status === "upcoming")
    .sort((a, b) => a.kickoffMs - b.kickoffMs);
  if (upcoming.length > 0) return upcoming[0].match;

  const recentFinished = withDerived
    .filter(({ status }) => status === "finished")
    .sort((a, b) => b.kickoffMs - a.kickoffMs);
  if (recentFinished.length > 0 && nowMs - recentFinished[0].kickoffMs < 24 * 60 * 60 * 1000) {
    return recentFinished[0].match;
  }

  return undefined;
}

/** Upcoming fixtures kicking off within the next N hours (default 24). */
export function getUpcomingMatchesWithinHours(
  matchList: Match[],
  hours = 24,
  now = new Date(),
): Match[] {
  const nowMs = now.getTime();
  const windowEndMs = nowMs + hours * 60 * 60 * 1000;

  return matchList
    .filter((match) => {
      const status = deriveMatchStatus(match, now);
      if (status !== "upcoming") return false;
      const kickoffMs = getKickoffMs(match);
      return kickoffMs > nowMs && kickoffMs <= windowEndMs;
    })
    .sort((a, b) => getKickoffMs(a) - getKickoffMs(b));
}

/** Soonest upcoming fixtures, regardless of time window. */
export function getNextUpcomingMatches(
  matchList: Match[],
  limit = 3,
  now = new Date(),
): Match[] {
  const nowMs = now.getTime();

  return matchList
    .filter((match) => {
      const status = deriveMatchStatus(match, now);
      if (status !== "upcoming") return false;
      return getKickoffMs(match) > nowMs;
    })
    .sort((a, b) => getKickoffMs(a) - getKickoffMs(b))
    .slice(0, limit);
}

/** Primary match for T-60 / live selection (alias of getActiveMatch). */
export function getPrimarySelectableMatch(
  matchList: Match[],
  now = new Date(),
): Match | undefined {
  return getActiveMatch(matchList, now);
}

export function formatTimeUntil(date: Date, now = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return "now";

  const totalMinutes = Math.ceil(diffMs / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}
