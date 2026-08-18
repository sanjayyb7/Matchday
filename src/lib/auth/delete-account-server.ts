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

/** Delete via an authenticated server session (RLS-scoped). */
export async function deleteInsForgeUserDataServer(userId: string): Promise<void> {
  const { createInsForgeServerClient } = await import("@/lib/insforge/server");
  const client = await createInsForgeServerClient();
  await deleteUserRows(client.database, userId);
}

/** Server-side wipe using the admin API key (bypasses RLS). */
export async function deleteInsForgeUserDataAdmin(userId: string): Promise<void> {
  const { createInsForgeAdminClient } = await import("@/lib/insforge/admin");
  await deleteUserRows(createInsForgeAdminClient().database, userId);
}
