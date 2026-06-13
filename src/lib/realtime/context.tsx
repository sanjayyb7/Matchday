"use client";

import { createContext, useContext, useMemo } from "react";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import { insforgeRealtimeAdapter } from "./insforge-provider";
import { mockRealtimeAdapter } from "./mock-provider";
import type { RealtimeAdapter } from "./types";

const RealtimeContext = createContext<RealtimeAdapter | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const adapter = useMemo(
    () => (INSFORGE_ENABLED ? insforgeRealtimeAdapter : mockRealtimeAdapter),
    [],
  );

  return (
    <RealtimeContext.Provider value={adapter}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used within RealtimeProvider");
  return ctx;
}
