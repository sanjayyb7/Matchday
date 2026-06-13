import type { MatchHistoryEntry } from "@/types";
import type { HistoryAdapter } from "./types";

const HISTORY_KEY = "matchday:history";

function readAll(): MatchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as MatchHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: MatchHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export const mockHistoryAdapter: HistoryAdapter = {
  getHistory(userId) {
    return readAll()
      .filter((e) => e.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.attendedAt).getTime() - new Date(a.attendedAt).getTime(),
      );
  },

  recordMatchAttendance(entry) {
    const all = readAll();
    const exists = all.some(
      (e) => e.userId === entry.userId && e.matchId === entry.matchId,
    );
    if (exists) return;

    all.push({
      ...entry,
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
    });
    writeAll(all);
  },

  updatePubForMatch(userId, matchId, pubId, pubName) {
    const all = readAll();
    const idx = all.findIndex(
      (e) => e.userId === userId && e.matchId === matchId,
    );
    if (idx >= 0) {
      all[idx] = { ...all[idx], pubId, pubName };
      writeAll(all);
    }
  },

  clearAll(userId) {
    writeAll(readAll().filter((e) => e.userId !== userId));
  },
};
