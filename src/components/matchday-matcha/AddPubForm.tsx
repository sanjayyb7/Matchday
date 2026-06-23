"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreatePubInput } from "@/lib/pubs/admin-pubs";
import { resolvePubFromGoogleMapsUrl } from "@/lib/pubs/resolve-google-maps-url";

interface AddPubFormProps {
  onSubmit: (input: CreatePubInput) => Promise<void>;
}

export function AddPubForm({ onSubmit }: AddPubFormProps) {
  const [mapsUrl, setMapsUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CreatePubInput | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);
    setPreview(null);

    const trimmed = mapsUrl.trim();
    if (!trimmed) {
      setFieldError("Paste a Google Maps place URL.");
      return;
    }

    if (!trimmed.includes("google.com/maps") && !trimmed.includes("maps.google")) {
      setFieldError("Use a full Google Maps place link (not a short link).");
      return;
    }

    setSubmitting(true);
    try {
      const resolved = await resolvePubFromGoogleMapsUrl(trimmed);
      setPreview(resolved);
      await onSubmit(resolved);
      setMapsUrl("");
      setPreview(null);
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : "Failed to parse Google Maps URL.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="pub-maps-url" className="text-sm font-medium">
          Google Maps URL
        </label>
        <Input
          id="pub-maps-url"
          value={mapsUrl}
          onChange={(event) => setMapsUrl(event.target.value)}
          placeholder="https://www.google.com/maps/place/…"
          className="rounded-xl"
          required
        />
        <p className="text-xs text-muted-foreground">
          Paste a Google Maps place link. Name, photo, coordinates, and address are
          extracted automatically.
        </p>
      </div>

      {preview && (
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-sm">
          <p className="font-semibold">{preview.name}</p>
          <p className="mt-1 text-muted-foreground">
            {preview.address} · {preview.neighborhood}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {preview.lat.toFixed(6)}, {preview.lng.toFixed(6)}
          </p>
        </div>
      )}

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
        {submitting ? "Extracting & adding…" : "Add pub from URL"}
      </Button>
    </form>
  );
}
