import { createRefreshAuthRouter } from "@insforge/sdk/ssr";
import { INSFORGE_ANON_KEY, INSFORGE_URL } from "@/lib/insforge/config";

export const { POST } = createRefreshAuthRouter({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
});
