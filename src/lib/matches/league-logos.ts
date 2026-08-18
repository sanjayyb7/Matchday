/**
 * Static league badge lookup. Uses TheSportsDB's public CDN; the r2 host is
 * already allowed in `next.config.ts` `remotePatterns`.
 */
const LEAGUE_LOGO_MAP: Record<string, string> = {
  "premier league":
    "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",
  epl: "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",
  "english premier league":
    "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",

  "la liga":
    "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png",
  laliga:
    "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png",
  "primera division":
    "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png",
  "spanish la liga":
    "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png",

  bundesliga:
    "https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png",
  "german bundesliga":
    "https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png",

  "serie a":
    "https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png",
  "italian serie a":
    "https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png",

  "ligue 1":
    "https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png",
  "french ligue 1":
    "https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png",

  mls: "https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png",
  "major league soccer":
    "https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png",
  "american major league soccer":
    "https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png",

  "uefa champions league":
    "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png",
  "champions league":
    "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png",

  "uefa europa league":
    "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png",
  "europa league":
    "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png",
};

export function getLeagueLogoUrl(league: string): string | null {
  const key = league.trim().toLowerCase();
  return LEAGUE_LOGO_MAP[key] ?? null;
}
