import type { UserIdentity } from "@/types";

type IdentityRow = {
  user_id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  updated_at: string;
};

function rowToIdentity(row: IdentityRow): UserIdentity {
  return {
    userId: row.user_id,
    matchId: row.match_id,
    teamId: row.team_id,
    playerId: row.player_id,
    updatedAt: row.updated_at,
  };
}

export async function fetchUserIdentities(userId: string): Promise<UserIdentity[]> {
  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  const { data, error } = await client.database
    .from("user_identities")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToIdentity(row as IdentityRow));
}

export async function fetchUserIdentityForMatch(
  userId: string,
  matchId: string,
): Promise<UserIdentity | null> {
  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  const { data, error } = await client.database
    .from("user_identities")
    .select("*")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToIdentity(data as IdentityRow);
}

export async function upsertUserIdentity(identity: UserIdentity) {
  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  const { data: existing } = await client.database
    .from("user_identities")
    .select("id")
    .eq("user_id", identity.userId)
    .eq("match_id", identity.matchId)
    .maybeSingle();

  const payload = {
    user_id: identity.userId,
    match_id: identity.matchId,
    team_id: identity.teamId,
    player_id: identity.playerId,
    updated_at: identity.updatedAt,
  };

  if (existing) {
    await client.database
      .from("user_identities")
      .update(payload)
      .eq("id", existing.id);
    return;
  }

  await client.database.from("user_identities").insert([payload]);
}

/**
 * Restore the user's team/player pick for the live or upcoming match from Postgres.
 * DB is source of truth when InsForge is enabled; local Zustand persist is updated in place.
 */
export async function hydrateIdentityForCurrentMatch(userId: string): Promise<UserIdentity | null> {
  const { getLiveOrUpcomingMatch } = await import("@/lib/mock/data");
  const { useMatchdayStore } = await import("@/store/matchday-store");

  const match = getLiveOrUpcomingMatch();
  if (!match) return null;

  const identity = await fetchUserIdentityForMatch(userId, match.id);
  if (!identity) return null;

  const current = useMatchdayStore.getState().identity;
  if (
    current?.userId === identity.userId &&
    current.matchId === identity.matchId &&
    current.teamId === identity.teamId &&
    current.playerId === identity.playerId
  ) {
    return identity;
  }

  useMatchdayStore.getState().setIdentity(identity);
  return identity;
}
