"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { mockAuthAdapter, SESSION_KEY } from "@/lib/auth/mock-auth";
import type { AuthUser, SignUpInput } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (input: SignUpInput) => AuthUser;
  signIn: () => AuthUser | null;
  signOut: () => void;
  deleteAccount: () => void;
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

  const user = useMemo(() => parseSession(sessionRaw), [sessionRaw]);

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

  const signOut = useCallback(() => {
    mockAuthAdapter.signOut();
    notifyAuthListeners();
  }, []);

  const deleteAccount = useCallback(() => {
    mockAuthAdapter.deleteAccount();
    notifyAuthListeners();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      signUp,
      signIn,
      signOut,
      deleteAccount,
    }),
    [user, signUp, signIn, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
