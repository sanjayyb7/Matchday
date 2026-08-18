"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { refreshActiveMatchFromApi } from "@/lib/mock/data";
import { BottomNav } from "./BottomNav";
import { MatchReminderSheet } from "@/components/match/MatchReminderSheet";
import { PlayerProfileModal } from "@/components/player/PlayerProfileModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useInactivityLogout();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshActiveMatchFromApi();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="live-pulse h-3 w-3 rounded-full bg-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-dvh">
      {children}
      <BottomNav />
      <MatchReminderSheet />
      <PlayerProfileModal />
    </div>
  );
}
