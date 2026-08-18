/**
 * Bumble-style Google sign-in alerts.
 *
 * Delivery order:
 * 1. Resend (RESEND_API_KEY) — works on free tier
 * 2. InsForge emails — requires paid InsForge plan
 */

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

function buildSignInEmailHtml(
  displayName: string,
  email: string,
  isNew: boolean,
): string {
  const name = escapeHtml(displayName);
  const safeEmail = escapeHtml(email);
  const when = escapeHtml(
    new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Los_Angeles",
    }),
  );
  const intro = isNew
    ? `Welcome to LocalDerby, ${name}. Your account was just created with Google.`
    : `Hi ${name} — someone just signed in to LocalDerby with <strong style="color:#fff;">${safeEmail}</strong> via Google.`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0B0F14; color:#ffffff; padding:32px 20px;">
      <div style="max-width:480px; margin:0 auto;">
        <div style="width:40px; height:40px; border-radius:999px; background:#FFFC00; color:#0B0F14; font-weight:800; line-height:40px; text-align:center;">LD</div>
        <h1 style="margin:24px 0 12px; font-size:28px; line-height:1.2;">
          ${isNew ? "Welcome — you're signed in" : "New LocalDerby sign-in"}
        </h1>
        <p style="margin:0 0 16px; color:rgba(255,255,255,0.75); font-size:16px; line-height:1.5;">
          ${intro}
        </p>
        <p style="margin:0 0 16px; color:rgba(255,255,255,0.55); font-size:14px; line-height:1.5;">
          Account: ${safeEmail}<br/>
          Time: ${when} (Pacific)<br/>
          Method: Google
        </p>
        <p style="margin:0 0 16px; color:rgba(255,255,255,0.55); font-size:14px; line-height:1.5;">
          If this was you, no action needed. If it wasn't, secure your Google account.
        </p>
        <a href="https://localderby.live/map" style="display:inline-block; margin-top:8px; background:#FFFC00; color:#0B0F14; text-decoration:none; font-weight:700; padding:12px 18px; border-radius:999px;">
          Open LocalDerby
        </a>
      </div>
    </div>
  `.trim();
}

async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY is not set" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "LocalDerby <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `Resend ${response.status}: ${body.slice(0, 240)}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function sendViaInsForge(options: {
  to: string;
  subject: string;
  html: string;
  accessToken?: string | null;
}): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  try {
    const { createClient } = await import("@insforge/sdk");
    const {
      INSFORGE_ANON_KEY,
      INSFORGE_API_KEY,
      INSFORGE_URL,
    } = await import("@/lib/insforge/config");

    if (!INSFORGE_URL) {
      return { ok: false, skipped: true, error: "INSFORGE_URL is not set" };
    }

    let client;
    if (INSFORGE_API_KEY) {
      const { createInsForgeAdminClient } = await import(
        "@/lib/insforge/admin"
      );
      client = createInsForgeAdminClient();
    } else if (INSFORGE_ANON_KEY) {
      client = createClient({
        baseUrl: INSFORGE_URL,
        anonKey: INSFORGE_ANON_KEY,
      });
      if (options.accessToken) {
        client.setAccessToken(options.accessToken);
      }
    } else {
      return {
        ok: false,
        skipped: true,
        error: "No InsForge credentials for email",
      };
    }

    const { error } = await client.emails.send({
      to: options.to,
      subject: options.subject,
      html: options.html,
      from: "LocalDerby",
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Always email the user after a successful Google OAuth login (every time).
 */
export async function sendGoogleSignInAlert(
  user: {
    email?: string | null;
    createdAt?: string;
    profile?: { name?: string | null } | null;
  },
  accessToken?: string | null,
): Promise<void> {
  const email = user.email?.trim();
  if (!email) {
    console.error("Google sign-in email skipped: user has no email");
    return;
  }

  const displayName =
    user.profile?.name?.trim() || email.split("@")[0] || "fan";
  const isNew = isNewlyCreatedUser(user.createdAt);
  const subject = isNew
    ? "Welcome to LocalDerby — signed in with Google"
    : "New LocalDerby sign-in with Google";
  const html = buildSignInEmailHtml(displayName, email, isNew);

  const resend = await sendViaResend({ to: email, subject, html });
  if (resend.ok) return;
  if (!resend.skipped) {
    console.error("Resend sign-in email failed:", resend.error);
  }

  const insforge = await sendViaInsForge({
    to: email,
    subject,
    html,
    accessToken,
  });
  if (insforge.ok) return;

  console.error(
    "Google sign-in email failed (need RESEND_API_KEY or paid InsForge email):",
    insforge.error || resend.error,
  );
}

/** @deprecated use sendGoogleSignInAlert */
export async function sendOAuthLoginEmails(
  user: {
    email?: string | null;
    createdAt?: string;
    profile?: { name?: string | null } | null;
  },
  accessToken?: string | null,
): Promise<void> {
  await sendGoogleSignInAlert(user, accessToken);
}
