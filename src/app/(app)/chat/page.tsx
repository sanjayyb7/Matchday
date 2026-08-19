"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMatchdayStore } from "@/store/matchday-store";
import { isIdentityStillActive } from "@/lib/mock/data";
import { MatchChatGate } from "@/components/match/MatchChatGate";
import { useMatchIdentity } from "@/hooks/useMatchIdentity";

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  useMatchIdentity(user?.id);
  const inSquad = isIdentityStillActive(identity, user?.id);

  useEffect(() => {
    if (!user || !inSquad) return;
    router.replace(`/chat/${identity!.teamId}`);
  }, [user, identity, inSquad, router]);

  if (user && inSquad) {
    return null;
  }

  return <MatchChatGate />;
}
