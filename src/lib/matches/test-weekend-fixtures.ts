import type { Match, Team } from "@/types";
import { deriveMatchStatus, getKickoffMs } from "@/lib/matches/match-window";
import {
  guessCountryCode,
  teamColorForSlug,
  teamNameToSlug,
} from "@/lib/matches/team-utils";

/** Temporary: force PL / La Liga / Bundesliga / MLS through this weekend for app testing. */
export function isMatchTestWeekendEnabled(): boolean {
  const raw = process.env.MATCH_TEST_WEEKEND?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function team(name: string, color?: string): Team {
  const id = teamNameToSlug(name);
  return {
    id,
    name,
    flagUrl: `/assets/flags/${id}.svg`,
    countryCode: guessCountryCode(name),
    color: color ?? teamColorForSlug(id),
  };
}

/** Build an ISO kickoff in America/Los_Angeles for a local calendar day + time. */
function sfKickoff(date: string, hour: number, minute = 0): string {
  // Interpret as SF local wall time, then convert to ISO UTC.
  const approx = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-07:00`);
  return approx.toISOString();
}

function buildMatch(input: {
  id: string;
  home: Team;
  away: Team;
  kickoff: string;
  league: string;
  leagueId: number;
  venue: string;
}): Match {
  const match: Match = {
    id: input.id,
    homeTeamId: input.home.id,
    awayTeamId: input.away.id,
    kickoff: input.kickoff,
    status: "upcoming",
    venue: input.venue,
    league: input.league,
    leagueId: input.leagueId,
    apiStatus: "NS",
    homeScore: null,
    awayScore: null,
  };
  match.status = deriveMatchStatus(match);
  return match;
}

/**
 * Hardcoded weekend slate for local testing when live APIs can't serve these leagues.
 * Window: today → Sunday (SF). Remove MATCH_TEST_WEEKEND when done.
 */
export function fetchTestWeekendFixturesCatalog(): {
  fixtures: Match[];
  teams: Team[];
} {
  const arsenal = team("Arsenal", "#EF0107");
  const chelsea = team("Chelsea", "#034694");
  const liverpool = team("Liverpool", "#C8102E");
  const manCity = team("Manchester City", "#6CABDD");
  const tottenham = team("Tottenham", "#132257");
  const newcastle = team("Newcastle", "#241F20");

  const realMadrid = team("Real Madrid", "#FEBE10");
  const barca = team("Barcelona", "#A50044");
  const atletico = team("Atletico Madrid", "#CB3524");
  const sevilla = team("Sevilla", "#D4AF37");
  const sociedad = team("Real Sociedad", "#0067B1");
  const villarreal = team("Villarreal", "#FFE67F");

  const bayern = team("Bayern Munich", "#DC052D");
  const dortmund = team("Borussia Dortmund", "#FDE100");
  const leverkusen = team("Bayer Leverkusen", "#E32221");
  const leipzig = team("RB Leipzig", "#DD0741");
  const frankfurt = team("Eintracht Frankfurt", "#E1000F");
  const wolfsburg = team("Wolfsburg", "#65B32E");

  const lafc = team("LAFC", "#C39E6D");
  const galaxy = team("LA Galaxy", "#00245D");
  const seattle = team("Seattle Sounders", "#5D9741");
  const austin = team("Austin FC", "#00B140");
  const miami = team("Inter Miami", "#F7B5CD");
  const nycfc = team("New York City FC", "#6CACE4");

  const fixtures: Match[] = [
    // Premier League
    buildMatch({
      id: "test-pl-1",
      home: arsenal,
      away: chelsea,
      kickoff: sfKickoff("2026-08-22", 7, 30),
      league: "Premier League",
      leagueId: 39,
      venue: "Emirates Stadium",
    }),
    buildMatch({
      id: "test-pl-2",
      home: liverpool,
      away: manCity,
      kickoff: sfKickoff("2026-08-22", 10, 0),
      league: "Premier League",
      leagueId: 39,
      venue: "Anfield",
    }),
    buildMatch({
      id: "test-pl-3",
      home: tottenham,
      away: newcastle,
      kickoff: sfKickoff("2026-08-23", 8, 0),
      league: "Premier League",
      leagueId: 39,
      venue: "Tottenham Hotspur Stadium",
    }),

    // La Liga
    buildMatch({
      id: "test-ll-1",
      home: realMadrid,
      away: barca,
      kickoff: sfKickoff("2026-08-22", 12, 0),
      league: "La Liga",
      leagueId: 140,
      venue: "Santiago Bernabéu",
    }),
    buildMatch({
      id: "test-ll-2",
      home: atletico,
      away: sevilla,
      kickoff: sfKickoff("2026-08-23", 10, 15),
      league: "La Liga",
      leagueId: 140,
      venue: "Cívitas Metropolitano",
    }),
    buildMatch({
      id: "test-ll-3",
      home: sociedad,
      away: villarreal,
      kickoff: sfKickoff("2026-08-21", 12, 30),
      league: "La Liga",
      leagueId: 140,
      venue: "Reale Arena",
    }),

    // Bundesliga
    buildMatch({
      id: "test-bl-1",
      home: bayern,
      away: dortmund,
      kickoff: sfKickoff("2026-08-22", 9, 30),
      league: "Bundesliga",
      leagueId: 78,
      venue: "Allianz Arena",
    }),
    buildMatch({
      id: "test-bl-2",
      home: leverkusen,
      away: leipzig,
      kickoff: sfKickoff("2026-08-23", 6, 30),
      league: "Bundesliga",
      leagueId: 78,
      venue: "BayArena",
    }),
    buildMatch({
      id: "test-bl-3",
      home: frankfurt,
      away: wolfsburg,
      kickoff: sfKickoff("2026-08-21", 11, 30),
      league: "Bundesliga",
      leagueId: 78,
      venue: "Deutsche Bank Park",
    }),

    // MLS
    buildMatch({
      id: "test-mls-1",
      home: lafc,
      away: galaxy,
      kickoff: sfKickoff("2026-08-23", 19, 30),
      league: "MLS",
      leagueId: 253,
      venue: "BMO Stadium",
    }),
    buildMatch({
      id: "test-mls-2",
      home: seattle,
      away: austin,
      kickoff: sfKickoff("2026-08-22", 19, 30),
      league: "MLS",
      leagueId: 253,
      venue: "Lumen Field",
    }),
    buildMatch({
      id: "test-mls-3",
      home: miami,
      away: nycfc,
      kickoff: sfKickoff("2026-08-20", 16, 0),
      league: "MLS",
      leagueId: 253,
      venue: "Chase Stadium",
    }),
  ];

  const teamMap = new Map<string, Team>();
  for (const match of fixtures) {
    for (const t of [
      arsenal,
      chelsea,
      liverpool,
      manCity,
      tottenham,
      newcastle,
      realMadrid,
      barca,
      atletico,
      sevilla,
      sociedad,
      villarreal,
      bayern,
      dortmund,
      leverkusen,
      leipzig,
      frankfurt,
      wolfsburg,
      lafc,
      galaxy,
      seattle,
      austin,
      miami,
      nycfc,
    ]) {
      if (t.id === match.homeTeamId || t.id === match.awayTeamId) {
        teamMap.set(t.id, t);
      }
    }
  }

  fixtures.sort((a, b) => getKickoffMs(a) - getKickoffMs(b));

  return {
    fixtures,
    teams: [...teamMap.values()],
  };
}
