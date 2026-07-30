import type { Match, Player, Team } from "@/types";
import {
  API_FOOTBALL_BASE_URL,
  getApiFootballKey,
  MAX_FIXTURES_RETURNED,
  MAX_SQUAD_TEAMS,
} from "@/lib/matches/config";
import { mapApiTeam, teamNameToSlug } from "@/lib/matches/team-utils";
import { generateFallbackSquad } from "@/lib/matches/squad-fallback";
import { buildDevFallbackPayload } from "@/lib/matches/dev-fallback-fixtures";
import {
  deriveMatchStatus,
  getActiveMatch,
  getKickoffMs,
  hasSelectableFixtures,
} from "@/lib/matches/match-window";

interface ApiFootballFixtureTeam {
  id: number;
  name: string;
  logo: string;
  code?: string | null;
}

interface ApiFootballFixtureItem {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: { short: string; elapsed?: number | null };
  };
  league: { id: number; season: number; name?: string };
  teams: { home: ApiFootballFixtureTeam; away: ApiFootballFixtureTeam };
  venue?: { name?: string | null; city?: string | null };
}

interface ApiFootballSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

export interface ActiveMatchPayload {
  match: Match | null;
  teams: Team[];
  players: Player[];
  fixtures: Match[];
  /** True when API only returned finished historical fixtures and demo schedule is used. */
  demoSchedule?: boolean;
  demoReason?: string;
}

function apiHeaders(key: string): HeadersInit {
  return { "x-apisports-key": key };
}

async function apiFetch<T>(path: string, key: string): Promise<T> {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: apiHeaders(key),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    errors?: Record<string, string>;
    response: T;
  };

  if (payload.errors && Object.keys(payload.errors).length > 0) {
    const message = Object.values(payload.errors).join("; ");
    throw new Error(message || "API-Football returned errors");
  }

  return payload.response;
}

function mapFixture(item: ApiFootballFixtureItem): {
  match: Match;
  teams: Team[];
} {
  const homeTeam = mapApiTeam(item.teams.home);
  const awayTeam = mapApiTeam(item.teams.away);
  const kickoff = new Date(item.fixture.date).toISOString();
  const match: Match = {
    id: `af-${item.fixture.id}`,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    kickoff,
    status: "upcoming",
    venue: item.venue?.name ?? item.league.name ?? undefined,
    apiStatus: item.fixture.status.short,
    externalFixtureId: item.fixture.id,
  };
  match.status = deriveMatchStatus(match);
  return { match, teams: [homeTeam, awayTeam] };
}

function mapPosition(position: string | null): string {
  if (!position) return "Midfielder";
  const normalized = position.toLowerCase();
  if (normalized.includes("goalkeeper")) return "Goalkeeper";
  if (normalized.includes("defender")) return "Defender";
  if (normalized.includes("midfield")) return "Midfielder";
  if (normalized.includes("attacker") || normalized.includes("forward")) {
    return "Forward";
  }
  return position;
}

function mapSquadPlayer(
  apiPlayer: ApiFootballSquadPlayer,
  team: Team,
): Player {
  const slug = teamNameToSlug(apiPlayer.name);
  const color = team.color.replace("#", "");
  return {
    id: `${team.id}-${apiPlayer.id}`,
    teamId: team.id,
    name: apiPlayer.name,
    number: apiPlayer.number ?? 0,
    imageUrl:
      apiPlayer.photo ??
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${slug}&backgroundColor=${color}`,
    age: apiPlayer.age ?? 0,
    country: team.name,
    position: mapPosition(apiPlayer.position),
    club: "",
    stats: { goals: 0, assists: 0, caps: 0 },
  };
}

async function fetchFixturesForDate(
  key: string,
  date: string,
): Promise<ApiFootballFixtureItem[]> {
  return apiFetch<ApiFootballFixtureItem[]>(`/fixtures?date=${date}`, key);
}

async function fetchLiveFixtures(key: string): Promise<ApiFootballFixtureItem[]> {
  return apiFetch<ApiFootballFixtureItem[]>(`/fixtures?live=all`, key);
}

function mergeFixtureItems(
  ...groups: ApiFootballFixtureItem[][]
): ApiFootballFixtureItem[] {
  const byId = new Map<number, ApiFootballFixtureItem>();
  for (const group of groups) {
    for (const item of group) {
      byId.set(item.fixture.id, item);
    }
  }
  return [...byId.values()];
}

function addUtcDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isFinishedApiStatus(short: string): boolean {
  return ["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD"].includes(short);
}

/**
 * Prefer any live match worldwide; if none, fall back to today's / next-day
 * fixtures that are still upcoming (not finished).
 */
async function fetchSoccerFixtures(key: string): Promise<ApiFootballFixtureItem[]> {
  const live = await fetchLiveFixtures(key);
  if (live.length > 0) {
    return live.slice(0, MAX_FIXTURES_RETURNED);
  }

  const start = todayUtcDate();
  const [today, tomorrow] = await Promise.all([
    fetchFixturesForDate(key, start),
    fetchFixturesForDate(key, addUtcDays(start, 1)),
  ]);

  const upcoming = mergeFixtureItems(today, tomorrow)
    .filter((item) => !isFinishedApiStatus(item.fixture.status.short))
    .sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime(),
    );

  return upcoming.slice(0, MAX_FIXTURES_RETURNED);
}

export async function fetchSoccerFixturesCatalog(): Promise<{
  fixtures: Match[];
  teams: Team[];
  fixtureItems: ApiFootballFixtureItem[];
}> {
  const key = getApiFootballKey();
  if (!key) {
    throw new Error("API_FOOTBALL_KEY is not configured");
  }

  const items = await fetchSoccerFixtures(key);
  const fixtures: Match[] = [];
  const teamMap = new Map<string, Team>();

  const keptItems: ApiFootballFixtureItem[] = [];

  for (const item of items) {
    const mapped = mapFixture(item);
    // Drop already-finished fixtures so the picker only shows playable games.
    if (mapped.match.status === "finished") continue;
    fixtures.push(mapped.match);
    keptItems.push(item);
    for (const team of mapped.teams) {
      teamMap.set(team.id, team);
    }
  }

  fixtures.sort((a, b) => getKickoffMs(a) - getKickoffMs(b));

  return {
    fixtures,
    teams: [...teamMap.values()],
    fixtureItems: keptItems,
  };
}

/** @deprecated Use fetchSoccerFixturesCatalog — kept for any older imports. */
export async function fetchWorldCupFixtures() {
  return fetchSoccerFixturesCatalog();
}

async function fetchSquads(
  key: string,
  teamApiId: number,
): Promise<ApiFootballSquadPlayer[]> {
  try {
    const path = `/players/squads?team=${teamApiId}`;
    const response = await apiFetch<
      { team: ApiFootballFixtureTeam; players: ApiFootballSquadPlayer[] }[]
    >(path, key);
    return response[0]?.players ?? [];
  } catch {
    return [];
  }
}

async function resolveTeamPlayers(
  key: string,
  apiTeam: ApiFootballFixtureTeam,
  team: Team,
): Promise<Player[]> {
  const squad = await fetchSquads(key, apiTeam.id);
  if (squad.length > 0) {
    return squad.map((apiPlayer) => mapSquadPlayer(apiPlayer, team));
  }
  return generateFallbackSquad(team);
}

async function fetchPlayersForFixtures(
  fixtureItems: ApiFootballFixtureItem[],
  teams: Team[],
): Promise<Player[]> {
  const key = getApiFootballKey();
  if (!key || fixtureItems.length === 0) return [];

  const teamBySlug = new Map(teams.map((team) => [team.id, team]));
  const loadedTeamIds = new Set<string>();
  const players: Player[] = [];

  for (const item of fixtureItems) {
    const pairs: [ApiFootballFixtureTeam, string][] = [
      [item.teams.home, teamNameToSlug(item.teams.home.name)],
      [item.teams.away, teamNameToSlug(item.teams.away.name)],
    ];

    for (const [apiTeam, slug] of pairs) {
      if (loadedTeamIds.size >= MAX_SQUAD_TEAMS) return players;
      if (loadedTeamIds.has(slug)) continue;
      loadedTeamIds.add(slug);

      const team = teamBySlug.get(slug) ?? mapApiTeam(apiTeam);
      teamBySlug.set(slug, team);

      const teamPlayers = await resolveTeamPlayers(key, apiTeam, team);
      players.push(...teamPlayers);
    }
  }

  return players;
}

export async function fetchSquadsForFixture(
  item: ApiFootballFixtureItem,
  teams: Team[],
): Promise<Player[]> {
  return fetchPlayersForFixtures([item], teams);
}

export async function buildActiveMatchPayload(): Promise<ActiveMatchPayload> {
  let { fixtures, teams, fixtureItems } = await fetchSoccerFixturesCatalog();

  if (fixtures.length === 0) {
    const fallback = buildDevFallbackPayload();
    return {
      match: fallback.match,
      teams: fallback.teams,
      players: [],
      fixtures: fallback.fixtures,
    };
  }

  if (!hasSelectableFixtures(fixtures)) {
    const demo = buildDevFallbackPayload();
    return {
      ...demo,
      demoSchedule: true,
      demoReason:
        "API schedule has no live or upcoming matches — showing demo fixtures",
    };
  }

  const active = getActiveMatch(fixtures);

  // Prefer squads for the active match first, then fill remaining budget from
  // other fixtures so the match picker still has players when possible.
  const orderedItems = [...fixtureItems].sort((a, b) => {
    const aActive = active && `af-${a.fixture.id}` === active.id ? 0 : 1;
    const bActive = active && `af-${b.fixture.id}` === active.id ? 0 : 1;
    return aActive - bActive;
  });

  const players = await fetchPlayersForFixtures(orderedItems, teams);

  return {
    match: active ?? null,
    teams,
    players,
    fixtures,
  };
}
