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

interface PlayersResponse {
  player: {
    strPlayer: string;
    strTeam?: string | null;
    strPosition?: string | null;
    strThumb?: string | null;
    strCutout?: string | null;
  }[] | null;
}

const teamPhotoCache = new Map<string, Promise<Map<string, string>>>();
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

async function findTeamId(name: string): Promise<string | null> {
  const query = encodeURIComponent(name.slice(0, 40));
  const body = await tsdbFetch<TeamSearchResponse>(`/searchteams.php?t=${query}`);
  const teams = (body?.teams ?? []).filter((t) => t.strSport === "Soccer");
  if (teams.length === 0) return null;
  const target = normalize(name);
  const exact = teams.find((t) => normalize(t.strTeam) === target);
  return (exact ?? teams[0]).idTeam;
}

async function fetchPhotoMap(team: Team): Promise<Map<string, string>> {
  const teamId = await findTeamId(team.name);
  const map = new Map<string, string>();
  if (!teamId) return map;

  const body = await tsdbFetch<PlayersResponse>(
    `/lookup_all_players.php?id=${teamId}`,
  );
  const players = body?.player ?? [];
  for (const player of players) {
    const photo = player.strThumb || player.strCutout;
    if (!photo) continue;
    if (
      player.strPosition?.toLowerCase().includes("coach") ||
      player.strPosition?.toLowerCase().includes("manager")
    ) {
      continue;
    }
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

async function getPhotoMap(team: Team): Promise<Map<string, string>> {
  const cached = teamPhotoCache.get(team.id);
  if (cached) return cached;
  const pending = fetchPhotoMap(team).catch(() => new Map<string, string>());
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
): Promise<Player[]> {
  if (players.length === 0) return players;
  const stillPlaceholder = players.some((p) =>
    p.imageUrl.includes("dicebear.com"),
  );
  if (!stillPlaceholder) return players;

  const photoMap = await getPhotoMap(team);

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
