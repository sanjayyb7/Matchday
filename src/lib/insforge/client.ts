import { createBrowserClient } from "@insforge/sdk/ssr";
import { INSFORGE_ANON_KEY, INSFORGE_ENABLED, INSFORGE_URL } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getInsForgeBrowserClient() {
  if (!INSFORGE_ENABLED) {
    throw new Error("InsForge is not enabled");
  }
  if (!browserClient) {
    browserClient = createBrowserClient({
      baseUrl: INSFORGE_URL,
      anonKey: INSFORGE_ANON_KEY,
    });
  }
  return browserClient;
}

export function resetInsForgeBrowserClient() {
  browserClient = null;
}
