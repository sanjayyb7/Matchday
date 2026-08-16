"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Visit = {
  id: string;
  workerName: string;
  workerEmail?: string;
  pubName: string;
  address: string;
  neighborhood: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  outcome: string;
  notes: string;
  photoUrl?: string;
  status: string;
  createdAt: string;
  claimCode?: string;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdPubId?: string | null;
  pioneerJson?: Record<string, unknown> | null;
};

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p className="text-xs text-white/65">
      <span className="text-white/40">{label}: </span>
      {value}
    </p>
  );
}

export default function AdminFieldVisitsPage() {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/field-visits");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setVisits(data.visits ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) void load();
  }, [isLoading, isAuthenticated, isAdmin, load]);

  const review = async (
    id: string,
    status: "verified" | "rejected" | "needs_follow_up",
    createPubFromVisit = false,
  ) => {
    setError(null);
    const res = await fetch("/api/admin/field-visits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, createPubFromVisit }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Review failed");
      return;
    }
    await load();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0B0F14]">
        <div className="live-pulse h-3 w-3 rounded-full bg-[#FFFC00]" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 bg-[#0B0F14] text-white">
        <p>Admin only. Sign in with an admin account, then refresh.</p>
        <Link href="/login?next=/admin/field-visits" className={cn(buttonVariants(), "rounded-xl")}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0B0F14] text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FFFC00]">
            Admin
          </p>
          <h1 className="font-heading text-2xl font-bold uppercase">
            Field visit verification
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Confirm Terac workers completed pub visits (contact, notes, outcome
            — no GPS). Verify interested visits to create pubs on the map.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="space-y-3">
          {visits.map((visit) => {
            const pioneer = visit.pioneerJson ?? null;
            return (
              <div key={visit.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{visit.pubName || "Untitled pub"}</p>
                    <p className="text-xs text-white/50">
                      {[visit.address, visit.neighborhood].filter(Boolean).join(" · ") ||
                        "No address"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase">
                    {visit.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 rounded-xl bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#FFFC00]/80">
                    Terac submission
                  </p>
                  <Detail label="Claim code" value={visit.claimCode} />
                  <Detail
                    label="Claimed"
                    value={
                      visit.claimedBy
                        ? `Yes${visit.claimedAt ? ` · ${new Date(visit.claimedAt).toLocaleString()}` : ""}`
                        : "Not yet"
                    }
                  />
                  <Detail label="Pub id" value={visit.createdPubId} />
                  <Detail label="Worker" value={visit.workerName} />
                  <Detail label="Worker email" value={visit.workerEmail} />
                  <Detail label="Outcome" value={visit.outcome} />
                  <Detail label="Contact" value={visit.contactName} />
                  <Detail label="Phone" value={visit.contactPhone} />
                  <Detail label="Email" value={visit.contactEmail} />
                  <Detail
                    label="Submitted"
                    value={
                      visit.createdAt
                        ? new Date(visit.createdAt).toLocaleString()
                        : null
                    }
                  />
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                    {visit.notes || "No notes"}
                  </p>
                </div>

                {visit.photoUrl ? (
                  <a
                    href={visit.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-[#FFFC00] underline"
                  >
                    Open photo
                  </a>
                ) : null}

                {pioneer && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11px] text-white/45">
                      Pioneer draft
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] text-white/50">
                      {JSON.stringify(pioneer, null, 2)}
                    </pre>
                  </details>
                )}

                {visit.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => void review(visit.id, "verified", true)}
                    >
                      Verify + create pub
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => void review(visit.id, "verified", false)}
                    >
                      Verify only
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-lg"
                      onClick={() => void review(visit.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {visits.length === 0 && (
            <p className="text-sm text-white/50">No field visits yet.</p>
          )}
        </div>

        <Link href="/matchday-matcha" className="text-center text-xs text-white/40">
          Pub admin
        </Link>
      </div>
    </div>
  );
}
