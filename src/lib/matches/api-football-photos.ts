import {
  API_FOOTBALL_BASE_URL,
  getApiFootballKey,
  getApiFootballKeys,
} from "@/lib/matches/config";
import type { Player, Team } from "@/types";

interface ApiFootballTeamSearchItem {
  team: { id: number; name: string };
}

interface ApiFootballSquadPlayerLite {
  id: number;
  name: string;
  photo: string | null;
}

const teamPhotoCache = new Map<string, Promise<Map<string, string>>>();

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuotaMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("request limit") ||
    msg.includes("rate limit") ||
    msg.includes("credits") ||
    msg.includes("quota") ||
    msg.includes("too many requests") ||
    msg.includes("suspended") ||
    msg.includes("unauthorized") ||
    msg.includes("(429)")
  );
}

async function apiFootballFetchOnce<T>(path: string, key: string): Promise<T> {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate: 24 * 60 * 60 },
  });
  if (response.status === 429) {
    throw new Error("API-Football (429): rate or credit limit");
  }
  if (!response.ok) {
    throw new Error(`API-Football ${response.status}`);
  }
  const body = (await response.json()) as {
    response: T;
    errors?: Record<string, string>;
  };
  if (body.errors && Object.keys(body.errors).length > 0) {
    throw new Error(Object.values(body.errors).join("; "));
  }
  return body.response;
}

/** Try each configured API-Football key; skip past any that is quota-limited. */
async function apiFootballFetch<T>(path: string): Promise<T> {
  const keys = getApiFootballKeys();
  if (keys.length === 0) throw new Error("no API-Football keys configured");
  let lastQuotaError: unknown = null;
  for (const key of keys) {
    try {
      return await apiFootballFetchOnce<T>(path, key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isQuotaMessage(message)) {
        lastQuotaError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastQuotaError ?? new Error("all API-Football keys exhausted");
}

async function resolveApiFootballTeamId(name: string): Promise<number | null> {
  const query = encodeURIComponent(name.slice(0, 30));
  try {
    const teams = await apiFootballFetch<ApiFootballTeamSearchItem[]>(
      `/teams?search=${query}`,
    );
    if (teams.length === 0) return null;
    const target = normalize(name);
    const exact = teams.find((t) => normalize(t.team.name) === target);
    return (exact ?? teams[0]).team.id;
  } catch {
    return null;
  }
}

async function buildPhotoMap(team: Team): Promise<Map<string, string>> {
  const teamId = await resolveApiFootballTeamId(team.name);
  const map = new Map<string, string>();
  if (!teamId) return map;

  try {
    const squads = await apiFootballFetch<
      { players: ApiFootballSquadPlayerLite[] }[]
    >(`/players/squads?team=${teamId}`);
    const players = squads[0]?.players ?? [];
    for (const player of players) {
      if (!player.photo) continue;
      const fullNorm = normalize(player.name);
      if (fullNorm) map.set(fullNorm, player.photo);
      const parts = player.name.split(/\s+/).filter(Boolean);
      if (parts.length > 1) {
        const last = normalize(parts[parts.length - 1]);
        if (last && !map.has(last)) map.set(last, player.photo);
      }
    }
  } catch {
    // ignore
  }
  return map;
}

async function getPhotoMap(team: Team): Promise<Map<string, string>> {
  const cached = teamPhotoCache.get(team.id);
  if (cached) return cached;

  if (!getApiFootballKey()) {
    const empty = Promise.resolve(new Map<string, string>());
    teamPhotoCache.set(team.id, empty);
    return empty;
  }

  const pending = buildPhotoMap(team).catch(() => new Map<string, string>());
  teamPhotoCache.set(team.id, pending);
  return pending;
}

/**
 * Given player rows that already have real names but placeholder photos,
 * try to swap in real headshots from API-Football's squad endpoint.
 * Silently no-ops when API-Football is missing/errors so callers keep
 * their dicebear placeholders.
 */
export async function enrichPlayersWithApiFootballPhotos(
  players: Player[],
  team: Team,
): Promise<Player[]> {
  if (players.length === 0) return players;
  if (!getApiFootballKey()) return players;

  const photoMap = await getPhotoMap(team);
  if (photoMap.size === 0) return players;

  return players.map((player) => {
    const fullNorm = normalize(player.name);
    let photo = photoMap.get(fullNorm);
    if (!photo) {
      const parts = player.name.split(/\s+/).filter(Boolean);
      if (parts.length > 1) {
        photo = photoMap.get(normalize(parts[parts.length - 1]));
      }
    }
    return photo ? { ...player, imageUrl: photo } : player;
  });
}
