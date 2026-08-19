import type { Player, Team } from "@/types";

/**
 * TheSportsDB free tier. Key "3" is their public/legacy key; free tier is
 * limited to ~10 players per team and requires attribution when displaying
 * their images. Good enough as a photo fallback for a hackathon demo.
 * See https://www.thesportsdb.com/api.php
 */
const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

interface TeamSearchResponse {
  teams: {
    idTeam: string;
    strTeam: string;
    strSport?: string;
    strLeague?: string;
    strBadge?: string | null;
  }[] | null;
}

interface TsdbPlayer {
  idPlayer?: string | null;
  strPlayer: string;
  strTeam?: string | null;
  strPosition?: string | null;
  strNumber?: string | null;
  strNationality?: string | null;
  dateBorn?: string | null;
  strThumb?: string | null;
  strCutout?: string | null;
}

interface PlayersResponse {
  player: TsdbPlayer[] | null;
}

const teamPhotoCache = new Map<string, Promise<Map<string, string>>>();
const teamRosterCache = new Map<string, Promise<TsdbPlayer[]>>();
const nameLookupCache = new Map<string, Promise<string | null>>();

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function tsdbFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: 24 * 60 * 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function searchTeamId(name: string): Promise<string | null> {
  const query = encodeURIComponent(name.slice(0, 40));
  const body = await tsdbFetch<TeamSearchResponse>(`/searchteams.php?t=${query}`);
  const teams = (body?.teams ?? []).filter((t) => t.strSport === "Soccer");
  if (teams.length === 0) return null;
  const target = normalize(name);
  const exact = teams.find((t) => normalize(t.strTeam) === target);
  return (exact ?? teams[0]).idTeam;
}

/**
 * Resolve a club, trying the most specific name first. Short names collide
 * badly here — "Atleti" matches Atlético CP of the Portuguese third tier
 * rather than Atlético Madrid — so callers should pass the provider's full
 * name ahead of the display name.
 */
async function findTeamId(
  team: Team,
  searchNames: string[] = [],
): Promise<string | null> {
  const candidates = [...searchNames, team.name]
    .map((name) => name?.trim())
    .filter((name): name is string => Boolean(name));

  const tried = new Set<string>();
  for (const candidate of candidates) {
    const key = normalize(candidate);
    if (!key || tried.has(key)) continue;
    tried.add(key);
    const id = await searchTeamId(candidate);
    if (id) return id;
  }
  return null;
}

function isStaffPosition(position?: string | null): boolean {
  const value = position?.toLowerCase() ?? "";
  return value.includes("coach") || value.includes("manager");
}

async function fetchRoster(
  team: Team,
  searchNames: string[],
): Promise<TsdbPlayer[]> {
  const teamId = await findTeamId(team, searchNames);
  if (!teamId) return [];
  const body = await tsdbFetch<PlayersResponse>(
    `/lookup_all_players.php?id=${teamId}`,
  );
  return (body?.player ?? []).filter(
    (player) => player.strPlayer && !isStaffPosition(player.strPosition),
  );
}

async function getRoster(
  team: Team,
  searchNames: string[],
): Promise<TsdbPlayer[]> {
  const cached = teamRosterCache.get(team.id);
  if (cached) return cached;
  const pending = fetchRoster(team, searchNames).catch(() => [] as TsdbPlayer[]);
  teamRosterCache.set(team.id, pending);
  return pending;
}

async function fetchPhotoMap(
  team: Team,
  searchNames: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const players = await getRoster(team, searchNames);
  for (const player of players) {
    const photo = player.strThumb || player.strCutout;
    if (!photo) continue;
    const full = normalize(player.strPlayer);
    if (full) map.set(full, photo);
    const parts = player.strPlayer.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const last = normalize(parts[parts.length - 1]);
      if (last && !map.has(last)) map.set(last, photo);
    }
  }
  return map;
}

async function getPhotoMap(
  team: Team,
  searchNames: string[],
): Promise<Map<string, string>> {
  const cached = teamPhotoCache.get(team.id);
  if (cached) return cached;
  const pending = fetchPhotoMap(team, searchNames).catch(
    () => new Map<string, string>(),
  );
  teamPhotoCache.set(team.id, pending);
  return pending;
}

function teamNamesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

async function lookupPlayerPhotoByName(
  playerName: string,
  team: Team,
): Promise<string | null> {
  const key = `${team.id}::${normalize(playerName)}`;
  const cached = nameLookupCache.get(key);
  if (cached) return cached;

  const pending = (async () => {
    const query = encodeURIComponent(playerName.slice(0, 40));
    const body = await tsdbFetch<PlayersResponse>(
      `/searchplayers.php?p=${query}`,
    );
    const candidates = body?.player ?? [];
    if (candidates.length === 0) return null;
    const teamMatch =
      candidates.find((c) => teamNamesMatch(c.strTeam, team.name)) ??
      candidates[0];
    return teamMatch.strThumb || teamMatch.strCutout || null;
  })().catch(() => null);

  nameLookupCache.set(key, pending);
  return pending;
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Fill in missing player photos from TheSportsDB. Only overwrites entries
 * that are still using dicebear placeholders so real photos from other
 * providers are preserved.
 */
function findInMap(playerName: string, photoMap: Map<string, string>): string | undefined {
  const full = normalize(playerName);
  let photo = photoMap.get(full);
  if (photo) return photo;
  const parts = playerName.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    photo = photoMap.get(normalize(parts[parts.length - 1]));
  }
  return photo;
}

export async function enrichPlayersWithTheSportsDbPhotos(
  players: Player[],
  team: Team,
  searchNames: string[] = [],
): Promise<Player[]> {
  if (players.length === 0) return players;
  const stillPlaceholder = players.some((p) =>
    p.imageUrl.includes("dicebear.com"),
  );
  if (!stillPlaceholder) return players;

  const photoMap = await getPhotoMap(team, searchNames);

  // First pass — apply team-level lookup (fast, single request per team).
  const firstPass = players.map((player) => {
    if (!player.imageUrl.includes("dicebear.com")) return player;
    const photo = findInMap(player.name, photoMap);
    return photo ? { ...player, imageUrl: photo } : player;
  });

  // Second pass — for anyone still on a dicebear placeholder, do a per-name
  // lookup. Free tier is generous but we cap concurrency to be polite.
  const stillMissing = firstPass
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.imageUrl.includes("dicebear.com"));

  if (stillMissing.length === 0) return firstPass;

  const resolved = await mapWithLimit(stillMissing, 4, async ({ player }) =>
    lookupPlayerPhotoByName(player.name, team),
  );

  const enriched = firstPass.slice();
  stillMissing.forEach(({ index }, i) => {
    const photo = resolved[i];
    if (photo) enriched[index] = { ...enriched[index], imageUrl: photo };
  });
  return enriched;
}

function ageFromDateBorn(dateBorn?: string | null): number {
  if (!dateBorn) return 25;
  const parsed = new Date(dateBorn);
  if (Number.isNaN(parsed.getTime())) return 25;
  const years = (Date.now() - parsed.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(years));
}

/**
 * Roster straight from TheSportsDB, used to top up providers that return a
 * partial squad. The free tier caps this at ~10 players per club, so treat it
 * as a supplement rather than a full replacement.
 */
export async function fetchTheSportsDbRoster(
  team: Team,
  searchNames: string[] = [],
): Promise<Player[]> {
  const roster = await getRoster(team, searchNames).catch(
    () => [] as TsdbPlayer[],
  );

  return roster.map((entry, index) => {
    const shirtNumber = Number.parseInt(entry.strNumber ?? "", 10);
    return {
      id: `tsdb-${team.id}-${entry.idPlayer ?? normalize(entry.strPlayer).replace(/\s+/g, "-")}`,
      teamId: team.id,
      name: entry.strPlayer.trim(),
      number: Number.isFinite(shirtNumber) && shirtNumber > 0 ? shirtNumber : index + 1,
      imageUrl:
        entry.strThumb ||
        entry.strCutout ||
        `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(`${team.id}-${entry.strPlayer}`)}&backgroundColor=${team.color.replace("#", "")}`,
      age: ageFromDateBorn(entry.dateBorn),
      country: entry.strNationality?.trim() || team.name,
      position: entry.strPosition?.trim() || "Midfielder",
      club: team.name,
      stats: { goals: 0, assists: 0, caps: 0 },
    } satisfies Player;
  });
}

/** Normalized full name, for de-duplicating players across providers. */
export function playerNameKey(name: string): string {
  return normalize(name);
}
