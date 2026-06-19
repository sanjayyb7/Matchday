import pubsData from "../../../data/pubs.json";
import matchesData from "../../../data/matches.json";
import teamsData from "../../../data/teams.json";
import spainPlayers from "../../../data/players/spain.json";
import francePlayers from "../../../data/players/france.json";
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

export function isStaticDataHydrated(): boolean {
  return staticDataHydrated;
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

export async function refreshPubsFromInsForge(): Promise<void> {
  const { INSFORGE_ENABLED } = await import("@/lib/insforge/config");
  if (!INSFORGE_ENABLED) return;

  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  const { data, error } = await client.database.from("pubs").select("*");

  if (error || !data?.length) return;

  pubs.splice(0, pubs.length, ...mapPubRows(data as Record<string, unknown>[]));
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
    pubs.splice(
      0,
      pubs.length,
      ...mapPubRows(pubsRes.data as Record<string, unknown>[]),
    );
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
  const live = matches.find((m) => m.status === "live");
  if (live) return live;

  const upcoming = matches
    .filter((m) => m.status === "upcoming")
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    );

  return upcoming[0];
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
