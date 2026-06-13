import type { Player } from "@/types";

export type FormationRow = "attack" | "midfield" | "defense" | "goalkeeper";

export interface RosterFormationSlot {
  player: Player;
  row: FormationRow;
}

export interface SquadLayout {
  starting: Record<FormationRow, RosterFormationSlot[]>;
  bench: Player[];
}

const POSITION_SORT: Record<string, number> = {
  Forward: 0,
  Midfielder: 1,
  Defender: 2,
  Goalkeeper: 3,
};

/** 4-4-2 + goalkeeper */
const STARTING_SHAPE = {
  forwards: 2,
  midfielders: 4,
  defenders: 4,
  goalkeepers: 1,
} as const;

function byStarterPriority(a: Player, b: Player): number {
  return b.stats.caps - a.stats.caps || a.number - b.number;
}

function groupByRole(players: Player[]) {
  const goalkeepers: Player[] = [];
  const defenders: Player[] = [];
  const midfielders: Player[] = [];
  const forwards: Player[] = [];

  for (const player of players) {
    switch (player.position) {
      case "Goalkeeper":
        goalkeepers.push(player);
        break;
      case "Defender":
        defenders.push(player);
        break;
      case "Midfielder":
        midfielders.push(player);
        break;
      case "Forward":
        forwards.push(player);
        break;
      default:
        midfielders.push(player);
    }
  }

  return { goalkeepers, defenders, midfielders, forwards };
}

function takeFromPool(pool: Player[], count: number): Player[] {
  if (count <= 0 || pool.length === 0) return [];
  const picked = [...pool].sort(byStarterPriority).slice(0, count);
  const pickedIds = new Set(picked.map((p) => p.id));
  for (let i = pool.length - 1; i >= 0; i--) {
    if (pickedIds.has(pool[i].id)) pool.splice(i, 1);
  }
  return picked;
}

function fillLine(
  primary: Player[],
  count: number,
  fallbacks: Player[][],
): Player[] {
  const line = takeFromPool(primary, count);
  for (const pool of fallbacks) {
    if (line.length >= count) break;
    line.push(...takeFromPool(pool, count - line.length));
  }
  return line;
}

function toSlots(players: Player[], row: FormationRow): RosterFormationSlot[] {
  return players
    .sort((a, b) => a.number - b.number)
    .map((player) => ({ player, row }));
}

/** Pick a 4-4-2 starting XI; overflow players go to the bench. */
export function assignStartingEleven(players: Player[]): SquadLayout {
  const pools = groupByRole(players);

  const startGk = takeFromPool(pools.goalkeepers, STARTING_SHAPE.goalkeepers);

  const startDef = fillLine(
    pools.defenders,
    STARTING_SHAPE.defenders,
    [pools.midfielders, pools.forwards],
  );

  const startMid = fillLine(
    pools.midfielders,
    STARTING_SHAPE.midfielders,
    [pools.forwards],
  );

  const startFwd = takeFromPool(pools.forwards, STARTING_SHAPE.forwards);

  const starterIds = new Set(
    [...startGk, ...startDef, ...startMid, ...startFwd].map((p) => p.id),
  );

  const bench = players
    .filter((p) => !starterIds.has(p.id))
    .sort(
      (a, b) =>
        (POSITION_SORT[a.position] ?? 1) - (POSITION_SORT[b.position] ?? 1) ||
        a.number - b.number,
    );

  return {
    starting: {
      attack: toSlots(startFwd, "attack"),
      midfield: toSlots(startMid, "midfield"),
      defense: toSlots(startDef, "defense"),
      goalkeeper: toSlots(startGk, "goalkeeper"),
    },
    bench,
  };
}

export function formatPlayerLabel(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const first = parts[0];
  return `${first.charAt(0)}. ${last}`;
}


/** Teams represented at a pub, sorted by fan count (desc). */
export function teamIdsByFanCount(squad: FanPresenceLike[]): string[] {
  const counts = new Map<string, number>();
  for (const fan of squad) {
    counts.set(fan.teamId, (counts.get(fan.teamId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([teamId]) => teamId);
}

interface FanPresenceLike {
  teamId: string;
  playerId: string;
}

export function presentPlayerCounts(
  squad: FanPresenceLike[],
  teamId: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const fan of squad) {
    if (fan.teamId !== teamId) continue;
    counts.set(fan.playerId, (counts.get(fan.playerId) ?? 0) + 1);
  }
  return counts;
}

export function isGoalkeeper(player: Player): boolean {
  return player.position === "Goalkeeper";
}
