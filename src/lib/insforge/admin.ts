import { createAdminClient } from "@insforge/sdk";
import { INSFORGE_API_KEY, INSFORGE_URL } from "./config";

export function createInsForgeAdminClient() {
  if (!INSFORGE_URL || !INSFORGE_API_KEY) {
    throw new Error("INSFORGE_URL and INSFORGE_API_KEY are required for admin operations");
  }

  return createAdminClient({
    baseUrl: INSFORGE_URL,
    apiKey: INSFORGE_API_KEY,
  });
}
