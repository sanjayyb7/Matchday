import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { INSFORGE_ANON_KEY, INSFORGE_URL } from "@/lib/insforge/config";

export async function POST() {
  const cookieStore = await cookies();
  const client = createServerClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
    cookies: cookieStore,
  });

  await client.auth.signOut();

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("insforge_access_token");
  response.cookies.delete("insforge_refresh_token");
  response.cookies.delete("insforge_csrf_token");
  return response;
}
