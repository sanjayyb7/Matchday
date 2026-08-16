import { createInsForgeServerClient } from "@/lib/insforge/server";
import { loadUserRole } from "@/lib/auth/load-user-role";
import type { UserRole } from "@/types";

export async function requireAuthUser(): Promise<{
  id: string;
  email?: string;
  role: UserRole;
}> {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  const user = data?.user;
  if (error || !user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const role = await loadUserRole(user.id);
  return {
    id: user.id,
    email: user.email ?? undefined,
    role,
  };
}
