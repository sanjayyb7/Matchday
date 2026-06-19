"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreatePubInput } from "@/lib/pubs/admin-pubs";

interface AddPubFormProps {
  onSubmit: (input: CreatePubInput) => Promise<void>;
}

export function AddPubForm({ onSubmit }: AddPubFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedNeighborhood = neighborhood.trim();
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (!trimmedName || !trimmedAddress || !trimmedNeighborhood) {
      setFieldError("Name, address, and neighborhood are required.");
      return;
    }

    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      setFieldError("Latitude and longitude must be valid numbers.");
      return;
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      setFieldError("Coordinates are out of range.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        address: trimmedAddress,
        neighborhood: trimmedNeighborhood,
        lat: parsedLat,
        lng: parsedLng,
        imageUrl: imageUrl.trim() || undefined,
      });
      setName("");
      setAddress("");
      setNeighborhood("");
      setLat("");
      setLng("");
      setImageUrl("");
    } catch {
      // Parent shows error message.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="pub-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="pub-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="The Mission Tap"
          className="rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="pub-address" className="text-sm font-medium">
          Address
        </label>
        <Input
          id="pub-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="2889 Mission St"
          className="rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="pub-neighborhood" className="text-sm font-medium">
          Neighborhood
        </label>
        <Input
          id="pub-neighborhood"
          value={neighborhood}
          onChange={(event) => setNeighborhood(event.target.value)}
          placeholder="Mission District"
          className="rounded-xl"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="pub-lat" className="text-sm font-medium">
            Latitude
          </label>
          <Input
            id="pub-lat"
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            placeholder="37.7599"
            inputMode="decimal"
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pub-lng" className="text-sm font-medium">
            Longitude
          </label>
          <Input
            id="pub-lng"
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            placeholder="-122.4148"
            inputMode="decimal"
            className="rounded-xl"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pub-image" className="text-sm font-medium">
          Image URL (optional)
        </label>
        <Input
          id="pub-image"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://…"
          className="rounded-xl"
        />
      </div>

      {fieldError && (
        <p className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      )}

      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={submitting}
      >
        {submitting ? "Adding…" : "Add pub"}
      </Button>
    </form>
  );
}
