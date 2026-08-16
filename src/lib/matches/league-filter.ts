import type { Match } from "@/types";

/** Pin big European leagues first when they appear in the schedule. */
const PRIORITY_LEAGUES = [
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "UEFA Champions League",
  "UEFA Europa League",
  "MLS",
] as const;

const OTHER_LEAGUE = "Other";

export function getMatchLeagueLabel(match: Match): string {
  const name = match.league?.trim();
  return name && name.length > 0 ? name : OTHER_LEAGUE;
}

export function listLeaguesFromMatches(matches: Match[]): string[] {
  const counts = new Map<string, number>();
  for (const match of matches) {
    const league = getMatchLeagueLabel(match);
    counts.set(league, (counts.get(league) ?? 0) + 1);
  }

  const leagues = [...counts.keys()];
  leagues.sort((a, b) => {
    if (a === OTHER_LEAGUE) return 1;
    if (b === OTHER_LEAGUE) return -1;

    const aPriority = PRIORITY_LEAGUES.findIndex(
      (name) => name.toLowerCase() === a.toLowerCase(),
    );
    const bPriority = PRIORITY_LEAGUES.findIndex(
      (name) => name.toLowerCase() === b.toLowerCase(),
    );

    const aRank = aPriority === -1 ? Number.POSITIVE_INFINITY : aPriority;
    const bRank = bPriority === -1 ? Number.POSITIVE_INFINITY : bPriority;
    if (aRank !== bRank) return aRank - bRank;

    const byCount = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    if (byCount !== 0) return byCount;
    return a.localeCompare(b);
  });

  return leagues;
}

export function filterMatchesByLeague(
  matches: Match[],
  league: string | null,
): Match[] {
  if (!league) return matches;
  return matches.filter((match) => getMatchLeagueLabel(match) === league);
}
