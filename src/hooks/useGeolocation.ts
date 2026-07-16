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
  // Bumped after a successful manual request so the watch effect restarts —
  // a watch started before permission was granted stays dead on iOS.
  const [watchNonce, setWatchNonce] = useState(0);
  const [permission, setPermission] = useState<PermissionState | "unknown">(
    "unknown",
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return;
    }
    let status: PermissionStatus | null = null;
    const onChange = () => {
      if (status) setPermission(status.state);
    };
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        status = result;
        setPermission(result.state);
        result.addEventListener("change", onChange);
      })
      .catch(() => {});
    return () => status?.removeEventListener("change", onChange);
  }, []);

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
  }, [watchNonce]);

  /**
   * Request the user's location inside a user gesture (button tap). Mobile
   * browsers — iOS Safari especially — only show the native permission
   * popup reliably when the request originates from a gesture.
   */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsWatching(true);
        setError(null);
        setWatchNonce((n) => n + 1);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true },
    );
  }, []);

  const setManualPosition = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng });
  }, []);

  return {
    position,
    error,
    isWatching,
    permission,
    requestLocation,
    setManualPosition,
  };
}
