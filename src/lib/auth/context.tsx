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
import { mockAuthAdapter, SESSION_KEY } from "@/lib/auth/mock-auth";
import {
  mapInsForgeUser,
  syncInsForgeProfile,
  type InsForgeAuthUser,
} from "@/lib/auth/insforge-auth";
import { bootstrapInsForgeBackend } from "@/lib/insforge/bootstrap";
import { getInsForgeBrowserClient, resetInsForgeBrowserClient } from "@/lib/insforge/client";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import type { AuthUser, SignUpInput } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
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
    return JSON.parse(raw) as AuthUser;
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
        await bootstrapInsForgeBackend();
        const client = getInsForgeBrowserClient();
        const { data } = await client.auth.getCurrentUser();
        if (cancelled) return;
        if (data.user) {
          const authUser = mapInsForgeUser(data.user as InsForgeAuthUser);
          await syncInsForgeProfile(data.user as InsForgeAuthUser);
          await bootstrapInsForgeBackend(authUser.id);
          setInsforgeUser(authUser);
        } else {
          setInsforgeUser(null);
        }
      } catch {
        if (!cancelled) setInsforgeUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const user = INSFORGE_ENABLED ? insforgeUser : mockUser;

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
      isLoading,
      signUp,
      signIn,
      signOut,
      deleteAccount,
    }),
    [user, isLoading, signUp, signIn, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
