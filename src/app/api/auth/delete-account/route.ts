import { NextResponse } from "next/server";
import { createInsForgeServerClient } from "@/lib/insforge/server";
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

  await client.auth.signOut();

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("insforge_access_token");
  response.cookies.delete("insforge_refresh_token");
  response.cookies.delete("insforge_csrf_token");
  return response;
}
