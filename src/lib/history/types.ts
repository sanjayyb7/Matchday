import type { MatchHistoryEntry } from "@/types";

export interface HistoryAdapter {
  getHistory(userId: string): MatchHistoryEntry[] | Promise<MatchHistoryEntry[]>;
  recordMatchAttendance(
    entry: Omit<MatchHistoryEntry, "id">,
  ): void | Promise<void>;
  updatePubForMatch(
    userId: string,
    matchId: string,
    pubId: string,
    pubName: string,
  ): void | Promise<void>;
  clearAll(userId: string): void | Promise<void>;
}

export { mockHistoryAdapter } from "./mock-adapter";
export { insforgeHistoryAdapter } from "./insforge-adapter";
