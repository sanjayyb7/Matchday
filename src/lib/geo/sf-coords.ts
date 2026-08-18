import { SF_CENTER } from "@/lib/mock/constants";

/** Rough SF bounding box for pub locations. */
const SF_BOUNDS = {
  latMin: 37.6,
  latMax: 37.9,
  lngMin: -122.55,
  lngMax: -122.35,
} as const;

export function isWithinSfBounds(lat: number, lng: number): boolean {
  return (
    lat >= SF_BOUNDS.latMin &&
    lat <= SF_BOUNDS.latMax &&
    lng >= SF_BOUNDS.lngMin &&
    lng <= SF_BOUNDS.lngMax
  );
}

export function validateSfPubCoords(lat: number, lng: number): string | null {
  if (
    lat >= SF_BOUNDS.latMin &&
    lat <= SF_BOUNDS.latMax &&
    lng > 0 &&
    lng >= 120 &&
    lng <= 125
  ) {
    return "Longitude must be negative for San Francisco. Example: -122.4148 (not 122.4148).";
  }

  if (!isWithinSfBounds(lat, lng)) {
    return `Coordinates must be in San Francisco (near ${SF_CENTER.lat}, ${SF_CENTER.lng}). Example: 37.7599, -122.4148`;
  }

  return null;
}
