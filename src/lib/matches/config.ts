/** API-Football base URL — https://v3.football.api-sports.io */
export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

/**
 * Returns all configured API-Football keys, in order.
 * Supports API_FOOTBALL_KEY, API_FOOTBALL_KEY_2, API_FOOTBALL_KEY_3, ... so a
 * second (or third) free-tier account can act as automatic daily-quota backup.
 */
export function getApiFootballKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.API_FOOTBALL_KEY?.trim();
  if (primary) keys.push(primary);
  for (let i = 2; i <= 10; i++) {
    const extra = process.env[`API_FOOTBALL_KEY_${i}`]?.trim();
    if (extra) keys.push(extra);
  }
  return keys;
}

export function getApiFootballKey(): string | undefined {
  return getApiFootballKeys()[0];
}

export function getFixtureDurationMinutes(): number {
  const raw = process.env.MATCH_FIXTURE_DURATION_MINUTES ?? "105";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 105;
}

export const SELECTION_OPENS_MS = 60 * 60 * 1000;
export const ONE_HOUR_MS = 60 * 60 * 1000;

/** Legacy HTTP hint — day schedule now uses SF date cache in InsForge. */
export const ACTIVE_MATCH_CACHE_SECONDS = 6 * 60 * 60;

/** Cap how many live/upcoming fixtures we surface from API-Football. */
export const MAX_FIXTURES_RETURNED = 40;

/** Cap squad API calls (2 teams per fixture) to stay within free-tier limits. */
export const MAX_SQUAD_TEAMS = 8;

