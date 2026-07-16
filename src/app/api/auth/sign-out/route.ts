import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { clearInsForgeAuthCookies } from "@/lib/insforge/server";
import { INSFORGE_ANON_KEY, INSFORGE_URL } from "@/lib/insforge/config";

export async function POST() {
  const cookieStore = await cookies();
  const client = createServerClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
    cookies: cookieStore,
  });

  // Revoke the session (and refresh token) on the InsForge backend. Even if
  // this fails we still clear the cookies below so the browser is signed out.
  try {
    await client.auth.signOut();
  } catch {
    // Ignore — cookie invalidation below still logs the user out locally.
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearInsForgeAuthCookies(response);
  return response;
}
