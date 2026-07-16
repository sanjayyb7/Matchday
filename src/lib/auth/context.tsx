"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { clearLastActivity } from "@/lib/auth/activity";
import { mockAuthAdapter, SESSION_KEY } from "@/lib/auth/mock-auth";
import {
  mapInsForgeUser,
  syncInsForgeProfile,
  type InsForgeAuthUser,
} from "@/lib/auth/insforge-auth";
import { loadInsForgeUserFromSession } from "@/lib/auth/insforge-session";
import { loadUserRole } from "@/lib/auth/load-user-role";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { bootstrapInsForgeBackend } from "@/lib/insforge/bootstrap";
import { getInsForgeBrowserClient, resetInsForgeBrowserClient } from "@/lib/insforge/client";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import type { AuthUser, SignUpInput } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (input: SignUpInput) => AuthUser;
  signIn: () => AuthUser | null;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const authListeners = new Set<() => void>();

export function notifyAuthListeners() {
  authListeners.forEach((listener) => listener());
}

function subscribeToAuth(onStoreChange: () => void) {
  authListeners.add(onStoreChange);
  return () => authListeners.delete(onStoreChange);
}

function getAuthSnapshot(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SESSION_KEY) ?? "";
}

function getAuthServerSnapshot(): string {
  return "";
}

function parseSession(raw: string): AuthUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    return { ...parsed, role: parsed.role ?? "fan" };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sessionRaw = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getAuthServerSnapshot,
  );

  const mockUser = useMemo(
    () => (INSFORGE_ENABLED ? null : parseSession(sessionRaw)),
    [sessionRaw],
  );

  const [insforgeUser, setInsforgeUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(INSFORGE_ENABLED);

  useEffect(() => {
    if (!INSFORGE_ENABLED) return;

    let cancelled = false;

    async function loadUser() {
      try {
        resetInsForgeBrowserClient();
        const insForgeUser = await loadInsForgeUserFromSession();
        if (cancelled) return;

        if (insForgeUser) {
          const authUser = mapInsForgeUser(insForgeUser);
          resetInsForgeBrowserClient();
          await ensureUserProfile(insForgeUser);
          const role = await loadUserRole(authUser.id);
          if (cancelled) return;
          setInsforgeUser({ ...authUser, role });
          if (!cancelled) setIsLoading(false);
          void bootstrapInsForgeBackend().catch(() => {});
          void syncInsForgeProfile(insForgeUser).catch(() => {});
          void bootstrapInsForgeBackend(authUser.id).catch(() => {});
        } else {
          setInsforgeUser(null);
          if (!cancelled) setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setInsforgeUser(null);
          setIsLoading(false);
        }
      }
    }

    void loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const user = INSFORGE_ENABLED ? insforgeUser : mockUser;
  const isAdmin = user?.role === "admin";

  const signUp = useCallback((input: SignUpInput) => {
    const session = mockAuthAdapter.signUp(input);
    notifyAuthListeners();
    return session;
  }, []);

  const signIn = useCallback(() => {
    const session = mockAuthAdapter.signIn();
    if (session) notifyAuthListeners();
    return session;
  }, []);

  const signOut = useCallback(async () => {
    clearLastActivity();
    if (INSFORGE_ENABLED) {
      const client = getInsForgeBrowserClient();
      await client.auth.signOut();
      await fetch("/api/auth/sign-out", { method: "POST" });
      resetInsForgeBrowserClient();
      setInsforgeUser(null);
      return;
    }
    mockAuthAdapter.signOut();
    notifyAuthListeners();
  }, []);

  const deleteAccount = useCallback(async () => {
    clearLastActivity();
    if (INSFORGE_ENABLED && user) {
      const response = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!response.ok) {
        const { deleteInsForgeUserDataClient } = await import(
          "@/lib/auth/delete-account-client"
        );
        await deleteInsForgeUserDataClient(user.id);
        const client = getInsForgeBrowserClient();
        await client.auth.signOut();
        await fetch("/api/auth/sign-out", { method: "POST" });
      }
      resetInsForgeBrowserClient();
      setInsforgeUser(null);
      return;
    }
    mockAuthAdapter.deleteAccount();
    notifyAuthListeners();
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin,
      isLoading,
      signUp,
      signIn,
      signOut,
      deleteAccount,
    }),
    [user, isAdmin, isLoading, signUp, signIn, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
