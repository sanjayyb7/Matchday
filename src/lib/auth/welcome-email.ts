/**
 * Back-compat re-exports. Prefer `@/lib/auth/login-email`.
 */
export {
  sendGoogleSignInAlert,
  sendOAuthLoginEmails,
} from "@/lib/auth/login-email";

import type { InsForgeClient } from "@insforge/sdk";
import { sendGoogleSignInAlert } from "@/lib/auth/login-email";

/** @deprecated Prefer sendGoogleSignInAlert */
export async function sendWelcomeEmailIfNewUser(
  client: InsForgeClient,
  user: {
    email?: string | null;
    createdAt?: string;
    profile?: { name?: string | null } | null;
  },
): Promise<void> {
  void client;
  await sendGoogleSignInAlert(user);
}
