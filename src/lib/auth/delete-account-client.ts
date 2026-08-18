import type { InsForgeClient } from "@insforge/sdk";

type DatabaseClient = InsForgeClient["database"];

async function deleteUserRows(
  db: DatabaseClient,
  userId: string,
): Promise<void> {
  await db.from("chat_messages").delete().eq("user_id", userId);
  await db.from("match_history").delete().eq("user_id", userId);
  await db.from("user_identities").delete().eq("user_id", userId);
  await db.from("fan_presence").delete().eq("user_id", userId);
  await db.from("profiles").delete().eq("id", userId);
}

/** Delete all app-owned rows for the signed-in user (browser SDK + RLS). */
export async function deleteInsForgeUserDataClient(userId: string): Promise<void> {
  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  await deleteUserRows(getInsForgeBrowserClient().database, userId);
}
