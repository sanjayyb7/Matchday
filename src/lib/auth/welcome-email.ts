import type { InsForgeClient } from "@insforge/sdk";

const NEW_USER_WINDOW_MS = 5 * 60 * 1000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isNewlyCreatedUser(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return Date.now() - createdMs < NEW_USER_WINDOW_MS;
}

export function buildWelcomeEmailHtml(displayName: string): string {
  const name = escapeHtml(displayName);
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0B0F14; color:#ffffff; padding:32px 20px;">
      <div style="max-width:480px; margin:0 auto;">
        <div style="width:40px; height:40px; border-radius:999px; background:#FFFC00; color:#0B0F14; font-weight:800; display:flex; align-items:center; justify-content:center;">LD</div>
        <h1 style="margin:24px 0 12px; font-size:28px; line-height:1.2;">Welcome to LocalDerby, ${name}</h1>
        <p style="margin:0 0 16px; color:rgba(255,255,255,0.75); font-size:16px; line-height:1.5;">
          You're in. Find the SF pub showing the match, pick your team and player, and jump into squad chat with fans around you.
        </p>
        <a href="https://localderby.live/map" style="display:inline-block; margin-top:8px; background:#FFFC00; color:#0B0F14; text-decoration:none; font-weight:700; padding:12px 18px; border-radius:999px;">
          Open LocalDerby
        </a>
        <p style="margin:28px 0 0; color:rgba(255,255,255,0.45); font-size:13px;">
          See you on matchday.
        </p>
      </div>
    </div>
  `.trim();
}

/**
 * Sends a welcome email after Google (or other OAuth) signup.
 * Google OAuth skips InsForge auth verification emails by design — this is the
 * custom transactional welcome instead. Failures are logged, never thrown.
 */
export async function sendWelcomeEmailIfNewUser(
  client: InsForgeClient,
  user: {
    email?: string | null;
    createdAt?: string;
    profile?: { name?: string | null } | null;
  },
): Promise<void> {
  const email = user.email?.trim();
  if (!email || !isNewlyCreatedUser(user.createdAt)) return;

  const displayName =
    user.profile?.name?.trim() || email.split("@")[0] || "fan";

  try {
    const { error } = await client.emails.send({
      to: email,
      subject: "Welcome to LocalDerby",
      html: buildWelcomeEmailHtml(displayName),
      from: "LocalDerby",
    });
    if (error) {
      console.error("Welcome email failed:", error.message);
    }
  } catch (error) {
    console.error(
      "Welcome email failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
