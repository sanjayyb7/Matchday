import type { Match, Team } from "@/types";
import { MAX_FIXTURES_RETURNED } from "@/lib/matches/config";
import {
  deriveMatchStatus,
  getKickoffMs,
} from "@/lib/matches/match-window";
import {
  guessCountryCode,
  teamColorForSlug,
  teamNameToSlug,
} from "@/lib/matches/team-utils";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

/** Free-tier friendly slate: PL, La Liga (PD), Bundesliga (BL1), MLS. */
const DEFAULT_COMPETITIONS = ["PL", "PD", "BL1", "MLS"] as const;

export function getFootballDataApiKey(): string | undefined {
  return (
    process.env.FOOTBALL_DATA_API_KEY?.trim() ||
    process.env.FOOTBALL_DATA_TOKEN?.trim()
  );
}

export class FootballDataQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FootballDataQuotaError";
  }
}

export function isFootballDataQuotaError(error: unknown): boolean {
  if (error instanceof FootballDataQuotaError) return true;
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("quota") ||
    /\(429\)/.test(error.message)
  );
}

interface FdTeam {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  venue?: string | null;
  competition?: {
    id?: number;
    name?: string | null;
    code?: string | null;
  } | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score?: {
    fullTime?: { home?: number | null; away?: number | null };
    halfTime?: { home?: number | null; away?: number | null };
  } | null;
}

interface ThrottleInfo {
  requestsAvailable: number | null;
  resetSeconds: number | null;
}

function readThrottleHeaders(headers: Headers): ThrottleInfo {
  // Docs: X-RequestsAvailable + X-RequestCounter-Reset
  // Some clients also report X-Requests-Available-Minute variants.
  const availableRaw =
    headers.get("X-RequestsAvailable") ??
    headers.get("x-requestsavailable") ??
    headers.get("X-Requests-Available-Minute") ??
    headers.get("x-requests-available-minute");
  const resetRaw =
    headers.get("X-RequestCounter-Reset") ??
    headers.get("x-requestcounter-reset");

  const requestsAvailable =
    availableRaw != null && availableRaw !== ""
      ? Number(availableRaw)
      : null;
  const resetSeconds =
    resetRaw != null && resetRaw !== "" ? Number(resetRaw) : null;

  return {
    requestsAvailable: Number.isFinite(requestsAvailable)
      ? requestsAvailable
      : null,
    resetSeconds: Number.isFinite(resetSeconds) ? resetSeconds : null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapStatusToApiStatus(status: string): string {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "NS";
    case "IN_PLAY":
    case "EXTRA_TIME":
    case "PENALTY_SHOOTOUT":
      return "1H";
    case "PAUSED":
      return "HT";
    case "FINISHED":
    case "AWARDED":
      return "FT";
    case "SUSPENDED":
    case "POSTPONED":
    case "CANCELLED":
      return "FT";
    default:
      return "NS";
  }
}

function mapFdTeam(apiTeam: FdTeam): Team {
  const name = (apiTeam.shortName || apiTeam.name || "Team").trim();
  const id = teamNameToSlug(name);
  return {
    id,
    name,
    flagUrl: apiTeam.crest?.trim() || `/assets/flags/${id}.svg`,
    countryCode: guessCountryCode(name, apiTeam.tla),
    color: teamColorForSlug(id),
  };
}

function mapFdMatch(item: FdMatch): { match: Match; teams: Team[] } | null {
  if (!item.homeTeam?.name || !item.awayTeam?.name || !item.utcDate) {
    return null;
  }

  const homeTeam = mapFdTeam(item.homeTeam);
  const awayTeam = mapFdTeam(item.awayTeam);
  const apiStatus = mapStatusToApiStatus(item.status);
  const full = item.score?.fullTime;

  const match: Match = {
    id: `fd-${item.id}`,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    kickoff: new Date(item.utcDate).toISOString(),
    status: "upcoming",
    venue: item.venue ?? undefined,
    league: item.competition?.name?.trim() || undefined,
    leagueId: item.competition?.id,
    apiStatus,
    homeScore: full?.home ?? null,
    awayScore: full?.away ?? null,
    elapsedMinutes: null,
    externalFixtureId: item.id,
  };
  match.status = deriveMatchStatus(match);
  return { match, teams: [homeTeam, awayTeam] };
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Exclusive end date (football-data dateTo excludes that calendar day). */
function exclusiveEndDateThroughSunday(fromDate: string): string {
  const date = new Date(`${fromDate}T12:00:00Z`);
  // Advance until Monday after this coming Sunday, then use that as exclusive dateTo.
  const day = date.getUTCDay(); // 0 Sun .. 6 Sat
  const daysUntilSunday = (7 - day) % 7;
  const sunday = new Date(date);
  sunday.setUTCDate(sunday.getUTCDate() + daysUntilSunday);
  const monday = new Date(sunday);
  monday.setUTCDate(monday.getUTCDate() + 1);
  return monday.toISOString().slice(0, 10);
}

async function footballDataFetch(
  path: string,
  key: string,
): Promise<{ matches: FdMatch[]; throttle: ThrottleInfo }> {
  const url = `${FOOTBALL_DATA_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": key,
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  const throttle = readThrottleHeaders(response.headers);

  // Daniel's guidance: examine response headers for automatic throttling.
  if (
    throttle.requestsAvailable === 0 &&
    throttle.resetSeconds != null &&
    throttle.resetSeconds > 0 &&
    throttle.resetSeconds <= 5
  ) {
    await sleep(throttle.resetSeconds * 1000 + 50);
  }

  if (response.status === 429) {
    throw new FootballDataQuotaError(
      `football-data.org rate limit (429); reset in ${throttle.resetSeconds ?? "?"}s`,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      errorCode?: number;
    };
    const message =
      body.message ||
      body.error ||
      `football-data.org request failed (${response.status})`;

    if (response.status === 403 || isFootballDataQuotaError(new Error(message))) {
      throw new FootballDataQuotaError(message);
    }
    throw new Error(message);
  }

  if (
    throttle.requestsAvailable != null &&
    throttle.requestsAvailable <= 1 &&
    throttle.resetSeconds != null &&
    throttle.resetSeconds > 0
  ) {
    console.warn(
      `[matches] football-data.org low quota: ${throttle.requestsAvailable} left, reset in ${throttle.resetSeconds}s`,
    );
  }

  const payload = (await response.json()) as { matches?: FdMatch[] };
  return {
    matches: Array.isArray(payload.matches) ? payload.matches : [],
    throttle,
  };
}

/**
 * Fetch PL / La Liga / Bundesliga / MLS through this weekend (one request to
 * stay under free-tier 10 req/min). Maps into the same Match/Team shape.
 */
export async function fetchFootballDataFixturesCatalog(): Promise<{
  fixtures: Match[];
  teams: Team[];
}> {
  const key = getFootballDataApiKey();
  if (!key) {
    throw new Error("FOOTBALL_DATA_API_KEY is not configured");
  }

  const dateFrom = todayUtcDate();
  const dateTo = exclusiveEndDateThroughSunday(dateFrom);
  const competitions = DEFAULT_COMPETITIONS.join(",");

  const { matches, throttle } = await footballDataFetch(
    `/matches?competitions=${encodeURIComponent(competitions)}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
    key,
  );

  console.info(
    `[matches] football-data.org ok: ${matches.length} matches; remaining=${throttle.requestsAvailable ?? "?"}; reset=${throttle.resetSeconds ?? "?"}s`,
  );

  const fixtures: Match[] = [];
  const teamMap = new Map<string, Team>();

  for (const item of matches) {
    const mapped = mapFdMatch(item);
    if (!mapped) continue;
    if (mapped.match.status === "finished") continue;
    fixtures.push(mapped.match);
    for (const team of mapped.teams) {
      teamMap.set(team.id, team);
    }
  }

  fixtures.sort((a, b) => getKickoffMs(a) - getKickoffMs(b));

  return {
    fixtures: fixtures.slice(0, MAX_FIXTURES_RETURNED),
    teams: [...teamMap.values()],
  };
}
