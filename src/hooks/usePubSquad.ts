"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "@/lib/realtime/context";
import type { FanPresence } from "@/types";

export function usePubSquad(pubId: string | null) {
  const realtime = useRealtime();
  const [squad, setSquad] = useState<FanPresence[]>([]);

  useEffect(() => {
    if (!pubId) return;
    return realtime.subscribeToPubSquad(pubId, setSquad);
  }, [pubId, realtime]);

  return pubId ? squad : [];
}
