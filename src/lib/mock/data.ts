import pubsData from "../../../data/pubs.json";
import matchesData from "../../../data/matches.json";
import teamsData from "../../../data/teams.json";
import spainPlayers from "../../../data/players/spain.json";
import francePlayers from "../../../data/players/france.json";
import {
  deriveMatchStatus,
  getActiveMatch,
  getKickoffMs,
  getNextUpcomingMatches,
  getUpcomingMatchesWithinHours,
} from "@/lib/matches/match-window";
import type { Match, MatchStatus, Player, Pub, Team } from "@/types";

/** Mutable arrays so InsForge hydration updates existing importers in place. */
export const pubs: Pub[] = [...(pubsData as Pub[])];
export const matches: Match[] = [...(matchesData as Match[])];
export const teams: Team[] = [...(teamsData as Team[])];

const playersByTeam: Record<string, Player[]> = {
  spain: [...(spainPlayers as Player[])],
  france: [...(francePlayers as Player[])],
};

let staticDataHydrated = false;
let activeMatchHydrated = false;
let activeMatchRefreshPromise: Promise<void> | null = null;
let lastMatchFetchError: string | null = null;
let usingFallbackFixtures = false;

const pubListeners = new Set<() => void>();
let pubCatalogVersion = 0;

export function subscribePubs(listener: () => void): () => void {
  pubListeners.add(listener);
  return () => pubListeners.delete(listener);
}

export function notifyPubsChanged(): void {
  pubCatalogVersion += 1;
  pubListeners.forEach((listener) => listener());
}

export function getPubCatalogVersion(): number {
  return pubCatalogVersion;
}

export function isStaticDataHydrated(): boolean {
  return staticDataHydrated;
}

export function isActiveMatchHydrated(): boolean {
  return activeMatchHydrated;
}

export function getLastMatchFetchError(): string | null {
  return lastMatchFetchError;
}

export function isUsingFallbackFixtures(): boolean {
  return usingFallbackFixtures;
}

function upsertTeam(team: Team) {
  const index = teams.findIndex((entry) => entry.id === team.id);
  if (index >= 0) {
    teams[index] = team;
  } else {
    teams.push(team);
  }
}

function mergePlayersForTeams(apiPlayers: Player[], teamIds: string[]) {
  for (const teamId of teamIds) {
    playersByTeam[teamId] = apiPlayers.filter((player) => player.teamId === teamId);
  }
}

function withDerivedStatus(match: Match): Match {
  return { ...match, status: deriveMatchStatus(match) };
}

export async function refreshActiveMatchFromApi(): Promise<void> {
  if (activeMatchRefreshPromise) {
    await activeMatchRefreshPromise;
    return;
  }

  activeMatchRefreshPromise = (async () => {
    try {
      const response = await fetch("/api/matches/active");
      const payload = (await response.json()) as {
        match: Match | null;
        teams: Team[];
        players: Player[];
        fixtures: Match[];
        source?: string;
        error?: string;
      };

      if (!response.ok && payload.source !== "fallback") {
        activeMatchHydrated = true;
        return;
      }

      lastMatchFetchError = payload.error ?? null;
      usingFallbackFixtures = payload.source === "fallback";

      if (payload.fixtures.length > 0) {
        matches.splice(
          0,
          matches.length,
          ...payload.fixtures.map((fixture) => withDerivedStatus(fixture)),
        );
      }

      for (const team of payload.teams) {
        upsertTeam(team);
      }

      if (payload.players.length > 0) {
        const teamIds = [
          ...new Set(
            payload.fixtures.flatMap((fixture) => [
              fixture.homeTeamId,
              fixture.awayTeamId,
            ]),
          ),
        ];
        mergePlayersForTeams(payload.players, teamIds);
      }

      activeMatchHydrated = true;
    } catch {
      lastMatchFetchError = "Failed to load match schedule";
      // Keep JSON / InsForge fallback data.
      activeMatchHydrated = true;
    } finally {
      activeMatchRefreshPromise = null;
    }
  })();

  await activeMatchRefreshPromise;
}

function replacePlayersByTeam(players: Player[]) {
  for (const key of Object.keys(playersByTeam)) {
    playersByTeam[key] = [];
  }
  for (const player of players) {
    if (!playersByTeam[player.teamId]) {
      playersByTeam[player.teamId] = [];
    }
    playersByTeam[player.teamId].push(player);
  }
}

function mapPubRows(rows: Record<string, unknown>[]): Pub[] {
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    imageUrl: String(row.image_url),
    lat: Number(row.lat),
    lng: Number(row.lng),
    address: String(row.address),
    neighborhood: String(row.neighborhood),
  }));
}

function replacePubs(next: Pub[]): void {
  pubs.splice(0, pubs.length, ...next);
  notifyPubsChanged();
}

export async function refreshPubsFromInsForge(): Promise<void> {
  const { INSFORGE_ENABLED } = await import("@/lib/insforge/config");
  if (!INSFORGE_ENABLED) return;

  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  const { data, error } = await client.database.from("pubs").select("*");

  if (error) {
    console.error("Failed to refresh pubs from InsForge:", error.message);
    return;
  }

  replacePubs(mapPubRows((data ?? []) as Record<string, unknown>[]));
}

export async function hydrateStaticDataFromInsForge(): Promise<void> {
  const { INSFORGE_ENABLED } = await import("@/lib/insforge/config");
  if (!INSFORGE_ENABLED || staticDataHydrated) return;

  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();

  const [teamsRes, pubsRes, matchesRes, playersRes] = await Promise.all([
    client.database.from("teams").select("*"),
    client.database.from("pubs").select("*"),
    client.database.from("matches").select("*"),
    client.database.from("players").select("*"),
  ]);

  if (teamsRes.data?.length) {
    teams.splice(
      0,
      teams.length,
      ...teamsRes.data.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        flagUrl: String(row.flag_url),
        countryCode: String(row.country_code),
        color: String(row.color),
      })),
    );
  }

  if (pubsRes.data?.length) {
    replacePubs(mapPubRows(pubsRes.data as Record<string, unknown>[]));
  }

  if (matchesRes.data?.length) {
    matches.splice(
      0,
      matches.length,
      ...matchesRes.data.map((row) => ({
        id: String(row.id),
        homeTeamId: String(row.home_team_id),
        awayTeamId: String(row.away_team_id),
        kickoff: String(row.kickoff),
        status: String(row.status) as MatchStatus,
        venue: row.venue ? String(row.venue) : undefined,
      })),
    );
  }

  if (playersRes.data?.length) {
    const players = playersRes.data.map((row) => ({
      id: String(row.id),
      teamId: String(row.team_id),
      name: String(row.name),
      number: Number(row.number),
      imageUrl: String(row.image_url),
      age: row.age != null ? Number(row.age) : 0,
      country: row.country ? String(row.country) : "",
      position: row.position ? String(row.position) : "",
      club: row.club ? String(row.club) : "",
      stats: {
        goals: Number(row.goals ?? 0),
        assists: Number(row.assists ?? 0),
        caps: Number(row.caps ?? 0),
      },
    }));
    replacePlayersByTeam(players);
  }

  staticDataHydrated = true;
}

export function getTeam(teamId: string): Team | undefined {
  return teams.find((t) => t.id === teamId);
}

export function getPlayersByTeam(teamId: string): Player[] {
  return playersByTeam[teamId] ?? [];
}

export function getPlayer(playerId: string): Player | undefined {
  return Object.values(playersByTeam)
    .flat()
    .find((p) => p.id === playerId);
}

export function getPub(pubId: string): Pub | undefined {
  return pubs.find((p) => p.id === pubId);
}

export function getMatch(matchId: string): Match | undefined {
  return matches.find((m) => m.id === matchId);
}

export function getLiveOrUpcomingMatch(): Match | undefined {
  const active = getActiveMatch(matches);
  return active ? withDerivedStatus(active) : undefined;
}

export function getUpcomingMatchesNext24Hours(): Match[] {
  return getUpcomingMatchesWithinHours(matches, 24).map(withDerivedStatus);
}

/** Matches to show on the chat gate: live first, then upcoming within 24h, then next 3. */
export function getDisplayableUpcomingMatches(): Match[] {
  const now = new Date();
  const live = matches
    .filter((match) => deriveMatchStatus(match, now) === "live")
    .map(withDerivedStatus)
    .sort((a, b) => getKickoffMs(a) - getKickoffMs(b));

  const within24h = getUpcomingMatchesNext24Hours();
  const liveIds = new Set(live.map((m) => m.id));
  const upcomingOnly = within24h.filter((m) => !liveIds.has(m.id));

  if (live.length > 0 || upcomingOnly.length > 0) {
    return [...live, ...upcomingOnly];
  }

  return getNextUpcomingMatches(matches, 3).map(withDerivedStatus);
}

export function getDerivedMatchStatus(match: Match): MatchStatus {
  return deriveMatchStatus(match);
}

export function identityMatchesActiveMatch(
  identity: { matchId: string; userId: string } | null | undefined,
  userId: string | undefined,
  match: Match | undefined,
): boolean {
  if (!identity || !userId || !match) return false;
  return identity.userId === userId && identity.matchId === match.id;
}

export function getMatchLabel(match: Match): string {
  const home = getTeam(match.homeTeamId)?.name ?? match.homeTeamId;
  const away = getTeam(match.awayTeamId)?.name ?? match.awayTeamId;
  return `${home} vs ${away}`;
}

export function getAllPlayers(): Player[] {
  return Object.values(playersByTeam).flat();
}
