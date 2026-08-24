"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_ZOOM, NEAR_PUB_RADIUS_METERS, SF_CENTER } from "@/lib/mock/constants";
import { findNearestPubId } from "@/lib/geo/haversine";
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
  mergeMatchSquads,
} from "@/lib/mock/data";

import { PubMarker } from "./PubMarker";
import { UserPlayerMarkerContent } from "./UserPlayerMarker";
import { UserLocationMarker } from "./UserLocationMarker";
import { FanMarker } from "./FanMarker";
import { Badge } from "@/components/ui/badge";
import { map } from "@/lib/theme/tokens";
import type { FanPresence, Player, Team } from "@/types";

function isPlaceholderLocation(lat: number, lng: number) {
  return (
    Math.abs(lat - SF_CENTER.lat) < 1e-6 &&
    Math.abs(lng - SF_CENTER.lng) < 1e-6
  );
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function PubMap() {
  const pubs = usePubs();
  const { position, error, errorKind, isWatching, isRequesting, permission, requestLocation } =
    useGeolocation();
  const { user } = useAuth();
  const realtime = useRealtime();
  const identity = useMatchdayStore((s) => s.identity);
  const setSelectedPub = useMatchdayStore((s) => s.setSelectedPub);
  const liveMatch = getLiveOrUpcomingMatch();
  const matchId = identity?.matchId ?? liveMatch?.id;
  const mapRef = useRef<MapRef>(null);
  const hasFlownToUser = useRef(false);
  const lastPubIdRef = useRef<string | undefined>(undefined);
  const [fans, setFans] = useState<FanPresence[]>([]);
  const [, setSquadTick] = useState(0);

  useEffect(() => {
    return realtime.subscribeToPresence(setFans);
  }, [realtime]);

  // Squads live in memory after the picker/chat fetch. The map used to skip
  // that load, so every live player id missed getPlayer() and rendered as a
  // solid #334155 disk on top of the nearest pub.
  useEffect(() => {
    if (!matchId) return;
    const hasSquadApi = matchId.startsWith("af-") || matchId.startsWith("fd-");
    if (!hasSquadApi) return;

    let cancelled = false;
    void fetch(`/api/matches/squads?matchId=${encodeURIComponent(matchId)}`)
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const payload = (await response.json()) as {
          teams?: Team[];
          players?: Player[];
        };
        if (cancelled) return;
        mergeMatchSquads(payload.teams ?? [], payload.players ?? []);
        setSquadTick((tick) => tick + 1);
      })
      .catch(() => {
        // Fan markers fall back to generated avatars if the roster never loads.
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const otherFans = useMemo(
    () =>
      fans.filter((fan) => {
        if (fan.userId === user?.id) return false;
        if (!Number.isFinite(fan.lat) || !Number.isFinite(fan.lng)) return false;
        // Default SF pin is published before GPS resolves — hide those ghosts.
        if (isPlaceholderLocation(fan.lat, fan.lng)) return false;
        return true;
      }),
    [fans, user?.id],
  );

  // Depend on the match id, not the match object: getLiveOrUpcomingMatch()
  // returns a fresh object every render, and publishing triggers a presence
  // update that re-renders this component — an object dep would loop forever.
  const liveMatchId = liveMatch?.id;

  const publishLocation = useCallback(() => {
    if (!user || !identity || !isWatching || error) return;
    if (isPlaceholderLocation(position.lat, position.lng)) return;
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
    if (pubId && liveMatchId) {
      const pub = getPub(pubId);
      if (pub) {
        getHistoryAdapter().updatePubForMatch(
          user.id,
          liveMatchId,
          pubId,
          pub.name,
        );
      }
    }
  }, [user, identity, isWatching, error, position, realtime, liveMatchId, pubs]);

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
              className="rounded-2xl bg-card p-4 text-left"
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
    <div className="relative h-dvh w-full bg-chat-bg">
      {liveMatch && getDerivedMatchStatus(liveMatch) === "live" && (
        <Badge
          className={`absolute z-10 min-h-11 gap-2 rounded-pill border-0 bg-ink px-3 font-display text-chip text-paper ${error ? "right-4 top-4" : "left-4 top-4"}`}
        >
          <span className="live-pulse h-2 w-2 rounded-full bg-live" />
          LIVE
        </Badge>
      )}
      {!isWatching && (error || permission !== "granted") && (
        <div className="absolute left-4 right-4 top-4 z-10 rounded-card border-2 border-ink bg-c-amber px-4 py-3 font-utility text-sm text-ink">
          <p className="font-display text-chip">
            {errorKind === "denied"
              ? "Location blocked"
              : error
                ? "Location unavailable"
                : "See yourself on the map"}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {error
              ? error
              : "Tap below to allow location so fans can find you at the pub."}
          </p>
          {errorKind === "denied" ? (
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              After enabling location for your browser in phone Settings, come
              back here and tap the button.
            </p>
          ) : null}
          <button
            type="button"
            onClick={requestLocation}
            disabled={isRequesting}
            className="mt-2 min-h-11 rounded-pill bg-ink px-4 font-display text-chip text-paper transition-transform duration-[var(--duration-press)] ease-out active:scale-95 disabled:opacity-60"
          >
            {isRequesting ? "Getting location…" : "Enable location"}
          </button>
        </div>
      )}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle={map.style}
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
        {otherFans.map((fan) => (
          <Marker
            key={fan.userId}
            longitude={fan.lng}
            latitude={fan.lat}
            anchor="bottom"
          >
            <FanMarker fan={fan} />
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
