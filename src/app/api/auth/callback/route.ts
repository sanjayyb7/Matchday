import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { APP_URL, INSFORGE_ANON_KEY, INSFORGE_URL } from "@/lib/insforge/config";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code) {
    if (oauthError) {
      console.error("OAuth callback error from provider", oauthError);
    }
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", APP_URL),
    );
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("insforge_code_verifier")?.value;
  if (!codeVerifier) {
    console.error("OAuth callback missing PKCE verifier cookie");
    return NextResponse.redirect(
      new URL("/login?error=missing_verifier", APP_URL),
    );
  }

  const client = createServerClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
    cookies: cookieStore,
  });

  const { data, error } = await client.auth.exchangeOAuthCode(
    code,
    codeVerifier,
  );

  if (error || !data?.accessToken) {
    console.error(
      "OAuth code exchange failed",
      error?.message ?? "missing access token",
      error?.statusCode,
    );
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", APP_URL),
    );
  }

  const response = NextResponse.redirect(new URL("/map", APP_URL));
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  response.cookies.delete("insforge_code_verifier");
  return response;
}
