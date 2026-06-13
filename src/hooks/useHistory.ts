"use client";

import { useEffect, useState } from "react";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import {
  insforgeHistoryAdapter,
  mockHistoryAdapter,
} from "@/lib/history/types";
import type { MatchHistoryEntry } from "@/types";

const adapter = INSFORGE_ENABLED
  ? insforgeHistoryAdapter
  : mockHistoryAdapter;

export function useHistory(userId: string | undefined) {
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);

  useEffect(() => {
    if (!userId) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    async function load() {
      const entries = await adapter.getHistory(userId!);
      if (!cancelled) setHistory(entries);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    history,
    recordMatchAttendance: adapter.recordMatchAttendance.bind(adapter),
    updatePubForMatch: adapter.updatePubForMatch.bind(adapter),
  };
}

export function getHistoryAdapter() {
  return adapter;
}
