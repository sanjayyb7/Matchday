import { getInsForgeBrowserClient } from "@/lib/insforge/client";
import type { Pub } from "@/types";

const DEFAULT_PUB_IMAGE =
  "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=200&h=200&fit=crop";

export interface CreatePubInput {
  name: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "location"
  );
}

function mapPubRow(row: Record<string, unknown>): Pub {
  return {
    id: String(row.id),
    name: String(row.name),
    imageUrl: String(row.image_url),
    lat: Number(row.lat),
    lng: Number(row.lng),
    address: String(row.address),
    neighborhood: String(row.neighborhood),
  };
}

async function generatePubId(name: string): Promise<string> {
  const client = getInsForgeBrowserClient();
  const base = `pub-${slugify(name)}`;
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data } = await client.database
      .from("pubs")
      .select("id")
      .eq("id", candidate)
      .maybeSingle();

    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createPub(input: CreatePubInput): Promise<Pub> {
  const client = getInsForgeBrowserClient();
  const id = await generatePubId(input.name);

  const { data, error } = await client.database
    .from("pubs")
    .insert([
      {
        id,
        name: input.name.trim(),
        image_url: input.imageUrl?.trim() || DEFAULT_PUB_IMAGE,
        lat: input.lat,
        lng: input.lng,
        address: input.address.trim(),
        neighborhood: input.neighborhood.trim(),
      },
    ])
    .select("*");

  if (error) {
    throw new Error(error.message ?? "Failed to create pub");
  }

  const created = data?.[0];
  if (!created) {
    throw new Error("Failed to create pub");
  }

  return mapPubRow(created as Record<string, unknown>);
}

export async function listPubsFromDatabase(): Promise<Pub[]> {
  const client = getInsForgeBrowserClient();
  const { data, error } = await client.database
    .from("pubs")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message ?? "Failed to load pubs");
  }

  return (data ?? []).map((row) => mapPubRow(row as Record<string, unknown>));
}
