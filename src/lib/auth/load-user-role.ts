import { getInsForgeBrowserClient } from "@/lib/insforge/client";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import type { UserRole } from "@/types";

export async function loadUserRole(userId: string): Promise<UserRole> {
  if (!INSFORGE_ENABLED) return "fan";

  const client = getInsForgeBrowserClient();
  const { data, error } = await client.database
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.role) return "fan";
  return data.role === "admin" ? "admin" : "fan";
}
