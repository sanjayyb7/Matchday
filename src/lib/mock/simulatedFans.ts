import { getPlayersByTeam, pubs } from "@/lib/mock/data";
import { jitterPosition } from "@/lib/geo/haversine";
import type { FanPresence } from "@/types";

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Sam",
  "Casey",
  "Riley",
  "Morgan",
  "Taylor",
  "Jamie",
  "Quinn",
  "Avery",
  "Blake",
  "Drew",
  "Skyler",
  "Reese",
  "Logan",
];

export interface SimulatedFan {
  userId: string;
  name: string;
  teamId: "spain" | "france";
  playerId: string;
  pubId: string;
  lat: number;
  lng: number;
}

export const CHAT_TEMPLATES = [
  "We need Ronaldo here!",
  "Where is our goalkeeper?",
  "Pub is packed — get here now!",
  "Anyone near Mission Tap?",
  "Let's go! Vamos!",
  "Defense looking shaky, we need backup",
  "Half time — drinks round?",
  "Who's bringing the flags?",
];

// Short, generic prompts shown to the user under the chat input.
// Kept intentionally short so the whole pill fits without clipping.
export const QUICK_REPLIES = [
  "Where's everyone?",
  "We're here 👋",
  "On my way!",
];

export function createSimulatedFans(count = 20): SimulatedFan[] {
  const fans: SimulatedFan[] = [];

  for (let i = 0; i < count; i++) {
    const teamId: "spain" | "france" = i % 2 === 0 ? "spain" : "france";
    const players = getPlayersByTeam(teamId);
    const player = players[i % players.length];
    const pub = pubs[i % pubs.length];
    const pos = jitterPosition(pub.lat, pub.lng, 120);

    fans.push({
      userId: `sim-fan-${i}`,
      name: FIRST_NAMES[i % FIRST_NAMES.length],
      teamId,
      playerId: player.id,
      pubId: pub.id,
      lat: pos.lat,
      lng: pos.lng,
    });
  }

  return fans;
}

export function simulatedFanToPresence(fan: SimulatedFan): FanPresence {
  return {
    userId: fan.userId,
    playerId: fan.playerId,
    teamId: fan.teamId,
    lat: fan.lat,
    lng: fan.lng,
    pubId: fan.pubId,
    isSimulated: true,
  };
}

export function walkSimulatedFan(fan: SimulatedFan, pub: { lat: number; lng: number }): SimulatedFan {
  const pos = jitterPosition(fan.lat, fan.lng, 15);
  const clamped = jitterPosition(pub.lat, pub.lng, 180);
  const blend = 0.7;
  return {
    ...fan,
    lat: pos.lat * blend + clamped.lat * (1 - blend),
    lng: pos.lng * blend + clamped.lng * (1 - blend),
  };
}
