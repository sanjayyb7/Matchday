import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, setAuthCookies } from "@insforge/sdk/ssr";
import { INSFORGE_ANON_KEY, INSFORGE_URL } from "@/lib/insforge/config";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url),
    );
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("insforge_code_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL("/login?error=missing_verifier", request.url),
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
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", request.url),
    );
  }

  const response = NextResponse.redirect(new URL("/map", request.url));
  setAuthCookies(response.cookies, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  response.cookies.delete("insforge_code_verifier");
  return response;
}
