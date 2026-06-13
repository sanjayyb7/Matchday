import type { AuthUser } from "@/types";

type InsForgeProfile = {
  name?: string;
  avatar_url?: string;
  [key: string]: unknown;
};

export type InsForgeAuthUser = {
  id: string;
  email?: string;
  created_at?: string;
  createdAt?: string;
  profile?: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  } | null;
};

function avatarForName(name: string): string {
  const seed = encodeURIComponent(name.trim() || "fan");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=FFFC00`;
}

export function mapInsForgeUser(user: InsForgeAuthUser): AuthUser {
  const profile = user.profile ?? undefined;
  const name =
    profile?.name?.trim() ||
    user.email?.split("@")[0] ||
    "Fan User";

  return {
    id: user.id,
    name,
    email: user.email,
    avatarUrl: profile?.avatar_url ?? avatarForName(name),
    fanSince: user.created_at ?? user.createdAt ?? new Date().toISOString(),
  };
}

export async function syncInsForgeProfile(
  user: InsForgeAuthUser,
  displayName?: string,
): Promise<void> {
  const client = await import("@/lib/insforge/client").then((m) =>
    m.getInsForgeBrowserClient(),
  );

  const name = displayName?.trim() || user.profile?.name;
  if (name && name !== user.profile?.name) {
    await client.auth.setProfile({
      name,
      avatar_url: user.profile?.avatar_url ?? avatarForName(name),
    });
  }
}
