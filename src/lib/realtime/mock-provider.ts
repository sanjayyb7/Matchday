"use client";

import {
  CHAT_TEMPLATES,
  createSimulatedFans,
  simulatedFanToPresence,
  walkSimulatedFan,
  type SimulatedFan,
} from "@/lib/mock/simulatedFans";
import { prepareOutgoingChatMessage } from "@/lib/chat/safety";
import { getPub, pubs } from "@/lib/mock/data";
import { haversine } from "@/lib/geo/haversine";
import { NEAR_PUB_RADIUS_METERS } from "@/lib/mock/constants";
import type { ChatMessage, FanPresence } from "@/types";
import type { RealtimeAdapter } from "./types";

class MockRealtimeEngine implements RealtimeAdapter {
  private presence = new Map<string, FanPresence>();
  private chatMessages = new Map<string, ChatMessage[]>();
  private presenceListeners = new Set<(p: FanPresence[]) => void>();
  private squadListeners = new Map<string, Set<(s: FanPresence[]) => void>>();
  private chatListeners = new Map<string, Set<(m: ChatMessage[]) => void>>();
  private simulatedFans: SimulatedFan[] = [];
  private walkInterval?: ReturnType<typeof setInterval>;
  private chatInterval?: ReturnType<typeof setInterval>;
  private channel?: BroadcastChannel;

  constructor() {
    if (typeof window === "undefined") return;
    this.simulatedFans = createSimulatedFans(20);
    this.simulatedFans.forEach((fan) => {
      this.presence.set(fan.userId, simulatedFanToPresence(fan));
    });
    this.channel = new BroadcastChannel("matchday-realtime");
    this.channel.onmessage = (e) => this.handleBroadcast(e.data);
    this.startSimulation();
  }

  private chatKey(teamId: string, matchId: string) {
    return `${teamId}:${matchId}`;
  }

  private handleBroadcast(data: { type: string; payload: unknown }) {
    if (data.type === "presence") {
      const p = data.payload as FanPresence;
      this.presence.set(p.userId, p);
      this.notifyPresence();
    }
    if (data.type === "chat") {
      const msg = data.payload as ChatMessage;
      const key = this.chatKey(msg.teamId, msg.matchId);
      const list = this.chatMessages.get(key) ?? [];
      this.chatMessages.set(key, [...list, msg]);
      this.notifyChat(key);
    }
  }

  private broadcast(type: string, payload: unknown) {
    this.channel?.postMessage({ type, payload });
  }

  private startSimulation() {
    this.walkInterval = setInterval(() => {
      this.simulatedFans = this.simulatedFans.map((fan) => {
        const pub = getPub(fan.pubId) ?? pubs[0];
        const updated = walkSimulatedFan(fan, pub);
        this.presence.set(updated.userId, simulatedFanToPresence(updated));
        return updated;
      });
      this.notifyPresence();
    }, 5000);

    this.chatInterval = setInterval(() => {
      const fan = this.simulatedFans[Math.floor(Math.random() * this.simulatedFans.length)];
      const matchId = "match-spain-france";
      const text = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
      this.sendChatMessage({
        teamId: fan.teamId,
        matchId,
        userId: fan.userId,
        playerId: fan.playerId,
        text,
        isSimulated: true,
      });
    }, 25000);
  }

  private notifyPresence() {
    const all = Array.from(this.presence.values());
    this.presenceListeners.forEach((cb) => cb(all));
    this.squadListeners.forEach((listeners, pubId) => {
      const squad = this.getSquadForPub(pubId, all);
      listeners.forEach((cb) => cb(squad));
    });
  }

  private notifyChat(key: string) {
    const messages = this.chatMessages.get(key) ?? [];
    this.chatListeners.get(key)?.forEach((cb) => cb(messages));
  }

  private getSquadForPub(pubId: string, all: FanPresence[]): FanPresence[] {
    const pub = getPub(pubId);
    if (!pub) return [];
    return all.filter((p) => {
      // Trust the assigned pub so a fan never appears at two adjacent pubs.
      if (p.pubId) return p.pubId === pubId;
      return haversine(p.lat, p.lng, pub.lat, pub.lng) <= NEAR_PUB_RADIUS_METERS;
    });
  }

  publishLocation(presence: FanPresence) {
    this.presence.set(presence.userId, presence);
    this.broadcast("presence", presence);
    this.notifyPresence();
  }

  clearPresence(userId: string) {
    if (!this.presence.has(userId)) return;
    this.presence.delete(userId);
    this.notifyPresence();
  }

  subscribeToPresence(callback: (presence: FanPresence[]) => void) {
    this.presenceListeners.add(callback);
    callback(Array.from(this.presence.values()));
    return () => this.presenceListeners.delete(callback);
  }

  subscribeToPubSquad(pubId: string, callback: (squad: FanPresence[]) => void) {
    if (!this.squadListeners.has(pubId)) {
      this.squadListeners.set(pubId, new Set());
    }
    this.squadListeners.get(pubId)!.add(callback);
    callback(this.getSquadForPub(pubId, Array.from(this.presence.values())));
    return () => this.squadListeners.get(pubId)?.delete(callback);
  }

  subscribeToTeamChat(
    teamId: string,
    matchId: string,
    callback: (messages: ChatMessage[]) => void,
  ) {
    const key = this.chatKey(teamId, matchId);
    if (!this.chatListeners.has(key)) {
      this.chatListeners.set(key, new Set());
    }
    if (!this.chatMessages.has(key)) {
      this.chatMessages.set(key, []);
    }
    this.chatListeners.get(key)!.add(callback);
    callback(this.chatMessages.get(key) ?? []);
    return () => this.chatListeners.get(key)?.delete(callback);
  }

  sendChatMessage(message: Omit<ChatMessage, "id" | "createdAt">) {
    const prepared = prepareOutgoingChatMessage(message.text);
    if (!prepared.ok) return;

    const full: ChatMessage = {
      ...message,
      text: prepared.text,
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const key = this.chatKey(message.teamId, message.matchId);
    const list = this.chatMessages.get(key) ?? [];
    this.chatMessages.set(key, [...list, full]);
    this.broadcast("chat", full);
    this.notifyChat(key);
  }

  getPresence() {
    return Array.from(this.presence.values());
  }

  destroy() {
    clearInterval(this.walkInterval);
    clearInterval(this.chatInterval);
    this.channel?.close();
  }
}

let engine: MockRealtimeEngine | null = null;

export function getMockRealtimeEngine(): MockRealtimeEngine {
  if (!engine) engine = new MockRealtimeEngine();
  return engine;
}

export const mockRealtimeAdapter: RealtimeAdapter = {
  publishLocation(p) {
    getMockRealtimeEngine().publishLocation(p);
  },
  clearPresence(userId) {
    getMockRealtimeEngine().clearPresence(userId);
  },
  subscribeToPresence(cb) {
    return getMockRealtimeEngine().subscribeToPresence(cb);
  },
  subscribeToPubSquad(pubId, cb) {
    return getMockRealtimeEngine().subscribeToPubSquad(pubId, cb);
  },
  subscribeToTeamChat(teamId, matchId, cb) {
    return getMockRealtimeEngine().subscribeToTeamChat(teamId, matchId, cb);
  },
  sendChatMessage(msg) {
    getMockRealtimeEngine().sendChatMessage(msg);
  },
  getPresence() {
    return getMockRealtimeEngine().getPresence();
  },
};
