import { INSFORGE_ANON_KEY, INSFORGE_URL } from "@/lib/insforge/config";
import type { InsForgeAuthUser } from "@/lib/auth/insforge-auth";

function readAccessTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)insforge_access_token=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Hydrate the signed-in user via the same-origin refresh route so localhost
 * auth cookies are used (auth.getCurrentUser() refresh hits InsForge directly).
 */
export async function loadInsForgeUserFromSession(): Promise<InsForgeAuthUser | null> {
  try {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      const body = (await refreshRes.json()) as { user?: InsForgeAuthUser };
      if (body.user) return body.user;
    }
  } catch {
    // fall through to access-token lookup
  }

  const accessToken = readAccessTokenCookie();
  if (!accessToken) return null;

  try {
    const res = await fetch(`${INSFORGE_URL}/api/auth/sessions/current`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: INSFORGE_ANON_KEY,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { user?: InsForgeAuthUser };
    return body.user ?? null;
  } catch {
    return null;
  }
}
