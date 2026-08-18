import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { clearAuthCookies } from "@insforge/sdk/ssr";
import { createServerClient } from "@insforge/sdk/ssr";
import { INSFORGE_ANON_KEY, INSFORGE_URL } from "./config";

export async function createInsForgeServerClient() {
  return createServerClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
    cookies: await cookies(),
  });
}

const CSRF_TOKEN_COOKIE = "insforge_csrf_token";

/**
 * Expires all InsForge auth cookies on the response so the browser removes
 * them on sign-out / account deletion.
 *
 * Uses the SDK's `clearAuthCookies` for the access + refresh tokens because it
 * writes the deletion cookie with an explicit `Path=/` that matches how the
 * cookies were originally set — a plain `cookies.delete(name)` from an
 * `/api/auth/*` route defaults the path to `/api/auth`, which does not match
 * and leaves the (httpOnly) cookies intact in the browser.
 */
export function clearInsForgeAuthCookies(response: NextResponse) {
  clearAuthCookies(response.cookies);
  response.cookies.set(CSRF_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
