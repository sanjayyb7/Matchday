import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { APP_URL, INSFORGE_ANON_KEY, INSFORGE_URL } from "@/lib/insforge/config";

const ALLOWED_PROVIDERS = new Set(["google"]);

function oauthCallbackUrl(): string {
  return new URL("/api/auth/callback", APP_URL.replace(/\/$/, "")).toString();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url),
    );
  }

  const cookieStore = await cookies();
  const client = createServerClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
    cookies: cookieStore,
  });

  const { data, error } = await client.auth.signInWithOAuth(provider, {
    redirectTo: oauthCallbackUrl(),
    skipBrowserRedirect: true,
    // Force Google to show the account picker even when the user still has an
    // active Google session, so logout reliably requires a fresh login.
    additionalParams: { prompt: "select_account" },
  });

  if (error || !data?.url || !data.codeVerifier) {
    console.error("OAuth init failed", error?.message ?? "missing url or verifier");
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", request.url),
    );
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
