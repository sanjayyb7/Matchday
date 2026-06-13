import { getInsForgeBrowserClient } from "@/lib/insforge/client";
import type { MatchHistoryEntry } from "@/types";
import type { HistoryAdapter } from "./types";

function rowToEntry(row: Record<string, unknown>): MatchHistoryEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    matchId: String(row.match_id),
    teamId: String(row.team_id),
    playerId: String(row.player_id),
    pubId: row.pub_id ? String(row.pub_id) : undefined,
    pubName: row.pub_name ? String(row.pub_name) : undefined,
    attendedAt: String(row.attended_at),
    matchLabel: String(row.match_label),
  };
}

export const insforgeHistoryAdapter: HistoryAdapter = {
  async getHistory(userId) {
    const client = getInsForgeBrowserClient();
    const { data, error } = await client.database
      .from("match_history")
      .select("*")
      .eq("user_id", userId)
      .order("attended_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => rowToEntry(row as Record<string, unknown>));
  },

  async recordMatchAttendance(entry) {
    const client = getInsForgeBrowserClient();
    const { data: existing } = await client.database
      .from("match_history")
      .select("id")
      .eq("user_id", entry.userId)
      .eq("match_id", entry.matchId)
      .maybeSingle();

    if (existing) return;

    await client.database.from("match_history").insert({
      user_id: entry.userId,
      match_id: entry.matchId,
      team_id: entry.teamId,
      player_id: entry.playerId,
      pub_id: entry.pubId ?? null,
      pub_name: entry.pubName ?? null,
      attended_at: entry.attendedAt,
      match_label: entry.matchLabel,
    });
  },

  async updatePubForMatch(userId, matchId, pubId, pubName) {
    const client = getInsForgeBrowserClient();
    await client.database
      .from("match_history")
      .update({ pub_id: pubId, pub_name: pubName })
      .eq("user_id", userId)
      .eq("match_id", matchId);
  },

  async clearAll(userId) {
    const client = getInsForgeBrowserClient();
    await client.database.from("match_history").delete().eq("user_id", userId);
  },
};
