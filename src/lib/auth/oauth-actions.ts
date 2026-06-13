"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { APP_URL } from "@/lib/insforge/config";
import type { OAuthProvider } from "./types";

export async function initiateOAuth(provider: OAuthProvider) {
  const client = await createInsForgeServerClient();
  const redirectTo = new URL("/api/auth/callback", APP_URL).toString();

  const { data, error } = await client.auth.signInWithOAuth(provider, {
    redirectTo,
    skipBrowserRedirect: true,
  });

  if (error || !data?.url || !data.codeVerifier) {
    throw new Error(error?.message ?? "OAuth init failed");
  }

  const cookieStore = await cookies();
  cookieStore.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  redirect(data.url);
}
