/** API-Football base URL — https://v3.football.api-sports.io */
export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

export function getApiFootballKey(): string | undefined {
  return process.env.API_FOOTBALL_KEY;
}

export function getWcLeagueId(): number {
  const raw = process.env.API_FOOTBALL_WC_LEAGUE_ID ?? "1";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 1;
}

export function getWcSeason(): number {
  const raw = process.env.API_FOOTBALL_WC_SEASON ?? "2026";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 2026;
}

export function getFixtureDurationMinutes(): number {
  const raw = process.env.MATCH_FIXTURE_DURATION_MINUTES ?? "105";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 105;
}

export const SELECTION_OPENS_MS = 60 * 60 * 1000;
export const ONE_HOUR_MS = 60 * 60 * 1000;

export const ACTIVE_MATCH_CACHE_SECONDS = 15 * 60;
