"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_ZOOM } from "@/lib/mock/constants";
import { findNearestPubId } from "@/lib/geo/haversine";
import { NEAR_PUB_RADIUS_METERS } from "@/lib/mock/constants";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { usePubs } from "@/hooks/usePubs";
import { useRealtime } from "@/lib/realtime/context";
import { useMatchdayStore } from "@/store/matchday-store";
import { getHistoryAdapter } from "@/hooks/useHistory";
import {
  getPub,
  getLiveOrUpcomingMatch,
  getDerivedMatchStatus,
} from "@/lib/mock/data";

import { PubMarker } from "./PubMarker";
import { UserPlayerMarkerContent } from "./UserPlayerMarker";
import { UserLocationMarker } from "./UserLocationMarker";
import { Badge } from "@/components/ui/badge";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function PubMap() {
  const pubs = usePubs();
  const { position, error, isWatching } = useGeolocation();
  const { user } = useAuth();
  const realtime = useRealtime();
  const identity = useMatchdayStore((s) => s.identity);
  const setSelectedPub = useMatchdayStore((s) => s.setSelectedPub);
  const liveMatch = getLiveOrUpcomingMatch();
  const mapRef = useRef<MapRef>(null);
  const hasFlownToUser = useRef(false);
  const lastPubIdRef = useRef<string | undefined>(undefined);

  const publishLocation = useCallback(() => {
    if (!user || !identity) return;
    const pubId = findNearestPubId(
      position.lat,
      position.lng,
      pubs,
      NEAR_PUB_RADIUS_METERS,
      lastPubIdRef.current,
    );
    lastPubIdRef.current = pubId;
    realtime.publishLocation({
      userId: user.id,
      playerId: identity.playerId,
      teamId: identity.teamId,
      lat: position.lat,
      lng: position.lng,
      pubId,
    });
    if (pubId && liveMatch) {
      const pub = getPub(pubId);
      if (pub) {
        getHistoryAdapter().updatePubForMatch(
          user.id,
          liveMatch.id,
          pubId,
          pub.name,
        );
      }
    }
  }, [user, identity, position, realtime, liveMatch, pubs]);

  useEffect(() => {
    publishLocation();
  }, [publishLocation]);

  useEffect(() => {
    if (!isWatching || hasFlownToUser.current) return;
    hasFlownToUser.current = true;
    mapRef.current?.flyTo({
      center: [position.lng, position.lat],
      zoom: DEFAULT_ZOOM,
      duration: 1200,
    });
  }, [isWatching, position.lat, position.lng]);

  const initialViewState = useMemo(
    () => ({
      longitude: position.lng,
      latitude: position.lat,
      zoom: DEFAULT_ZOOM,
    }),
    [position.lat, position.lng],
  );

  const showUserMarker = isWatching && !error;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted-foreground">
          Add <code className="text-primary">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{" "}
          <code>.env.local</code> to enable the map.
        </p>
        <div className="grid w-full max-w-sm gap-3">
          {pubs.slice(0, 4).map((pub) => (
            <button
              key={pub.id}
              type="button"
              onClick={() => setSelectedPub(pub)}
              className="rounded-2xl border border-border bg-card p-4 text-left"
            >
              <p className="font-semibold">{pub.name}</p>
              <p className="text-sm text-muted-foreground">{pub.neighborhood}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full">
      {liveMatch && getDerivedMatchStatus(liveMatch) === "live" && (
        <Badge
          className={`absolute z-10 gap-2 bg-accent text-accent-foreground ${error ? "right-4 top-4" : "left-4 top-4"}`}
        >
          <span className="live-pulse h-2 w-2 rounded-full bg-red-500" />
          LIVE
        </Badge>
      )}
      {error && (
        <div className="absolute left-4 right-4 top-4 z-10 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 backdrop-blur-sm">
          <p className="font-semibold">Location unavailable</p>
          <p className="mt-1 text-xs text-amber-100/80">
            Enable location in your browser settings to see yourself on the map.
          </p>
        </div>
      )}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        {pubs.map((pub) => (
          <Marker
            key={pub.id}
            longitude={pub.lng}
            latitude={pub.lat}
            anchor="bottom"
          >
            <PubMarker pub={pub} onClick={() => setSelectedPub(pub)} />
          </Marker>
        ))}
        {showUserMarker && (
          <Marker
            longitude={position.lng}
            latitude={position.lat}
            anchor="bottom"
          >
            {identity ? (
              <UserPlayerMarkerContent
                playerId={identity.playerId}
                fallbackAvatarUrl={user?.avatarUrl}
              />
            ) : (
              <UserLocationMarker />
            )}
          </Marker>
        )}
      </Map>
    </div>
  );
}
