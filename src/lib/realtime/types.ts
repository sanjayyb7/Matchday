import type { ChatMessage, FanPresence } from "@/types";

export interface RealtimeAdapter {
  publishLocation(presence: FanPresence): void;
  clearPresence(userId: string): void;
  subscribeToPresence(callback: (presence: FanPresence[]) => void): () => void;
  subscribeToPubSquad(
    pubId: string,
    callback: (squad: FanPresence[]) => void,
  ): () => void;
  subscribeToTeamChat(
    teamId: string,
    matchId: string,
    callback: (messages: ChatMessage[]) => void,
  ): () => void;
  sendChatMessage(message: Omit<ChatMessage, "id" | "createdAt">): void;
  getPresence(): FanPresence[];
}
