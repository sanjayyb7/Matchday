export interface ParsedGoogleMapsPlace {
  name: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
}

function decodePlaceName(raw: string): string {
  return decodeURIComponent(raw.replace(/\+/g, " ")).trim();
}

function parseCoordinates(url: string): { lat: number; lng: number } | null {
  const pinMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pinMatch) {
    return { lat: Number(pinMatch[1]), lng: Number(pinMatch[2]) };
  }

  const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };
  }

  const queryMatch = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) };
  }

  return null;
}

function parsePlaceName(url: string): string | null {
  const placeMatch = url.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    const name = decodePlaceName(placeMatch[1]);
    return name || null;
  }

  const searchMatch = url.match(/\/maps\/search\/([^/@?]+)/);
  if (searchMatch) {
    const name = decodePlaceName(searchMatch[1]);
    return name || null;
  }

  return null;
}

function parsePhotoUrl(url: string): string | null {
  const photoMatches = [...url.matchAll(/!6s([^!]+)/g)];
  for (const match of photoMatches) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
        return decoded;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export function parseGoogleMapsUrl(rawUrl: string): ParsedGoogleMapsPlace {
  const url = rawUrl.trim();
  const coords = parseCoordinates(url);

  return {
    name: parsePlaceName(url),
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    imageUrl: parsePhotoUrl(url),
  };
}

export function validateParsedGoogleMapsPlace(
  parsed: ParsedGoogleMapsPlace,
): string | null {
  if (!parsed.lat || !parsed.lng) {
    return "Could not find coordinates in this Google Maps URL.";
  }
  if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) {
    return "Coordinates in the URL are invalid.";
  }
  if (parsed.lat < -90 || parsed.lat > 90 || parsed.lng < -180 || parsed.lng > 180) {
    return "Coordinates in the URL are out of range.";
  }
  if (!parsed.name) {
    return "Could not find the place name in this Google Maps URL.";
  }
  return null;
}
