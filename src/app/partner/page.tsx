"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PartnerPub = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  couponsPerDay: number;
  screeningLabel: string;
  claimsToday: number;
  remainingToday: number;
  rewards: Array<{ id: string; title: string; value: string }>;
};

type EditDraft = {
  name: string;
  address: string;
  neighborhood: string;
  screeningLabel: string;
  couponsPerDay: string;
  rewardTitle: string;
  rewardValue: string;
};

function draftFromPub(pub: PartnerPub): EditDraft {
  const primary = pub.rewards[0];
  return {
    name: pub.name,
    address: pub.address,
    neighborhood: pub.neighborhood,
    screeningLabel: pub.screeningLabel,
    couponsPerDay: String(pub.couponsPerDay),
    rewardTitle: primary?.title ?? "$5 off",
    rewardValue: primary?.value ?? "$5",
  };
}

export default function PartnerDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [pubs, setPubs] = useState<PartnerPub[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [editingPubId, setEditingPubId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingPubId, setSavingPubId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    neighborhood: "Mission",
    lat: "37.7599",
    lng: "-122.4148",
    couponsPerDay: "20",
    screeningLabel: "",
    rewardTitle: "$5 off food",
    rewardValue: "$5",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/me");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setSubscribed(Boolean(data.subscribed) || data.role === "admin");
      setPubs(data.pubs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "success") {
        void fetch("/api/stripe/sync", { method: "POST" }).then(() => load());
      } else {
        void load();
      }
    }
    if (!isLoading && !isAuthenticated) setLoading(false);
  }, [isAuthenticated, isLoading, load]);

  const claimPub = async () => {
    setError(null);
    setMessage(null);
    setClaimLoading(true);
    try {
      const res = await fetch("/api/partner/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: claimCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not claim pub");
      setMessage(
        data.alreadyClaimed
          ? "This pub is already on your dashboard"
          : "Pub claimed — it’s on your dashboard",
      );
      setClaimCode("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setClaimLoading(false);
    }
  };

  const startEdit = (pub: PartnerPub) => {
    setEditingPubId(pub.id);
    setEditDraft(draftFromPub(pub));
    setError(null);
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingPubId(null);
    setEditDraft(null);
  };

  const savePub = async (pubId: string) => {
    if (!editDraft) return;
    setError(null);
    setMessage(null);
    setSavingPubId(pubId);
    try {
      const res = await fetch("/api/partner/pubs/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pubId,
          name: editDraft.name.trim(),
          address: editDraft.address.trim(),
          neighborhood: editDraft.neighborhood.trim(),
          screeningLabel: editDraft.screeningLabel.trim(),
          couponsPerDay: Number(editDraft.couponsPerDay) || 20,
          rewardTitle: editDraft.rewardTitle.trim(),
          rewardValue: editDraft.rewardValue.trim() || "$5",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save pub");
      setMessage("Pub details saved");
      setEditingPubId(null);
      setEditDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingPubId(null);
    }
  };

  const createPub = async () => {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/partner/pubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        address: form.address,
        neighborhood: form.neighborhood,
        lat: Number(form.lat),
        lng: Number(form.lng),
        couponsPerDay: Number(form.couponsPerDay) || 20,
        screeningLabel: form.screeningLabel,
        rewards: [
          {
            title: form.rewardTitle,
            value: form.rewardValue,
            description: form.rewardTitle,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create pub");
      return;
    }
    setMessage(`Added ${data.pub?.name}`);
    await load();
  };

  const redeem = async () => {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/coupons/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Invalid QR");
      return;
    }
    setMessage("Coupon validated — marked redeemed");
    setToken("");
    await load();
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0B0F14]">
        <div className="live-pulse h-3 w-3 rounded-full bg-[#FFFC00]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 bg-[#0B0F14] text-white">
        <h1 className="font-heading text-2xl font-bold uppercase">
          Partner login
        </h1>
        <p className="text-sm text-white/60">
          Sign in to claim your Terac code and manage your pub.
        </p>
        <Link
          href="/login?next=/partner"
          className={cn(buttonVariants(), "rounded-xl")}
        >
          Log in
        </Link>
      </div>
    );
  }

  if (!subscribed) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 bg-[#0B0F14] text-white">
        <h1 className="font-heading text-2xl font-bold uppercase">
          Subscription required
        </h1>
        <p className="text-sm text-white/60">
          Subscribe for $10/month (or use coupon J007), then enter the Terac
          claim code to unlock your pub dashboard.
        </p>
        {user && (
          <p className="text-xs text-white/40">{user.email || user.name}</p>
        )}
        <Link
          href="/for-pubs"
          className={cn(
            buttonVariants(),
            "rounded-xl bg-[#FFFC00] text-black",
          )}
        >
          Go to $10/mo page
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0B0F14] text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FFFC00]">
            Partner dashboard
          </p>
          <h1 className="font-heading text-2xl font-bold uppercase">
            Your pubs
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Enter the Terac claim code from your field visit, then edit rewards,
            screening, and validate QR codes.
          </p>
        </header>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <section className="rounded-2xl border border-[#FFFC00]/30 bg-[#FFFC00]/5 p-4">
          <h2 className="font-heading text-sm font-bold uppercase">
            Claim pub with Terac code
          </h2>
          <p className="mt-1 text-xs text-white/50">
            Code looks like LD-XXXXXX — from the Terac worker who registered your
            pub.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              placeholder="LD-XXXXXX"
              className="bg-white/5 uppercase text-white"
              autoCapitalize="characters"
            />
            <Button
              className="rounded-xl bg-[#FFFC00] text-black"
              disabled={claimLoading || !claimCode.trim()}
              onClick={() => void claimPub()}
            >
              {claimLoading ? "…" : "Claim"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-4">
          <h2 className="font-heading text-sm font-bold uppercase">
            Validate QR coupon
          </h2>
          <div className="mt-3 flex gap-2">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste QR token / code"
              className="bg-white/5 text-white"
            />
            <Button onClick={() => void redeem()} className="rounded-xl">
              Validate
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          {pubs.map((pub) => {
            const isEditing = editingPubId === pub.id && editDraft;
            return (
              <div
                key={pub.id}
                className="rounded-2xl border border-white/10 p-4"
              >
                {!isEditing ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{pub.name}</p>
                        <p className="text-xs text-white/50">{pub.address}</p>
                        {pub.neighborhood ? (
                          <p className="text-xs text-white/40">
                            {pub.neighborhood}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-lg"
                        onClick={() => startEdit(pub)}
                      >
                        Edit
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-[#FFFC00]">
                      Screening: {pub.screeningLabel || "—"}
                    </p>
                    <p className="text-xs text-white/60">
                      Coupons today: {pub.claimsToday}/{pub.couponsPerDay} (
                      {pub.remainingToday} left)
                    </p>
                    <ul className="mt-2 text-xs text-white/70">
                      {pub.rewards.map((r) => (
                        <li key={r.id}>
                          {r.title} · {r.value}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#FFFC00]">
                      Edit pub details
                    </p>
                    {(
                      [
                        ["name", "Pub name"],
                        ["address", "Address"],
                        ["neighborhood", "Neighborhood"],
                        ["screeningLabel", "Match screening"],
                        ["couponsPerDay", "Coupons per day"],
                        ["rewardTitle", "Reward title"],
                        ["rewardValue", "Reward value"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="text-[11px] uppercase tracking-wide text-white/40">
                          {label}
                        </label>
                        <Input
                          value={editDraft[key]}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, [key]: e.target.value } : d,
                            )
                          }
                          className="mt-1 bg-white/5 text-white"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 rounded-xl bg-[#FFFC00] text-black"
                        disabled={savingPubId === pub.id}
                        onClick={() => void savePub(pub.id)}
                      >
                        {savingPubId === pub.id ? "Saving…" : "Save changes"}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        disabled={savingPubId === pub.id}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {pubs.length === 0 && (
            <p className="text-sm text-white/50">
              No pubs yet — claim with your Terac code above.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 p-4">
          <button
            type="button"
            className="w-full text-left text-xs font-semibold uppercase tracking-wide text-white/45"
            onClick={() => setShowManualAdd((v) => !v)}
          >
            {showManualAdd ? "Hide manual add" : "Manual add pub (edge case)"}
          </button>
          {showManualAdd && (
            <div className="mt-3 space-y-3">
              {(
                [
                  ["name", "Pub name"],
                  ["address", "Address"],
                  ["neighborhood", "Neighborhood"],
                  ["lat", "Latitude"],
                  ["lng", "Longitude"],
                  ["couponsPerDay", "Coupons per day"],
                  ["screeningLabel", "Match screening (e.g. Spurs vs Arsenal)"],
                  ["rewardTitle", "Reward title"],
                  ["rewardValue", "Reward value"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[11px] uppercase tracking-wide text-white/40">
                    {label}
                  </label>
                  <Input
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="mt-1 bg-white/5 text-white"
                  />
                </div>
              ))}
              <Button
                className="w-full rounded-xl bg-[#FFFC00] text-black"
                onClick={() => void createPub()}
              >
                Save pub profile
              </Button>
            </div>
          )}
        </section>

        <Link href="/for-pubs" className="text-center text-xs text-white/40">
          Billing / subscription
        </Link>
      </div>
    </div>
  );
}
