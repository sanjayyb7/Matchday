const POLICY_LINK_WARNING =
  "Links aren't allowed in squad chat — that breaks our policy. Share your thoughts without URLs.";

/** Obvious URL / link shapes we refuse to publish. */
const LINK_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /ftp:\/\//i,
  /www\./i,
  /\/\/[^\s/]+/i,
  /\bjavascript\s*:/i,
  /\bdata\s*:/i,
  /\bvbscript\s*:/i,
  /\[[^\]]*\]\((?:\s*<?(?:https?:\/\/|ftp:\/\/|\/\/|www\.)[^)\s>]+>?)\s*\)/i,
  /<\s*https?:\/\/[^>\s]+>/i,
  // Bare domains with a common TLD (with optional path/query)
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|org|net|io|co|app|dev|live|xyz|info|me|tv|gg|ai|uk|us|ca|de|fr|es|it|nl|au|in|edu|gov)(?:[\/?#][^\s]*)?\b/i,
];

export function containsDisallowedLink(text: string): boolean {
  const normalized = text.normalize("NFKC");
  return LINK_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Neutralize markup / script-friendly characters so pasted payloads can't
 * keep working if text is ever rendered unsafely. Safe for React text nodes
 * (does not HTML-entity-encode normal punctuation into visible &lt;).
 */
export function sanitizeChatText(raw: string): string {
  let text = raw.normalize("NFKC");

  // Control chars + zero-width joiners used to hide payloads
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Strip HTML/XML tags, then remove leftover angle brackets
  text = text.replace(/<\/?[a-zA-Z!][^>]*>/g, "");
  text = text.replace(/[<>]/g, "");

  // Defang dangerous URI schemes and inline handlers
  text = text.replace(/javascript\s*:/gi, "java script:");
  text = text.replace(/data\s*:/gi, "data :");
  text = text.replace(/vbscript\s*:/gi, "vb script:");
  text = text.replace(/\bon[a-z]+\s*=/gi, "on-event=");

  // Soft-defang remaining URL-ish separators so reconstructed links break
  text = text.replace(/:\/\//g, "[://]");

  return text.replace(/\s+/g, " ").trim();
}

export type OutgoingChatResult =
  | { ok: true; text: string }
  | { ok: false; warning: string };

/** Gate + sanitize before a message is published to the room. */
export function prepareOutgoingChatMessage(raw: string): OutgoingChatResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, warning: "Message can't be empty." };
  }

  if (containsDisallowedLink(trimmed)) {
    return { ok: false, warning: POLICY_LINK_WARNING };
  }

  const text = sanitizeChatText(trimmed);
  if (!text) {
    return {
      ok: false,
      warning: "That message couldn't be sent. Try different wording.",
    };
  }

  // Re-check after sanitization in case defanging still left a link shape
  if (containsDisallowedLink(text)) {
    return { ok: false, warning: POLICY_LINK_WARNING };
  }

  return { ok: true, text };
}

export { POLICY_LINK_WARNING };
