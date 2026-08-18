"use client";

import { useEffect, useState } from "react";
import {
  prepareOutgoingChatMessage,
  type OutgoingChatResult,
} from "@/lib/chat/safety";
import { useRealtime } from "@/lib/realtime/context";
import type { ChatMessage } from "@/types";

export function useTeamChat(teamId: string, matchId: string) {
  const realtime = useRealtime();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    return realtime.subscribeToTeamChat(teamId, matchId, setMessages);
  }, [teamId, matchId, realtime]);

  const sendMessage = (
    text: string,
    userId: string,
    playerId: string,
  ): OutgoingChatResult => {
    const prepared = prepareOutgoingChatMessage(text);
    if (!prepared.ok) return prepared;

    realtime.sendChatMessage({
      teamId,
      matchId,
      userId,
      playerId,
      text: prepared.text,
    });
    return prepared;
  };

  return { messages, sendMessage };
}
