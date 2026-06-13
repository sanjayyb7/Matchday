import { getPlayer } from "@/lib/mock/data";
import type { FanPresence } from "@/types";

export type FormationRow = "attack" | "midfield" | "defense";

export interface FormationSlot {
  member: FanPresence;
  row: FormationRow;
}

const POSITION_ROW: Record<string, FormationRow> = {
  Forward: "attack",
  Midfielder: "midfield",
  Defender: "defense",
  Goalkeeper: "defense",
};

const ROW_LIMITS: Record<FormationRow, number> = {
  attack: 2,
  midfield: 3,
  defense: 2,
};

const ROW_ORDER: FormationRow[] = ["attack", "midfield", "defense"];

export function assignFormation(members: FanPresence[]): Record<FormationRow, FormationSlot[]> {
  const buckets: Record<FormationRow, FormationSlot[]> = {
    attack: [],
    midfield: [],
    defense: [],
  };

  const sorted = [...members].sort((a, b) => {
    const pa = getPlayer(a.playerId);
    const pb = getPlayer(b.playerId);
    const order = { Forward: 0, Midfielder: 1, Defender: 2, Goalkeeper: 3 };
    return (order[pa?.position as keyof typeof order] ?? 1) -
      (order[pb?.position as keyof typeof order] ?? 1);
  });

  for (const member of sorted) {
    const player = getPlayer(member.playerId);
    const preferred = POSITION_ROW[player?.position ?? ""] ?? "midfield";

    let placed = false;
    const tryOrder = [preferred, ...ROW_ORDER.filter((r) => r !== preferred)];

    for (const row of tryOrder) {
      if (buckets[row].length < ROW_LIMITS[row]) {
        buckets[row].push({ member, row });
        placed = true;
        break;
      }
    }

    if (!placed) {
      const least = ROW_ORDER.reduce((a, b) =>
        buckets[a].length <= buckets[b].length ? a : b,
      );
      buckets[least].push({ member, row: least });
    }
  }

  return buckets;
}

export function countByRow(members: FanPresence[]) {
  let attack = 0;
  let defense = 0;
  for (const m of members) {
    const p = getPlayer(m.playerId);
    if (p?.position === "Forward" || p?.position === "Midfielder") attack++;
    if (p?.position === "Defender" || p?.position === "Goalkeeper") defense++;
  }
  return { attack: Math.min(attack, 5), defense: Math.min(defense, 5) };
}

export function formatPlayerLabel(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const first = parts[0];
  return `${first.charAt(0)}. ${last}`;
}
