"use client";

import { useCallback, useEffect, useMemo } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { pubs } from "@/lib/mock/data";
import { DEFAULT_ZOOM } from "@/lib/mock/constants";
import { findNearestPubId } from "@/lib/geo/haversine";
import { NEAR_PUB_RADIUS_METERS } from "@/lib/mock/constants";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/lib/realtime/context";
import { useMatchdayStore } from "@/store/matchday-store";
import { getHistoryAdapter } from "@/hooks/useHistory";
import { getPub } from "@/lib/mock/data";
import { PubMarker } from "./PubMarker";
import { UserPlayerMarkerContent } from "./UserPlayerMarker";
import { Badge } from "@/components/ui/badge";
import { getLiveOrUpcomingMatch } from "@/lib/mock/data";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function PubMap() {
  const { position } = useGeolocation();
  const { user } = useAuth();
  const realtime = useRealtime();
  const identity = useMatchdayStore((s) => s.identity);
  const setSelectedPub = useMatchdayStore((s) => s.setSelectedPub);
  const liveMatch = getLiveOrUpcomingMatch();

  const publishLocation = useCallback(() => {
    if (!user || !identity) return;
    const pubId = findNearestPubId(
      position.lat,
      position.lng,
      pubs,
      NEAR_PUB_RADIUS_METERS,
    );
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
  }, [user, identity, position, realtime, liveMatch]);

  useEffect(() => {
    publishLocation();
  }, [publishLocation]);

  const initialViewState = useMemo(
    () => ({
      longitude: position.lng,
      latitude: position.lat,
      zoom: DEFAULT_ZOOM,
    }),
    [position.lat, position.lng],
  );

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
      {liveMatch?.status === "live" && (
        <Badge className="absolute left-4 top-4 z-10 gap-2 bg-accent text-accent-foreground">
          <span className="live-pulse h-2 w-2 rounded-full bg-red-500" />
          LIVE
        </Badge>
      )}
      <Map
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
        {identity && (
          <Marker
            longitude={position.lng}
            latitude={position.lat}
            anchor="bottom"
          >
            <UserPlayerMarkerContent playerId={identity.playerId} />
          </Marker>
        )}
      </Map>
    </div>
  );
}
