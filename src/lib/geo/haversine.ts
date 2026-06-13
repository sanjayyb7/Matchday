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

export function findNearestPubId(
  userLat: number,
  userLng: number,
  pubs: { id: string; lat: number; lng: number }[],
  radiusMeters: number,
): string | undefined {
  for (const pub of pubs) {
    if (isNearPub(userLat, userLng, pub.lat, pub.lng, radiusMeters)) {
      return pub.id;
    }
  }
  return undefined;
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
