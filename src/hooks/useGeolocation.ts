"use client";

import { useCallback, useEffect, useState } from "react";
import { SF_CENTER, LOCATION_THROTTLE_MS } from "@/lib/mock/constants";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition>(SF_CENTER);
  const [error, setError] = useState<string | null>(() =>
    typeof navigator !== "undefined" && !navigator.geolocation
      ? "Geolocation not supported"
      : null,
  );
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let lastUpdate = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdate < LOCATION_THROTTLE_MS) return;
        lastUpdate = now;
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsWatching(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setPosition(SF_CENTER);
      },
      { enableHighAccuracy: true, maximumAge: LOCATION_THROTTLE_MS },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const setManualPosition = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng });
  }, []);

  return { position, error, isWatching, setManualPosition };
}
