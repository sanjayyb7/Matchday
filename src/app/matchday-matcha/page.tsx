"use client";

import { useCallback, useEffect, useState } from "react";
import { createPub, listPubsFromDatabase } from "@/lib/pubs/admin-pubs";
import { refreshPubsFromInsForge } from "@/lib/mock/data";
import type { Pub } from "@/types";
import { AddPubForm } from "@/components/matchday-matcha/AddPubForm";

export default function MatchdayMatchaPage() {
  const [pubList, setPubList] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPubsFromDatabase();
      setPubList(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pubs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPubs();
  }, [loadPubs]);

  const handleCreate = async (input: {
    name: string;
    address: string;
    neighborhood: string;
    lat: number;
    lng: number;
    imageUrl?: string;
  }) => {
    setError(null);
    setSuccess(null);
    try {
      const pub = await createPub(input);
      await refreshPubsFromInsForge();
      setSuccess(`Added ${pub.name}`);
      await loadPubs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add pub");
      throw err;
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-heading text-base font-bold uppercase tracking-wide">
          Add pub
        </h2>
        <AddPubForm onSubmit={handleCreate} />
        {success && (
          <p className="mt-3 text-sm text-primary" role="status">
            {success}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-heading text-base font-bold uppercase tracking-wide">
          Existing pubs ({pubList.length})
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading pubs…</p>
        ) : pubList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pubs yet.</p>
        ) : (
          <ul className="space-y-3">
            {pubList.map((pub) => (
              <li
                key={pub.id}
                className="rounded-xl border border-border/60 bg-card p-4"
              >
                <p className="font-semibold">{pub.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pub.address} · {pub.neighborhood}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pub.lat.toFixed(4)}, {pub.lng.toFixed(4)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
