"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMatchdayStore } from "@/store/matchday-store";
import {
  getLiveOrUpcomingMatch,
  identityMatchesActiveMatch,
} from "@/lib/mock/data";
import { MatchChatGate } from "@/components/match/MatchChatGate";

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const identity = useMatchdayStore((s) => s.identity);
  const activeMatch = getLiveOrUpcomingMatch();

  useEffect(() => {
    if (!user || !activeMatch) return;
    if (identityMatchesActiveMatch(identity, user.id, activeMatch)) {
      router.replace(`/chat/${identity!.teamId}`);
    }
  }, [user, identity, activeMatch, router]);

  if (
    user &&
    activeMatch &&
    identityMatchesActiveMatch(identity, user.id, activeMatch)
  ) {
    return null;
  }

  return <MatchChatGate />;
}
