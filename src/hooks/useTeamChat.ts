"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "@/lib/realtime/context";
import type { ChatMessage } from "@/types";

export function useTeamChat(teamId: string, matchId: string) {
  const realtime = useRealtime();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    return realtime.subscribeToTeamChat(teamId, matchId, setMessages);
  }, [teamId, matchId, realtime]);

  const sendMessage = (text: string, userId: string, playerId: string) => {
    realtime.sendChatMessage({ teamId, matchId, userId, playerId, text });
  };

  return { messages, sendMessage };
}
