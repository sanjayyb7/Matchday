import type { Pub } from "@/types";

export function googleMapsDirectionsUrl(pub: Pick<Pub, "lat" | "lng">): string {
  // Pass coordinates with a literal comma — do not pre-encode or Google Maps
  // receives %2C literally and fails to resolve the destination.
  return `https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`;
}
