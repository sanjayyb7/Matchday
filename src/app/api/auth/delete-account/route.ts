import { NextResponse } from "next/server";
import {
  clearInsForgeAuthCookies,
  createInsForgeServerClient,
} from "@/lib/insforge/server";
import {
  deleteInsForgeUserDataAdmin,
  deleteInsForgeUserDataServer,
} from "@/lib/auth/delete-account-server";
import { INSFORGE_API_KEY } from "@/lib/insforge/config";

export async function POST() {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();

  if (error || !data.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = data.user.id;

  try {
    if (INSFORGE_API_KEY) {
      await deleteInsForgeUserDataAdmin(userId);
    } else {
      await deleteInsForgeUserDataServer(userId);
    }
  } catch (cleanupError) {
    const message =
      cleanupError instanceof Error ? cleanupError.message : "Cleanup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    await client.auth.signOut();
  } catch {
    // Data is already deleted; still clear cookies below to end the session.
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearInsForgeAuthCookies(response);
  return response;
}
