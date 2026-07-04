import type { Match, Player, Team } from "@/types";
import {
  API_FOOTBALL_BASE_URL,
  getApiFootballKey,
  getWcLeagueId,
  getWcSeason,
} from "@/lib/matches/config";
import { mapApiTeam, teamNameToSlug } from "@/lib/matches/team-utils";
import { generateFallbackSquad } from "@/lib/matches/squad-fallback";
import { buildDevFallbackPayload } from "@/lib/matches/dev-fallback-fixtures";
import {
  deriveMatchStatus,
  getActiveMatch,
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
  league: { id: number; season: number };
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
    next: { revalidate: 900 },
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
    id: `wc-${item.fixture.id}`,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    kickoff,
    status: "upcoming",
    venue: item.venue?.name ?? undefined,
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
  const path = `/fixtures?date=${date}`;
  return apiFetch<ApiFootballFixtureItem[]>(path, key);
}

async function fetchLiveFixtures(key: string): Promise<ApiFootballFixtureItem[]> {
  return apiFetch<ApiFootballFixtureItem[]>(`/fixtures?live=all`, key);
}

function filterWorldCupFixtures(
  items: ApiFootballFixtureItem[],
): ApiFootballFixtureItem[] {
  const leagueId = getWcLeagueId();
  return items.filter((item) => item.league.id === leagueId);
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

async function fetchUpcomingWorldCupFixtures(
  key: string,
): Promise<ApiFootballFixtureItem[]> {
  const start = todayUtcDate();
  const batches = await Promise.all(
    Array.from({ length: 14 }, (_, index) =>
      fetchFixturesForDate(key, addUtcDays(start, index)),
    ),
  );
  return filterWorldCupFixtures(batches.flat());
}

async function fetchUpcomingFixtures(key: string): Promise<ApiFootballFixtureItem[]> {
  const upcoming = await fetchUpcomingWorldCupFixtures(key);
  if (upcoming.length > 0) return upcoming;

  // Legacy fallback — often empty for WC 2026 in API-Football.
  const league = getWcLeagueId();
  const season = getWcSeason();
  // Free tier does not support the `next` query param — fetch by league + season only.
  const path = `/fixtures?league=${league}&season=${season}`;
  return apiFetch<ApiFootballFixtureItem[]>(path, key);
}

async function fetchSquads(
  key: string,
  teamApiId: number,
): Promise<ApiFootballSquadPlayer[]> {
  try {
    // The squads endpoint rejects a season param ("The Season field do not exist").
    const path = `/players/squads?team=${teamApiId}`;
    const response = await apiFetch<
      { team: ApiFootballFixtureTeam; players: ApiFootballSquadPlayer[] }[]
    >(path, key);
    return response[0]?.players ?? [];
  } catch {
    return [];
  }
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchWorldCupFixtures(): Promise<{
  fixtures: Match[];
  teams: Team[];
  fixtureItems: ApiFootballFixtureItem[];
}> {
  const key = getApiFootballKey();
  if (!key) {
    throw new Error("API_FOOTBALL_KEY is not configured");
  }

  let items = mergeFixtureItems(
    filterWorldCupFixtures(await fetchFixturesForDate(key, todayUtcDate())),
    filterWorldCupFixtures(await fetchLiveFixtures(key)),
  );

  if (items.length === 0) {
    items = await fetchUpcomingFixtures(key);
  }

  const fixtures: Match[] = [];
  const teamMap = new Map<string, Team>();

  for (const item of items) {
    const mapped = mapFixture(item);
    fixtures.push(mapped.match);
    for (const team of mapped.teams) {
      teamMap.set(team.id, team);
    }
  }

  fixtures.sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  );

  return {
    fixtures,
    teams: [...teamMap.values()],
    fixtureItems: items,
  };
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
  let { fixtures, teams, fixtureItems } = await fetchWorldCupFixtures();

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
  const players = await fetchPlayersForFixtures(fixtureItems, teams);

  return {
    match: active ?? null,
    teams,
    players,
    fixtures,
  };
}
