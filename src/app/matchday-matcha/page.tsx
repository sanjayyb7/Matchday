"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPub,
  deletePub,
  listPubsFromDatabase,
  updatePub,
  type PubInput,
} from "@/lib/pubs/admin-pubs";
import { refreshPubsFromInsForge } from "@/lib/mock/data";
import type { Pub } from "@/types";
import { AddPubForm } from "@/components/matchday-matcha/AddPubForm";
import { PubRow } from "@/components/matchday-matcha/PubRow";

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

  const refreshAfterChange = async (message: string) => {
    await refreshPubsFromInsForge();
    setSuccess(message);
    setError(null);
    await loadPubs();
  };

  const handleCreate = async (input: PubInput) => {
    setError(null);
    setSuccess(null);
    try {
      const pub = await createPub(input);
      await refreshAfterChange(`Added ${pub.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add pub");
      throw err;
    }
  };

  const handleUpdate = async (id: string, input: PubInput) => {
    setError(null);
    setSuccess(null);
    try {
      const pub = await updatePub(id, input);
      await refreshAfterChange(`Updated ${pub.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pub");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setSuccess(null);
    const pub = pubList.find((row) => row.id === id);
    try {
      await deletePub(id);
      await refreshAfterChange(`Deleted ${pub?.name ?? "pub"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pub");
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
              <PubRow
                key={pub.id}
                pub={pub}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
