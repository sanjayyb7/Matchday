import { NextResponse, type NextRequest } from "next/server";
import { updateSession, type CookieStore } from "@insforge/sdk/ssr";
import { INSFORGE_ANON_KEY, INSFORGE_ENABLED, INSFORGE_URL } from "@/lib/insforge/config";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (INSFORGE_ENABLED) {
    await updateSession({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
      requestCookies: request.cookies as unknown as CookieStore,
      responseCookies: response.cookies,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
