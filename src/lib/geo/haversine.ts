const EARTH_RADIUS_METERS = 6371000;

export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isNearPub(
  userLat: number,
  userLng: number,
  pubLat: number,
  pubLng: number,
  radiusMeters: number,
): boolean {
  return haversine(userLat, userLng, pubLat, pubLng) <= radiusMeters;
}

/** How much farther than the entry radius a user can drift before leaving their current pub. */
const STAY_RADIUS_MULTIPLIER = 1.5;

/**
 * Pick the pub the user should be assigned to.
 *
 * - Returns the closest pub within `radiusMeters` (not merely the first match),
 *   so adjacent pubs resolve to the right one.
 * - Sticky: if `currentPubId` is still within a larger stay radius, keep it.
 *   This prevents imprecise GPS from flip-flopping users between two nearby pubs.
 */
export function findNearestPubId(
  userLat: number,
  userLng: number,
  pubs: { id: string; lat: number; lng: number }[],
  radiusMeters: number,
  currentPubId?: string,
): string | undefined {
  if (currentPubId) {
    const current = pubs.find((pub) => pub.id === currentPubId);
    if (
      current &&
      haversine(userLat, userLng, current.lat, current.lng) <=
        radiusMeters * STAY_RADIUS_MULTIPLIER
    ) {
      return current.id;
    }
  }

  let nearestId: string | undefined;
  let nearestDistance = Infinity;
  for (const pub of pubs) {
    const distance = haversine(userLat, userLng, pub.lat, pub.lng);
    if (distance <= radiusMeters && distance < nearestDistance) {
      nearestId = pub.id;
      nearestDistance = distance;
    }
  }
  return nearestId;
}

export function jitterPosition(
  lat: number,
  lng: number,
  maxMeters: number,
): { lat: number; lng: number } {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * maxMeters;
  const dLat = (distance * Math.cos(angle)) / EARTH_RADIUS_METERS;
  const dLng =
    (distance * Math.sin(angle)) /
    (EARTH_RADIUS_METERS * Math.cos((lat * Math.PI) / 180));
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lng + (dLng * 180) / Math.PI,
  };
}
