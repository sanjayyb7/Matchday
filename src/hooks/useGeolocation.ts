"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SF_CENTER, LOCATION_THROTTLE_MS } from "@/lib/mock/constants";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type GeoErrorKind =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

const GEO_OPTIONS_HIGH: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

const GEO_OPTIONS_LOW: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 20000,
  maximumAge: 60_000,
};

function classifyGeoError(err: GeolocationPositionError): {
  kind: GeoErrorKind;
  message: string;
} {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return {
        kind: "denied",
        message:
          "Location permission is blocked. On iPhone: Settings → Privacy & Security → Location Services → Chrome (or Safari) → While Using the App, then allow this site.",
      };
    case err.POSITION_UNAVAILABLE:
      return {
        kind: "unavailable",
        message:
          "Could not determine your location. Turn on Location Services and try again outdoors or near a window.",
      };
    case err.TIMEOUT:
      return {
        kind: "timeout",
        message: "Location request timed out. Tap Enable location to try again.",
      };
    default:
      return {
        kind: "unknown",
        message: err.message || "Location request failed. Tap to try again.",
      };
  }
}

function readPosition(pos: GeolocationPosition): GeoPosition {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

/**
 * Geolocation that works reliably on mobile:
 * - Does NOT call watchPosition until the user grants access (avoids
 *   immediately setting an error that blocks the permission prompt UX).
 * - Requests location only from a user gesture, with high-accuracy first
 *   and a low-accuracy fallback.
 */
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition>(SF_CENTER);
  const [error, setError] = useState<string | null>(() =>
    typeof navigator !== "undefined" && !navigator.geolocation
      ? "Geolocation is not supported in this browser."
      : null,
  );
  const [errorKind, setErrorKind] = useState<GeoErrorKind | null>(() =>
    typeof navigator !== "undefined" && !navigator.geolocation
      ? "unsupported"
      : null,
  );
  const [isWatching, setIsWatching] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permission, setPermission] = useState<PermissionState | "unknown">(
    "unknown",
  );
  const watchIdRef = useRef<number | null>(null);
  const hasFixRef = useRef(false);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) return;
    clearWatch();

    let lastUpdate = 0;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdate < LOCATION_THROTTLE_MS) return;
        lastUpdate = now;
        hasFixRef.current = true;
        setPosition(readPosition(pos));
        setIsWatching(true);
        setError(null);
        setErrorKind(null);
      },
      (err) => {
        // Don't wipe a good fix if a later watch tick fails briefly.
        if (hasFixRef.current) return;
        const classified = classifyGeoError(err);
        setError(classified.message);
        setErrorKind(classified.kind);
        setIsWatching(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: LOCATION_THROTTLE_MS,
        timeout: 20000,
      },
    );
  }, [clearWatch]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return;
    }
    let status: PermissionStatus | null = null;
    const onChange = () => {
      if (!status) return;
      setPermission(status.state);
      if (status.state === "granted") {
        startWatch();
      }
      if (status.state === "denied") {
        clearWatch();
        setIsWatching(false);
        setErrorKind("denied");
        setError(
          "Location permission is blocked. On iPhone: Settings → Privacy & Security → Location Services → Chrome (or Safari) → While Using the App, then reload this page.",
        );
      }
    };
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        status = result;
        setPermission(result.state);
        result.addEventListener("change", onChange);
        if (result.state === "granted") {
          startWatch();
        }
      })
      .catch(() => {
        // Safari sometimes rejects permissions.query for geolocation —
        // wait for an explicit user tap instead.
      });
    return () => {
      status?.removeEventListener("change", onChange);
      clearWatch();
    };
  }, [clearWatch, startWatch]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorKind("unsupported");
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setIsRequesting(true);
    setError(null);
    setErrorKind(null);

    const onSuccess = (pos: GeolocationPosition) => {
      hasFixRef.current = true;
      setPosition(readPosition(pos));
      setIsWatching(true);
      setIsRequesting(false);
      setError(null);
      setErrorKind(null);
      setPermission("granted");
      startWatch();
    };

    const onFailure = (err: GeolocationPositionError) => {
      // Retry once with lower accuracy for timeout / unavailable — high
      // accuracy often fails indoors or with a cold GPS. Don't retry denied.
      if (err.code === err.PERMISSION_DENIED) {
        const classified = classifyGeoError(err);
        setError(classified.message);
        setErrorKind(classified.kind);
        setPermission("denied");
        setIsWatching(false);
        setIsRequesting(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (retryErr) => {
          const classified = classifyGeoError(retryErr);
          setError(classified.message);
          setErrorKind(classified.kind);
          setIsWatching(false);
          setIsRequesting(false);
          if (classified.kind === "denied") {
            setPermission("denied");
          }
        },
        GEO_OPTIONS_LOW,
      );
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onFailure,
      GEO_OPTIONS_HIGH,
    );
  }, [startWatch]);

  const setManualPosition = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng });
  }, []);

  return {
    position,
    error,
    errorKind,
    isWatching,
    isRequesting,
    permission,
    requestLocation,
    setManualPosition,
  };
}
