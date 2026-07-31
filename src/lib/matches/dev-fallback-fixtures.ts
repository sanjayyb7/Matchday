import teamsData from "../../../data/teams.json";
import { deriveMatchStatus, getActiveMatch } from "@/lib/matches/match-window";
import { generateFallbackSquad } from "@/lib/matches/squad-fallback";
import type { Match, Player, Team } from "@/types";

const teams = teamsData as Team[];

function kickoffFromNow(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function buildMatch(
  id: string,
  homeTeamId: string,
  awayTeamId: string,
  hoursFromNow: number,
  venue: string,
): Match {
  const match: Match = {
    id,
    homeTeamId,
    awayTeamId,
    kickoff: kickoffFromNow(hoursFromNow),
    status: "upcoming",
    venue,
  };
  match.status = deriveMatchStatus(match);
  return match;
}

/** Demo fixtures with kickoffs relative to now when API-Football is unavailable. */
export function buildDevFallbackPayload(): {
  match: Match | null;
  teams: Team[];
  players: Player[];
  fixtures: Match[];
} {
  const fixtures: Match[] = [
    buildMatch(
      "match-demo-1",
      "spain",
      "france",
      6,
      "Levi's Stadium",
    ),
    buildMatch(
      "match-demo-2",
      "france",
      "spain",
      30,
      "Oracle Park Watch Party",
    ),
  ];

  const match = getActiveMatch(fixtures) ?? fixtures[0] ?? null;
  const spain = teams.find((team) => team.id === "spain");
  const france = teams.find((team) => team.id === "france");
  const players: Player[] = [
    ...(spain ? generateFallbackSquad(spain) : []),
    ...(france ? generateFallbackSquad(france) : []),
  ];

  return {
    match,
    teams: [...teams],
    players,
    fixtures,
  };
}
