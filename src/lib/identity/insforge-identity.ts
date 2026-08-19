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

/** Everyone who picked a player on a given team for a given match. */
export async function fetchSquadIdentities(
  matchId: string,
  teamId: string,
): Promise<UserIdentity[]> {
  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  const { data, error } = await client.database
    .from("user_identities")
    .select("*")
    .eq("match_id", matchId)
    .eq("team_id", teamId);

  if (error || !data) return [];
  return data.map((row) => rowToIdentity(row as IdentityRow));
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

  // Surface failures: a silently swallowed error here leaves the user without
  // an identity row, which then blocks chat inserts via RLS.
  const { error } = existing
    ? await client.database
        .from("user_identities")
        .update(payload)
        .eq("id", existing.id)
    : await client.database.from("user_identities").insert([payload]);

  if (error) {
    console.error("[identity] failed to save squad pick", error);
    throw new Error(
      typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "Could not save your squad pick",
    );
  }
}

/** Remove team/player pick for a match so the fan can leave and rejoin later. */
export async function deleteUserIdentityForMatch(
  userId: string,
  matchId: string,
): Promise<void> {
  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  await client.database
    .from("user_identities")
    .delete()
    .eq("user_id", userId)
    .eq("match_id", matchId);

  await client.database
    .from("fan_presence")
    .delete()
    .eq("user_id", userId)
    .eq("match_id", matchId);
}

/**
 * Restore the user's squad pick from Postgres. Looks at every match they have
 * joined, not just the featured one, so a pick for a fixture later in the week
 * survives a reload — losing it would also revoke chat access, since the
 * chat_messages RLS policy is keyed off this row.
 *
 * DB is source of truth when InsForge is enabled; local Zustand persist is
 * updated in place.
 */
export async function hydrateIdentityForCurrentMatch(userId: string): Promise<UserIdentity | null> {
  const { getMatch, getDerivedMatchStatus } = await import("@/lib/mock/data");
  const { useMatchdayStore } = await import("@/store/matchday-store");

  // Already sorted newest-first.
  const identities = await fetchUserIdentities(userId);
  if (identities.length === 0) return null;

  const identity = identities.find((candidate) => {
    const match = getMatch(candidate.matchId);
    // Unknown match: outside the loaded fixture window, so assume still active.
    if (!match) return true;
    return getDerivedMatchStatus(match) !== "finished";
  });
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
