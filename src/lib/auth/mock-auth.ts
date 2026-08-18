import type { AuthUser, SignUpInput } from "@/types";

export interface AuthAdapter {
  signUp(input: SignUpInput): AuthUser;
  signIn(): AuthUser | null;
  signOut(): void;
  getSession(): AuthUser | null;
  deleteAccount(): void;
}

export const SESSION_KEY = "matchday:session";

function avatarForName(name: string): string {
  const seed = encodeURIComponent(name.trim() || "fan");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=FFFC00`;
}

export const mockAuthAdapter: AuthAdapter = {
  signUp({ name, email }) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Name is required");
    }
    const user: AuthUser = {
      id: `fan-${crypto.randomUUID().slice(0, 8)}`,
      name: trimmed,
      email: email?.trim() || undefined,
      avatarUrl: avatarForName(trimmed),
      fanSince: new Date().toISOString(),
      role: "fan",
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  signIn() {
    return this.getSession();
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  deleteAccount() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("matchday:history");
    localStorage.removeItem("matchday:identities");
    localStorage.removeItem("matchday:dismissed-matches");
  },
};
