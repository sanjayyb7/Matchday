import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { INSFORGE_ANON_KEY, INSFORGE_URL } from "./config";

export async function createInsForgeServerClient() {
  return createServerClient({
    baseUrl: INSFORGE_URL,
    anonKey: INSFORGE_ANON_KEY,
    cookies: await cookies(),
  });
}
