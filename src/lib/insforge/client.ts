/**
 * InsForge client stub — wire up in v2 with @insforge/sdk
 *
 * import { createClient } from '@insforge/sdk'
 * export const insforge = createClient({
 *   baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
 *   anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
 * })
 */
export const INSFORGE_ENABLED =
  process.env.NEXT_PUBLIC_USE_INSFORGE === "true";
