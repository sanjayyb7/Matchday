import type { Match, Player, Team } from "@/types";
import { MAX_FIXTURES_RETURNED } from "@/lib/matches/config";
import { enrichPlayersWithApiFootballPhotos } from "@/lib/matches/api-football-photos";
import { enrichPlayersWithTheSportsDbPhotos } from "@/lib/matches/thesportsdb-photos";
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

async function footballDataGet<T>(
  path: string,
  key: string,
  init?: { revalidate?: number },
): Promise<{ data: T; throttle: ThrottleInfo }> {
  const url = `${FOOTBALL_DATA_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": key,
      Accept: "application/json",
    },
    next: { revalidate: init?.revalidate ?? 60 },
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

  const data = (await response.json()) as T;
  return { data, throttle };
}

async function footballDataFetch(
  path: string,
  key: string,
): Promise<{ matches: FdMatch[]; throttle: ThrottleInfo }> {
  const { data, throttle } = await footballDataGet<{ matches?: FdMatch[] }>(
    path,
    key,
  );
  return {
    matches: Array.isArray(data.matches) ? data.matches : [],
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

interface FdSquadPlayer {
  id: number;
  name: string;
  position?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  shirtNumber?: number | null;
}

interface FdTeamDetail extends FdTeam {
  squad?: FdSquadPlayer[];
}

interface FdMatchDetail {
  id: number;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
}

function normalizePosition(position: string | null | undefined): string {
  if (!position) return "Midfielder";
  const raw = position.toLowerCase();
  if (raw.includes("goal")) return "Goalkeeper";
  if (raw.includes("def") || raw.includes("back")) return "Defender";
  if (raw.includes("mid")) return "Midfielder";
  if (
    raw.includes("forward") ||
    raw.includes("attack") ||
    raw.includes("wing") ||
    raw.includes("strik") ||
    raw.includes("centre-forward")
  ) {
    return "Forward";
  }
  return "Midfielder";
}

function ageFromDob(dob?: string | null): number {
  if (!dob) return 0;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diff = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

function playerAvatarUrl(playerName: string, team: Team): string {
  const seed = encodeURIComponent(`${team.id}-${playerName}`);
  const color = team.color.replace("#", "");
  return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}&backgroundColor=${color}`;
}

function mapFdSquadPlayer(
  apiPlayer: FdSquadPlayer,
  team: Team,
  index: number,
): Player {
  return {
    id: `fd-${team.id}-${apiPlayer.id}`,
    teamId: team.id,
    name: apiPlayer.name.trim(),
    number: apiPlayer.shirtNumber ?? index + 1,
    imageUrl: playerAvatarUrl(apiPlayer.name, team),
    age: ageFromDob(apiPlayer.dateOfBirth),
    country: apiPlayer.nationality?.trim() || team.name,
    position: normalizePosition(apiPlayer.position),
    club: team.name,
    stats: { goals: 0, assists: 0, caps: 0 },
  };
}

/**
 * Load squads for a football-data.org fixture. Costs up to three API requests
 * (match + two team lookups); free tier caps at 10/min so this is fine when
 * called on-demand from the match picker.
 */
export async function fetchFootballDataSquadForMatch(
  matchId: string,
): Promise<{ teams: Team[]; players: Player[] }> {
  const key = getFootballDataApiKey();
  if (!key) {
    throw new Error("FOOTBALL_DATA_API_KEY is not configured");
  }

  const fixtureId = Number(String(matchId).replace(/^fd-/, ""));
  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    throw new Error("Invalid football-data match id");
  }

  const matchResp = await footballDataGet<FdMatchDetail | { match?: FdMatchDetail }>(
    `/matches/${fixtureId}`,
    key,
    { revalidate: 3600 },
  );

  const match =
    "homeTeam" in matchResp.data
      ? (matchResp.data as FdMatchDetail)
      : (matchResp.data as { match?: FdMatchDetail }).match;

  if (!match?.homeTeam?.id || !match?.awayTeam?.id) {
    throw new Error("football-data match missing teams");
  }

  const [homeResp, awayResp] = await Promise.all([
    footballDataGet<FdTeamDetail>(`/teams/${match.homeTeam.id}`, key, {
      revalidate: 24 * 3600,
    }),
    footballDataGet<FdTeamDetail>(`/teams/${match.awayTeam.id}`, key, {
      revalidate: 24 * 3600,
    }),
  ]);

  const teams: Team[] = [];
  const players: Player[] = [];

  const teamSquadPairs: { team: Team; rawSquad: FdSquadPlayer[] }[] = [];
  for (const teamPayload of [homeResp.data, awayResp.data]) {
    const mappedTeam: Team = {
      id: teamNameToSlug(teamPayload.shortName || teamPayload.name),
      name: (teamPayload.shortName || teamPayload.name).trim(),
      flagUrl:
        teamPayload.crest?.trim() ||
        `/assets/flags/${teamNameToSlug(teamPayload.name)}.svg`,
      countryCode: guessCountryCode(teamPayload.name, teamPayload.tla),
      color: teamColorForSlug(teamNameToSlug(teamPayload.name)),
    };
    teams.push(mappedTeam);
    teamSquadPairs.push({ team: mappedTeam, rawSquad: teamPayload.squad ?? [] });
  }

  const enrichedGroups = await Promise.all(
    teamSquadPairs.map(async ({ team, rawSquad }) => {
      const mapped = rawSquad.map((squadPlayer, index) =>
        mapFdSquadPlayer(squadPlayer, team, index),
      );
      const withApiFootball = await enrichPlayersWithApiFootballPhotos(
        mapped,
        team,
      );
      return enrichPlayersWithTheSportsDbPhotos(withApiFootball, team);
    }),
  );

  for (const group of enrichedGroups) {
    players.push(...group);
  }

  return { teams, players };
}
