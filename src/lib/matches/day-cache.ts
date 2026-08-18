import { createInsForgeAdminClient } from "@/lib/insforge/admin";
import { INSFORGE_API_KEY, INSFORGE_ENABLED } from "@/lib/insforge/config";
import {
  buildSquadsForMatchId,
  fetchSoccerFixturesCatalog,
} from "@/lib/matches/api-football";
import { buildDevFallbackPayload } from "@/lib/matches/dev-fallback-fixtures";
import {
  getActiveMatch,
  hasSelectableFixtures,
} from "@/lib/matches/match-window";
import { fetchFootballDataSquadForMatch } from "@/lib/matches/football-data-fixtures";
import { generateFallbackSquad } from "@/lib/matches/squad-fallback";
import {
  isMatchTestWeekendEnabled,
} from "@/lib/matches/test-weekend-fixtures";
import type { Match, Player, Team } from "@/types";

export interface DaySchedulePayload {
  match: Match | null;
  teams: Team[];
  players: Player[];
  fixtures: Match[];
  source:
    | "day-cache"
    | "api-football"
    | "football-data"
    | "sportmonks"
    | "test-weekend"
    | "fallback";
  demoSchedule?: boolean;
  demoReason?: string;
  cacheDate: string;
}

let dayFetchPromise: Promise<DaySchedulePayload> | null = null;
const squadFetchPromises = new Map<
  string,
  Promise<{ teams: Team[]; players: Player[] }>
>();

/** Process-local fallback so one Node instance does not re-hit API if DB write fails. */
let memoryDayCache: {
  cacheDate: string;
  fixtures: Match[];
  teams: Team[];
} | null = null;

function db() {
  return createInsForgeAdminClient().database;
}

function canUseInsForgeCache(): boolean {
  return INSFORGE_ENABLED && Boolean(INSFORGE_API_KEY);
}

/** Calendar day key in America/Los_Angeles (YYYY-MM-DD). */
export function getSfDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Seconds until next SF midnight (min 5 min, max 24h) for HTTP caching. */
export function secondsUntilSfMidnight(now = new Date()): number {
  const key = getSfDateKey(now);
  // Walk forward hour-by-hour until the SF calendar date changes.
  let cursor = new Date(now.getTime());
  for (let i = 0; i < 36; i++) {
    cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
    if (getSfDateKey(cursor) !== key) {
      // Back up to the start of this hour as an approximate midnight.
      const approx = new Date(cursor.getTime() - 60 * 60 * 1000);
      // Refine with 5-minute steps
      let refined = approx;
      for (let j = 0; j < 12; j++) {
        const next = new Date(refined.getTime() + 5 * 60 * 1000);
        if (getSfDateKey(next) !== key) break;
        refined = next;
      }
      const seconds = Math.floor((refined.getTime() - now.getTime()) / 1000) + 300;
      return Math.max(300, Math.min(seconds, 24 * 60 * 60));
    }
  }
  return 6 * 60 * 60;
}

async function readDayCache(cacheDate: string): Promise<{
  fixtures: Match[];
  teams: Team[];
  fetchedAt: string;
} | null> {
  if (!canUseInsForgeCache()) return null;
  try {
    const { data, error } = await db()
      .from("match_day_cache")
      .select("fixtures_json, teams_json, fetched_at")
      .eq("cache_date", cacheDate)
      .maybeSingle();
    if (error || !data) return null;
    const fixtures = Array.isArray(data.fixtures_json)
      ? (data.fixtures_json as Match[])
      : [];
    const teams = Array.isArray(data.teams_json)
      ? (data.teams_json as Team[])
      : [];
    return {
      fixtures,
      teams,
      fetchedAt: String(data.fetched_at),
    };
  } catch {
    return null;
  }
}

async function writeDayCache(input: {
  cacheDate: string;
  fixtures: Match[];
  teams: Team[];
}): Promise<void> {
  memoryDayCache = {
    cacheDate: input.cacheDate,
    fixtures: input.fixtures,
    teams: input.teams,
  };
  if (!canUseInsForgeCache()) return;
  try {
    await db()
      .from("match_day_cache")
      .upsert([
        {
          cache_date: input.cacheDate,
          fixtures_json: input.fixtures,
          teams_json: input.teams,
          fetched_at: new Date().toISOString(),
        },
      ]);
  } catch {
    // Non-fatal — memory cache still covers this process
  }
}

function isStaleFallbackSquad(players: Player[]): boolean {
  if (players.length === 0) return true;
  if (players.every((player) => player.id.includes("-fallback-"))) return true;
  // Previously-cached fd-* squads had dicebear-only photos; refresh once so
  // API-Football enrichment (real headshots) can populate the cache.
  const dicebearOnly = players.every((player) =>
    player.imageUrl.includes("dicebear.com"),
  );
  return dicebearOnly;
}

async function readTeamSquad(teamId: string): Promise<Player[] | null> {
  if (!canUseInsForgeCache()) return null;
  try {
    const { data, error } = await db()
      .from("team_squad_cache")
      .select("players_json")
      .eq("team_id", teamId)
      .maybeSingle();
    if (error || !data) return null;
    const players = Array.isArray(data.players_json)
      ? (data.players_json as Player[])
      : [];
    if (isStaleFallbackSquad(players)) return null;
    return players;
  } catch {
    return null;
  }
}

async function writeTeamSquad(teamId: string, players: Player[]): Promise<void> {
  if (!canUseInsForgeCache()) return;
  try {
    await db()
      .from("team_squad_cache")
      .upsert([
        {
          team_id: teamId,
          players_json: players,
          fetched_at: new Date().toISOString(),
        },
      ]);
  } catch {
    // ignore
  }
}

function toPayload(
  fixtures: Match[],
  teams: Team[],
  source: DaySchedulePayload["source"],
  cacheDate: string,
  extra?: Partial<DaySchedulePayload>,
): DaySchedulePayload {
  return {
    match: getActiveMatch(fixtures) ?? null,
    teams,
    players: [],
    fixtures,
    source,
    cacheDate,
    ...extra,
  };
}

async function fetchAndStoreDaySchedule(
  cacheDate: string,
): Promise<DaySchedulePayload> {
  try {
    const { fixtures, teams, source } = await fetchSoccerFixturesCatalog();

    if (fixtures.length === 0) {
      const fallback = buildDevFallbackPayload();
      return toPayload(
        fallback.fixtures,
        fallback.teams,
        "fallback",
        cacheDate,
        { match: fallback.match, demoSchedule: true, demoReason: "Empty schedule" },
      );
    }

    if (!hasSelectableFixtures(fixtures)) {
      const demo = buildDevFallbackPayload();
      return toPayload(demo.fixtures, demo.teams, "fallback", cacheDate, {
        match: demo.match,
        demoSchedule: true,
        demoReason:
          "API schedule has no live or upcoming matches — showing demo fixtures",
      });
    }

    if (source !== "test-weekend") {
      await writeDayCache({ cacheDate, fixtures, teams });
    } else {
      memoryDayCache = { cacheDate, fixtures, teams };
    }
    return toPayload(fixtures, teams, source, cacheDate);
  } catch (error) {
    const fallback = buildDevFallbackPayload();
    return toPayload(
      fallback.fixtures,
      fallback.teams,
      "fallback",
      cacheDate,
      {
        match: fallback.match,
        demoSchedule: true,
        demoReason:
          error instanceof Error ? error.message : "Failed to fetch schedule",
      },
    );
  }
}

/**
 * One API catalog pull per SF calendar day; everyone else reads InsForge.
 * No live score refreshes.
 * MATCH_TEST_WEEKEND bypasses day cache so the test slate always shows.
 */
export async function getOrFetchDaySchedule(): Promise<DaySchedulePayload> {
  const cacheDate = getSfDateKey();
  const bypassCache = isMatchTestWeekendEnabled();

  if (
    !bypassCache &&
    memoryDayCache &&
    memoryDayCache.cacheDate === cacheDate &&
    memoryDayCache.fixtures.length > 0
  ) {
    return toPayload(
      memoryDayCache.fixtures,
      memoryDayCache.teams,
      "day-cache",
      cacheDate,
    );
  }

  if (!bypassCache) {
    const cached = await readDayCache(cacheDate);
    if (cached && cached.fixtures.length > 0) {
      memoryDayCache = {
        cacheDate,
        fixtures: cached.fixtures,
        teams: cached.teams,
      };
      return toPayload(cached.fixtures, cached.teams, "day-cache", cacheDate);
    }
  } else {
    memoryDayCache = null;
  }

  if (dayFetchPromise) return dayFetchPromise;

  dayFetchPromise = fetchAndStoreDaySchedule(cacheDate).finally(() => {
    dayFetchPromise = null;
  });

  return dayFetchPromise;
}

/** Load squads for a match; cache each team in InsForge after first API pull. */
export async function getOrFetchSquadsForMatch(matchId: string): Promise<{
  teams: Team[];
  players: Player[];
}> {
  const existing = squadFetchPromises.get(matchId);
  if (existing) return existing;

  const promise = (async () => {
    const schedule = await getOrFetchDaySchedule();
    const match = schedule.fixtures.find((f) => f.id === matchId);

    if (match) {
      const [homePlayers, awayPlayers] = await Promise.all([
        readTeamSquad(match.homeTeamId),
        readTeamSquad(match.awayTeamId),
      ]);
      if (homePlayers && awayPlayers) {
        const teams = schedule.teams.filter(
          (t) => t.id === match.homeTeamId || t.id === match.awayTeamId,
        );
        return {
          teams,
          players: [...homePlayers, ...awayPlayers],
        };
      }
    }

    let payload: { teams: Team[]; players: Player[] };

    try {
      if (matchId.startsWith("af-")) {
        payload = await buildSquadsForMatchId(matchId);
      } else if (matchId.startsWith("fd-")) {
        payload = await fetchFootballDataSquadForMatch(matchId);
      } else {
        throw new Error("No squad provider for this match id");
      }
    } catch (error) {
      console.warn(
        "[matches] squad fetch failed; falling back to generated squad:",
        error instanceof Error ? error.message : error,
      );
      if (!match) throw error;
      const teams = schedule.teams.filter(
        (t) => t.id === match.homeTeamId || t.id === match.awayTeamId,
      );
      const home = teams.find((t) => t.id === match.homeTeamId);
      const away = teams.find((t) => t.id === match.awayTeamId);
      payload = {
        teams,
        players: [
          ...(home ? generateFallbackSquad(home) : []),
          ...(away ? generateFallbackSquad(away) : []),
        ],
      };
    }

    const byTeam = new Map<string, Player[]>();
    for (const player of payload.players) {
      const list = byTeam.get(player.teamId) ?? [];
      list.push(player);
      byTeam.set(player.teamId, list);
    }
    await Promise.all(
      [...byTeam.entries()].map(([teamId, players]) =>
        writeTeamSquad(teamId, players),
      ),
    );
    return payload;
  })().finally(() => {
    squadFetchPromises.delete(matchId);
  });

  squadFetchPromises.set(matchId, promise);
  return promise;
}
