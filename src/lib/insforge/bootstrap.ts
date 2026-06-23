import { INSFORGE_ENABLED } from "@/lib/insforge/config";

/**
 * Backend product defaults (MVP):
 * - Static catalog: hydrate from Postgres when InsForge is on (JSON fallback until loaded)
 * - Identity: Postgres is source of truth on login; Zustand mirrors for UI
 * - Delete account: remove all user-owned rows, then sign out (auth.users row retained by platform)
 * - Auth: OAuth only when InsForge is enabled
 */
export async function bootstrapInsForgeBackend(userId?: string): Promise<void> {
  if (INSFORGE_ENABLED) {
    const { hydrateStaticDataFromInsForge } = await import("@/lib/mock/data");
    await hydrateStaticDataFromInsForge();
  }

  const { refreshActiveMatchFromApi } = await import("@/lib/mock/data");
  await refreshActiveMatchFromApi();

  if (userId && INSFORGE_ENABLED) {
    const { hydrateIdentityForCurrentMatch } = await import(
      "@/lib/identity/insforge-identity"
    );
    await hydrateIdentityForCurrentMatch(userId);
  }
}
