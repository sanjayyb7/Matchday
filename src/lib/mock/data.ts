import pubsData from "../../../data/pubs.json";
import matchesData from "../../../data/matches.json";
import teamsData from "../../../data/teams.json";
import spainPlayers from "../../../data/players/spain.json";
import francePlayers from "../../../data/players/france.json";
import type { Match, Player, Pub, Team } from "@/types";

export const pubs = pubsData as Pub[];
export const matches = matchesData as Match[];
export const teams = teamsData as Team[];

const playersByTeam: Record<string, Player[]> = {
  spain: spainPlayers as Player[],
  france: francePlayers as Player[],
};

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
  return matches.find((m) => m.status === "live" || m.status === "upcoming");
}

export function getMatchLabel(match: Match): string {
  const home = getTeam(match.homeTeamId)?.name ?? match.homeTeamId;
  const away = getTeam(match.awayTeamId)?.name ?? match.awayTeamId;
  return `${home} vs ${away}`;
}

export function getAllPlayers(): Player[] {
  return Object.values(playersByTeam).flat();
}
