import type { AuthUser, SignUpInput } from "@/types";

export interface AuthAdapter {
  signUp(input: SignUpInput): AuthUser;
  signIn(): AuthUser | null;
  signOut(): void;
  getSession(): AuthUser | null;
  deleteAccount(): void;
}

export type OAuthProvider = "google" | "github";
