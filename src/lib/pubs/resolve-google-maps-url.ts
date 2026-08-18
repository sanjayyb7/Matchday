import type { CreatePubInput } from "@/lib/pubs/admin-pubs";
import {
  parseGoogleMapsUrl,
  validateParsedGoogleMapsPlace,
} from "@/lib/pubs/parse-google-maps-url";
import { reverseGeocode } from "@/lib/pubs/reverse-geocode";

export async function resolvePubFromGoogleMapsUrl(
  mapsUrl: string,
): Promise<CreatePubInput> {
  const parsed = parseGoogleMapsUrl(mapsUrl);
  const validationError = validateParsedGoogleMapsPlace(parsed);
  if (validationError) {
    throw new Error(validationError);
  }

  const { address, neighborhood } = await reverseGeocode(parsed.lat!, parsed.lng!);

  return {
    name: parsed.name!,
    address,
    neighborhood,
    lat: parsed.lat!,
    lng: parsed.lng!,
    imageUrl: parsed.imageUrl ?? undefined,
  };
}
