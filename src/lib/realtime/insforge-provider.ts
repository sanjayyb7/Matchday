"use client";

import { getPub, getLiveOrUpcomingMatch } from "@/lib/mock/data";
import { haversine } from "@/lib/geo/haversine";
import { NEAR_PUB_RADIUS_METERS } from "@/lib/mock/constants";
import { getInsForgeBrowserClient } from "@/lib/insforge/client";
import type { ChatMessage, FanPresence } from "@/types";
import type { RealtimeAdapter } from "./types";

type PresencePayload = {
  userId: string;
  playerId: string;
  teamId: string;
  lat: number;
  lng: number;
  pubId?: string | null;
  updatedAt?: string;
};

type ChatPayload = {
  id: string;
  teamId: string;
  matchId: string;
  userId: string;
  playerId: string;
  text: string;
  createdAt: string;
};

class InsForgeRealtimeEngine implements RealtimeAdapter {
  private presence = new Map<string, FanPresence>();
  private chatMessages = new Map<string, ChatMessage[]>();
  private presenceListeners = new Set<(p: FanPresence[]) => void>();
  private squadListeners = new Map<string, Set<(s: FanPresence[]) => void>>();
  private chatListeners = new Map<string, Set<(m: ChatMessage[]) => void>>();
  private matchId = getLiveOrUpcomingMatch()?.id ?? "match-spain-france";
  private presenceChannel = `presence:match:${this.matchId}`;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private chatKey(teamId: string, matchId: string) {
    return `${teamId}:${matchId}`;
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    await this.initPromise;
  }

  private async initialize() {
    const client = getInsForgeBrowserClient();
    await client.realtime.connect();

    await client.realtime.subscribe(this.presenceChannel);

    client.realtime.on("presence_updated", (payload: PresencePayload) => {
      const presence: FanPresence = {
        userId: payload.userId,
        playerId: payload.playerId,
        teamId: payload.teamId,
        lat: payload.lat,
        lng: payload.lng,
        pubId: payload.pubId ?? undefined,
      };
      this.presence.set(presence.userId, presence);
      this.notifyPresence();
    });

    const { data } = await client.database
      .from("fan_presence")
      .select("*")
      .eq("match_id", this.matchId);

    if (data) {
      for (const row of data) {
        const presence: FanPresence = {
          userId: String(row.user_id),
          playerId: String(row.player_id),
          teamId: String(row.team_id),
          lat: Number(row.lat),
          lng: Number(row.lng),
          pubId: row.pub_id ? String(row.pub_id) : undefined,
        };
        this.presence.set(presence.userId, presence);
      }
      this.notifyPresence();
    }

    this.initialized = true;
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
      if (p.pubId === pubId) return true;
      return (
        haversine(p.lat, p.lng, pub.lat, pub.lng) <= NEAR_PUB_RADIUS_METERS
      );
    });
  }

  publishLocation(presence: FanPresence) {
    void this.ensureInitialized().then(async () => {
      const client = getInsForgeBrowserClient();
      this.presence.set(presence.userId, presence);
      this.notifyPresence();

      await client.database.from("fan_presence").upsert([
        {
          user_id: presence.userId,
          match_id: this.matchId,
          player_id: presence.playerId,
          team_id: presence.teamId,
          lat: presence.lat,
          lng: presence.lng,
          pub_id: presence.pubId ?? null,
          updated_at: new Date().toISOString(),
        },
      ]);
    });
  }

  subscribeToPresence(callback: (presence: FanPresence[]) => void) {
    this.presenceListeners.add(callback);
    void this.ensureInitialized().then(() => {
      callback(Array.from(this.presence.values()));
    });
    return () => this.presenceListeners.delete(callback);
  }

  subscribeToPubSquad(pubId: string, callback: (squad: FanPresence[]) => void) {
    if (!this.squadListeners.has(pubId)) {
      this.squadListeners.set(pubId, new Set());
    }
    this.squadListeners.get(pubId)!.add(callback);
    void this.ensureInitialized().then(() => {
      callback(this.getSquadForPub(pubId, Array.from(this.presence.values())));
    });
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

    void this.ensureInitialized().then(async () => {
      const client = getInsForgeBrowserClient();
      const channel = `chat:team:${teamId}:match:${matchId}`;

      await client.realtime.subscribe(channel);

      client.realtime.on("chat_message", (payload: ChatPayload) => {
        if (payload.teamId !== teamId || payload.matchId !== matchId) return;
        const message: ChatMessage = {
          id: payload.id,
          teamId: payload.teamId,
          matchId: payload.matchId,
          userId: payload.userId,
          playerId: payload.playerId,
          text: payload.text,
          createdAt: payload.createdAt,
        };
        const list = this.chatMessages.get(key) ?? [];
        if (list.some((m) => m.id === message.id)) return;
        this.chatMessages.set(key, [...list, message]);
        this.notifyChat(key);
      });

      const { data } = await client.database
        .from("chat_messages")
        .select("*")
        .eq("team_id", teamId)
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (data) {
        const messages = data.map(
          (row): ChatMessage => ({
            id: String(row.id),
            teamId: String(row.team_id),
            matchId: String(row.match_id),
            userId: String(row.user_id),
            playerId: String(row.player_id),
            text: String(row.text),
            createdAt: String(row.created_at),
          }),
        );
        this.chatMessages.set(key, messages);
        callback(messages);
      } else {
        callback(this.chatMessages.get(key) ?? []);
      }
    });

    return () => this.chatListeners.get(key)?.delete(callback);
  }

  sendChatMessage(message: Omit<ChatMessage, "id" | "createdAt">) {
    void this.ensureInitialized().then(async () => {
      const client = getInsForgeBrowserClient();
      await client.database.from("chat_messages").insert([
        {
          team_id: message.teamId,
          match_id: message.matchId,
          user_id: message.userId,
          player_id: message.playerId,
          text: message.text,
        },
      ]);
    });
  }

  getPresence() {
    return Array.from(this.presence.values());
  }
}

let engine: InsForgeRealtimeEngine | null = null;

function getEngine() {
  if (!engine) engine = new InsForgeRealtimeEngine();
  return engine;
}

export const insforgeRealtimeAdapter: RealtimeAdapter = {
  publishLocation(p) {
    getEngine().publishLocation(p);
  },
  subscribeToPresence(cb) {
    return getEngine().subscribeToPresence(cb);
  },
  subscribeToPubSquad(pubId, cb) {
    return getEngine().subscribeToPubSquad(pubId, cb);
  },
  subscribeToTeamChat(teamId, matchId, cb) {
    return getEngine().subscribeToTeamChat(teamId, matchId, cb);
  },
  sendChatMessage(msg) {
    getEngine().sendChatMessage(msg);
  },
  getPresence() {
    return getEngine().getPresence();
  },
};
