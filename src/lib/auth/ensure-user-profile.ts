import { getInsForgeBrowserClient } from "@/lib/insforge/client";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import type { InsForgeAuthUser } from "@/lib/auth/insforge-auth";

function avatarForName(name: string): string {
  const seed = encodeURIComponent(name.trim() || "fan");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=FFFC00`;
}

/** Ensures public.profiles exists for OAuth users (trigger may have missed pre-migration signups). */
export async function ensureUserProfile(user: InsForgeAuthUser): Promise<void> {
  if (!INSFORGE_ENABLED) return;

  const client = getInsForgeBrowserClient();
  const { data: existing } = await client.database
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const name =
    user.profile?.name?.trim() ||
    user.email?.split("@")[0] ||
    "Fan";

  await client.database.from("profiles").insert([
    {
      id: user.id,
      display_name: name,
      avatar_url: user.profile?.avatar_url ?? avatarForName(name),
      fan_since: user.created_at ?? user.createdAt ?? new Date().toISOString(),
      role: "fan",
    },
  ]);
}
