const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface MapboxContextItem {
  id: string;
  text: string;
}

interface MapboxFeature {
  place_name?: string;
  text?: string;
  address?: string;
  context?: MapboxContextItem[];
}

export interface ReverseGeocodeResult {
  address: string;
  neighborhood: string;
}

function neighborhoodFromContext(context: MapboxContextItem[] = []): string | null {
  for (const key of ["neighborhood", "locality", "district", "place"]) {
    const item = context.find((entry) => entry.id.startsWith(`${key}.`));
    if (item?.text) return item.text;
  }
  return null;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  if (!MAPBOX_TOKEN) {
    throw new Error(
      "Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment.",
    );
  }

  const endpoint = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
  );
  endpoint.searchParams.set("access_token", MAPBOX_TOKEN);
  endpoint.searchParams.set("types", "address,poi,place");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to look up the pub address.");
  }

  const payload = (await response.json()) as { features?: MapboxFeature[] };
  const feature = payload.features?.[0];
  if (!feature) {
    throw new Error("No address found for these coordinates.");
  }

  const neighborhood =
    neighborhoodFromContext(feature.context) ?? "San Francisco";

  const street =
    feature.address && feature.text
      ? `${feature.address} ${feature.text}`
      : feature.text;

  const address = street ?? feature.place_name?.split(",")[0]?.trim();
  if (!address) {
    throw new Error("Could not resolve a street address from the map pin.");
  }

  return { address, neighborhood };
}
