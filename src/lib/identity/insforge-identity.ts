import { getInsForgeBrowserClient } from "@/lib/insforge/client";
import type { UserIdentity } from "@/types";

export async function upsertUserIdentity(identity: UserIdentity) {
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

  await client.database.from("user_identities").insert(payload);
}
