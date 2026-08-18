import type { Match, Team } from "@/types";
import { MAX_FIXTURES_RETURNED } from "@/lib/matches/config";
import {
  deriveMatchStatus,
  getKickoffMs,
} from "@/lib/matches/match-window";
import {
  guessCountryCode,
  teamColorForSlug,
  teamNameToSlug,
} from "@/lib/matches/team-utils";

const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";

export function getSportmonksApiKey(): string | undefined {
  return process.env.SPORTMONKS_API_KEY;
}

export class SportmonksQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SportmonksQuotaError";
  }
}

export function isSportmonksQuotaError(error: unknown): boolean {
  if (error instanceof SportmonksQuotaError) return true;
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("credits") ||
    msg.includes("too many requests") ||
    msg.includes("subscription") ||
    /\(429\)/.test(error.message) ||
    /\(402\)/.test(error.message) ||
    /\(403\)/.test(error.message)
  );
}

interface SportmonksParticipant {
  id: number;
  name: string;
  short_code?: string | null;
  image_path?: string | null;
  meta?: { location?: string | null; winner?: boolean | null };
}

interface SportmonksScore {
  score?: {
    goals?: number | null;
    participant?: string | null;
  };
  description?: string | null;
}

interface SportmonksFixture {
  id: number;
  name?: string | null;
  starting_at?: string | null;
  starting_at_timestamp?: number | null;
  state_id?: number | null;
  league_id?: number | null;
  participants?: SportmonksParticipant[];
  league?: { id?: number; name?: string | null } | null;
  venue?: { name?: string | null; city_name?: string | null } | null;
  state?: {
    id?: number;
    state?: string | null;
    name?: string | null;
    short_name?: string | null;
    developer_name?: string | null;
  } | null;
  scores?: SportmonksScore[];
}

/** Map SportMonks state → API-Football-like short codes used by deriveMatchStatus. */
function mapStateToApiStatus(fixture: SportmonksFixture): string {
  const raw = (
    fixture.state?.developer_name ||
    fixture.state?.short_name ||
    fixture.state?.state ||
    fixture.state?.name ||
    ""
  ).toUpperCase();

  if (
    raw.includes("NS") ||
    raw.includes("NOT_STARTED") ||
    raw.includes("NOT STARTED") ||
    raw.includes("TBD") ||
    raw.includes("SCHEDULED")
  ) {
    return "NS";
  }
  if (raw.includes("HT") || raw.includes("HALF")) return "HT";
  if (raw.includes("FT") || raw.includes("FULL") || raw.includes("ENDED")) {
    return "FT";
  }
  if (raw.includes("PEN") || raw.includes("AET") || raw.includes("ET")) {
    return "FT";
  }
  if (
    raw.includes("INPLAY") ||
    raw.includes("LIVE") ||
    raw.includes("1ST") ||
    raw.includes("2ND") ||
    raw.includes("INPLAY_1ST") ||
    raw.includes("INPLAY_2ND")
  ) {
    return "1H";
  }
  if (
    raw.includes("POSTP") ||
    raw.includes("CANC") ||
    raw.includes("ABAN") ||
    raw.includes("SUSP") ||
    raw.includes("DELAY") ||
    raw.includes("WO")
  ) {
    return "FT";
  }

  // Fallback by numeric state_id (SportMonks common ids)
  switch (fixture.state_id) {
    case 1:
      return "NS";
    case 2:
    case 22:
      return "1H";
    case 3:
      return "HT";
    case 4:
    case 23:
      return "2H";
    case 5:
    case 7:
    case 8:
    case 9:
    case 10:
      return "FT";
    default:
      return "NS";
  }
}

function mapSportmonksTeam(participant: SportmonksParticipant): Team {
  const id = teamNameToSlug(participant.name);
  return {
    id,
    name: participant.name.trim(),
    flagUrl:
      participant.image_path?.trim() || `/assets/flags/${id}.svg`,
    countryCode: guessCountryCode(participant.name, participant.short_code),
    color: teamColorForSlug(id),
  };
}

function currentGoals(
  scores: SportmonksScore[] | undefined,
  side: "home" | "away",
): number | null {
  if (!scores?.length) return null;
  const preferred =
    scores.find(
      (s) =>
        s.score?.participant?.toLowerCase() === side &&
        (s.description === "CURRENT" || s.description === "CURRENT_SCORE"),
    ) ??
    scores.find((s) => s.score?.participant?.toLowerCase() === side);

  const goals = preferred?.score?.goals;
  return typeof goals === "number" ? goals : null;
}

function kickoffIso(fixture: SportmonksFixture): string | null {
  if (fixture.starting_at_timestamp) {
    return new Date(fixture.starting_at_timestamp * 1000).toISOString();
  }
  if (fixture.starting_at) {
    // SportMonks often returns "YYYY-MM-DD HH:mm:ss" (UTC)
    const normalized = fixture.starting_at.includes("T")
      ? fixture.starting_at
      : fixture.starting_at.replace(" ", "T") + "Z";
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function mapFixture(fixture: SportmonksFixture): {
  match: Match;
  teams: Team[];
} | null {
  const participants = fixture.participants ?? [];
  const home =
    participants.find((p) => p.meta?.location === "home") ?? participants[0];
  const away =
    participants.find((p) => p.meta?.location === "away") ?? participants[1];
  if (!home?.name || !away?.name) return null;

  const kickoff = kickoffIso(fixture);
  if (!kickoff) return null;

  const homeTeam = mapSportmonksTeam(home);
  const awayTeam = mapSportmonksTeam(away);
  const apiStatus = mapStateToApiStatus(fixture);

  const match: Match = {
    id: `sm-${fixture.id}`,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    kickoff,
    status: "upcoming",
    venue: fixture.venue?.name ?? undefined,
    league: fixture.league?.name?.trim() || undefined,
    leagueId: fixture.league?.id ?? fixture.league_id ?? undefined,
    apiStatus,
    homeScore: currentGoals(fixture.scores, "home"),
    awayScore: currentGoals(fixture.scores, "away"),
    elapsedMinutes: null,
    externalFixtureId: fixture.id,
  };
  match.status = deriveMatchStatus(match);
  return { match, teams: [homeTeam, awayTeam] };
}

function addUtcDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function sportmonksFetch(
  path: string,
  key: string,
): Promise<SportmonksFixture[]> {
  const url = new URL(`${SPORTMONKS_BASE_URL}${path}`);
  url.searchParams.set("api_token", key);
  if (!url.searchParams.has("include")) {
    url.searchParams.set(
      "include",
      "participants;league;venue;state;scores",
    );
  }
  if (!url.searchParams.has("per_page")) {
    url.searchParams.set("per_page", "50");
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    errors?: unknown;
    data?: SportmonksFixture[] | SportmonksFixture;
  };

  if (response.status === 429 || response.status === 402) {
    throw new SportmonksQuotaError(
      payload.message ||
        `SportMonks request failed (${response.status}): rate or credit limit`,
    );
  }

  if (!response.ok) {
    const message =
      payload.message ||
      (typeof payload.errors === "string"
        ? payload.errors
        : `SportMonks request failed (${response.status})`);
    if (isSportmonksQuotaError(new Error(String(message)))) {
      throw new SportmonksQuotaError(String(message));
    }
    throw new Error(String(message));
  }

  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data) return [payload.data];
  return [];
}

function isFinishedStatus(apiStatus: string): boolean {
  return ["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD"].includes(apiStatus);
}

async function fetchSportmonksFixtures(
  key: string,
): Promise<SportmonksFixture[]> {
  try {
    const live = await sportmonksFetch("/livescores", key);
    if (live.length > 0) {
      return live.slice(0, MAX_FIXTURES_RETURNED);
    }
  } catch (error) {
    // Livescores can be plan-gated; still try dated fixtures.
    if (isSportmonksQuotaError(error)) throw error;
  }

  const start = todayUtcDate();
  const [today, tomorrow] = await Promise.all([
    sportmonksFetch(`/fixtures/date/${start}`, key),
    sportmonksFetch(`/fixtures/date/${addUtcDays(start, 1)}`, key),
  ]);

  const byId = new Map<number, SportmonksFixture>();
  for (const item of [...today, ...tomorrow]) {
    byId.set(item.id, item);
  }

  return [...byId.values()]
    .filter((item) => !isFinishedStatus(mapStateToApiStatus(item)))
    .sort((a, b) => {
      const aTs = a.starting_at_timestamp ?? 0;
      const bTs = b.starting_at_timestamp ?? 0;
      return aTs - bTs;
    })
    .slice(0, MAX_FIXTURES_RETURNED);
}

/**
 * Fetch fixtures from SportMonks and map into the same Match/Team shape
 * used by API-Football.
 */
export async function fetchSportmonksFixturesCatalog(): Promise<{
  fixtures: Match[];
  teams: Team[];
}> {
  const key = getSportmonksApiKey();
  if (!key) {
    throw new Error("SPORTMONKS_API_KEY is not configured");
  }

  const items = await fetchSportmonksFixtures(key);
  const fixtures: Match[] = [];
  const teamMap = new Map<string, Team>();

  for (const item of items) {
    const mapped = mapFixture(item);
    if (!mapped) continue;
    if (mapped.match.status === "finished") continue;
    fixtures.push(mapped.match);
    for (const team of mapped.teams) {
      teamMap.set(team.id, team);
    }
  }

  fixtures.sort((a, b) => getKickoffMs(a) - getKickoffMs(b));

  return {
    fixtures,
    teams: [...teamMap.values()],
  };
}
