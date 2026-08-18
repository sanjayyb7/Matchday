import { getInsForgeBrowserClient } from "@/lib/insforge/client";
import { createInsForgeAdminClient } from "@/lib/insforge/admin";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import type { UserRole } from "@/types";

function mapRole(role: unknown): UserRole {
  if (role === "admin") return "admin";
  if (role === "partner") return "partner";
  return "fan";
}

export async function loadUserRole(userId: string): Promise<UserRole> {
  if (!INSFORGE_ENABLED) return "fan";

  // Server routes: use admin client so role reads don't depend on browser cookies/RLS.
  if (typeof window === "undefined") {
    try {
      const { data, error } = await createInsForgeAdminClient()
        .database.from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data?.role) return mapRole(data.role);
    } catch {
      // fall through
    }
  }

  try {
    const client = getInsForgeBrowserClient();
    const { data, error } = await client.database
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data?.role) return "fan";
    return mapRole(data.role);
  } catch {
    return "fan";
  }
}
