"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getPubCatalogVersion,
  pubs,
  refreshPubsFromInsForge,
  subscribePubs,
} from "@/lib/mock/data";
import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import type { Pub } from "@/types";

export function usePubs(): Pub[] {
  const version = useSyncExternalStore(
    subscribePubs,
    getPubCatalogVersion,
    () => 0,
  );

  const loadPubs = useCallback(async () => {
    if (INSFORGE_ENABLED) {
      await refreshPubsFromInsForge();
    }
  }, []);

  useEffect(() => {
    void loadPubs();
  }, [loadPubs]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadPubs();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadPubs]);

  return useMemo(() => [...pubs], [version]);
}
