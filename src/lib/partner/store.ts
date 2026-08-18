import { createInsForgeAdminClient } from "@/lib/insforge/admin";
import { randomBytes } from "crypto";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";

export type FieldVisitOutcome = "interested" | "not_interested" | "follow_up";
export type FieldVisitStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "needs_follow_up";

export interface FieldVisit {
  id: string;
  workerName: string;
  workerEmail?: string;
  pubName: string;
  address: string;
  neighborhood: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  outcome: FieldVisitOutcome;
  notes: string;
  photoUrl?: string;
  status: FieldVisitStatus;
  pioneerJson?: Record<string, unknown> | null;
  createdPubId?: string | null;
  claimCode: string;
  claimedBy?: string | null;
  claimedAt?: string | null;
  createdAt: string;
}

function generateClaimCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return `LD-${code}`;
}

export interface PubReward {
  id: string;
  pubId: string;
  title: string;
  value: string;
  description: string;
  requirement: string;
  active: boolean;
}

function db() {
  return createInsForgeAdminClient().database;
}

export async function upsertPartnerSubscription(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
}) {
  await db().from("partner_subscriptions").upsert([
    {
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString(),
    },
  ]);
}

export async function getPartnerSubscription(userId: string) {
  const { data } = await db()
    .from("partner_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    userId: String(data.user_id),
    status: data.status as SubscriptionStatus,
    stripeCustomerId: data.stripe_customer_id
      ? String(data.stripe_customer_id)
      : null,
    stripeSubscriptionId: data.stripe_subscription_id
      ? String(data.stripe_subscription_id)
      : null,
    currentPeriodEnd: data.current_period_end
      ? String(data.current_period_end)
      : null,
  };
}

export async function isPartnerSubscribed(userId: string): Promise<boolean> {
  const sub = await getPartnerSubscription(userId);
  return sub?.status === "active" || sub?.status === "trialing";
}

export async function setProfileRole(
  userId: string,
  role: "fan" | "admin" | "partner",
) {
  await db().from("profiles").update({ role }).eq("id", userId);
}

export async function upsertPubPartnerSettings(input: {
  pubId: string;
  ownerUserId: string;
  couponsPerDay: number;
  screeningMatchIds?: string[];
  screeningLabel?: string;
  isLive?: boolean;
}) {
  await db().from("pub_partner_settings").upsert([
    {
      pub_id: input.pubId,
      owner_user_id: input.ownerUserId,
      coupons_per_day: input.couponsPerDay,
      screening_match_ids: input.screeningMatchIds ?? [],
      screening_label: input.screeningLabel ?? null,
      is_live: input.isLive ?? true,
      updated_at: new Date().toISOString(),
    },
  ]);
}

export async function getPubPartnerSettings(pubId: string) {
  const { data } = await db()
    .from("pub_partner_settings")
    .select("*")
    .eq("pub_id", pubId)
    .maybeSingle();
  if (!data) return null;
  return {
    pubId: String(data.pub_id),
    ownerUserId: data.owner_user_id ? String(data.owner_user_id) : null,
    couponsPerDay: Number(data.coupons_per_day ?? 20),
    screeningMatchIds: Array.isArray(data.screening_match_ids)
      ? (data.screening_match_ids as string[])
      : [],
    screeningLabel: data.screening_label ? String(data.screening_label) : "",
    isLive: Boolean(data.is_live),
  };
}

export async function listPubsForOwner(userId: string) {
  const { data } = await db()
    .from("pub_partner_settings")
    .select("pub_id")
    .eq("owner_user_id", userId);
  return (data ?? []).map((row) => String(row.pub_id));
}

export async function listRewardsForPub(pubId: string): Promise<PubReward[]> {
  const { data } = await db()
    .from("pub_rewards")
    .select("*")
    .eq("pub_id", pubId)
    .eq("active", true)
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => ({
    id: String(row.id),
    pubId: String(row.pub_id),
    title: String(row.title),
    value: String(row.value),
    description: String(row.description ?? ""),
    requirement: String(row.requirement ?? ""),
    active: Boolean(row.active),
  }));
}

export async function createPubReward(input: {
  pubId: string;
  title: string;
  value: string;
  description?: string;
  requirement?: string;
}) {
  const { data, error } = await db()
    .from("pub_rewards")
    .insert([
      {
        pub_id: input.pubId,
        title: input.title.trim(),
        value: input.value.trim() || "$5",
        description: input.description?.trim() || "",
        requirement: input.requirement?.trim() || "Eligible LocalDerby fan",
        active: true,
      },
    ])
    .select("*")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Failed to create reward");
  return {
    id: String(data.id),
    pubId: String(data.pub_id),
    title: String(data.title),
    value: String(data.value),
    description: String(data.description ?? ""),
    requirement: String(data.requirement ?? ""),
    active: Boolean(data.active),
  };
}

export async function replaceActiveReward(input: {
  pubId: string;
  title: string;
  value: string;
  description?: string;
}) {
  await db()
    .from("pub_rewards")
    .update({ active: false })
    .eq("pub_id", input.pubId)
    .eq("active", true);
  return createPubReward(input);
}

function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function countClaimsToday(pubId: string): Promise<number> {
  const { data } = await db()
    .from("coupon_claims")
    .select("id")
    .eq("pub_id", pubId)
    .gte("created_at", startOfUtcDayIso());
  return data?.length ?? 0;
}

export async function createCouponClaim(input: {
  pubId: string;
  rewardId: string;
  userId: string;
}) {
  const settings = await getPubPartnerSettings(input.pubId);
  const cap = settings?.couponsPerDay ?? 20;
  const used = await countClaimsToday(input.pubId);
  if (used >= cap) {
    throw new Error("This pub has no coupons left today");
  }

  const token = `ld_${randomBytes(16).toString("hex")}`;
  const { data, error } = await db()
    .from("coupon_claims")
    .insert([
      {
        pub_id: input.pubId,
        reward_id: input.rewardId,
        user_id: input.userId,
        token,
        status: "issued",
      },
    ])
    .select("*")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Failed to claim coupon");
  return {
    id: String(data.id),
    token: String(data.token),
    status: String(data.status),
    pubId: String(data.pub_id),
    rewardId: String(data.reward_id),
  };
}

export async function redeemCouponByToken(input: {
  token: string;
  redeemedBy: string;
}) {
  const { data: existing } = await db()
    .from("coupon_claims")
    .select("*")
    .eq("token", input.token.trim())
    .maybeSingle();
  if (!existing) throw new Error("Invalid QR / coupon code");
  if (existing.status === "redeemed") throw new Error("Coupon already redeemed");
  if (existing.status !== "issued") throw new Error("Coupon is not redeemable");

  const { data, error } = await db()
    .from("coupon_claims")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_by: input.redeemedBy,
    })
    .eq("id", existing.id)
    .select("*")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Redeem failed");
  return {
    id: String(data.id),
    pubId: String(data.pub_id),
    rewardId: String(data.reward_id),
    token: String(data.token),
  };
}

export async function createFieldVisit(input: {
  workerName: string;
  workerEmail?: string;
  pubName: string;
  address?: string;
  neighborhood?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  outcome: FieldVisitOutcome;
  notes?: string;
  photoUrl?: string;
  pioneerJson?: Record<string, unknown> | null;
}): Promise<FieldVisit> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const claimCode = generateClaimCode();
    const { data, error } = await db()
      .from("field_visits")
      .insert([
        {
          worker_name: input.workerName.trim(),
          worker_email: input.workerEmail?.trim() || null,
          pub_name: input.pubName.trim(),
          address: input.address?.trim() || "",
          neighborhood: input.neighborhood?.trim() || "",
          contact_name: input.contactName?.trim() || "",
          contact_phone: input.contactPhone?.trim() || "",
          contact_email: input.contactEmail?.trim() || "",
          outcome: input.outcome,
          notes: input.notes?.trim() || "",
          photo_url: input.photoUrl || null,
          status: "pending",
          pioneer_json: input.pioneerJson ?? null,
          claim_code: claimCode,
        },
      ])
      .select("*")
      .maybeSingle();
    if (!error && data) return mapFieldVisit(data);
    lastError = error?.message ?? "Failed to save visit";
    if (!/unique|duplicate|claim_code/i.test(lastError)) break;
  }
  throw new Error(lastError ?? "Failed to save visit");
}

export async function listFieldVisits(): Promise<FieldVisit[]> {
  const { data } = await db()
    .from("field_visits")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapFieldVisit);
}

export async function getFieldVisitByClaimCode(
  code: string,
): Promise<FieldVisit | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const { data } = await db()
    .from("field_visits")
    .select("*")
    .eq("claim_code", normalized)
    .maybeSingle();
  return data ? mapFieldVisit(data) : null;
}

export async function markFieldVisitClaimed(input: {
  id: string;
  claimedBy: string;
  createdPubId: string;
}) {
  const { data, error } = await db()
    .from("field_visits")
    .update({
      claimed_by: input.claimedBy,
      claimed_at: new Date().toISOString(),
      created_pub_id: input.createdPubId,
    })
    .eq("id", input.id)
    .is("claimed_by", null)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throw new Error(error?.message ?? "Claim already taken or failed");
  }
  return mapFieldVisit(data);
}

export async function reviewFieldVisit(input: {
  id: string;
  status: FieldVisitStatus;
  reviewedBy: string;
  createdPubId?: string | null;
}) {
  const patch: Record<string, unknown> = {
    status: input.status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: input.reviewedBy,
  };
  if (input.createdPubId !== undefined) {
    patch.created_pub_id = input.createdPubId;
  }
  const { data, error } = await db()
    .from("field_visits")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Review failed");
  return mapFieldVisit(data);
}

function mapFieldVisit(row: Record<string, unknown>): FieldVisit {
  return {
    id: String(row.id),
    workerName: String(row.worker_name),
    workerEmail: row.worker_email ? String(row.worker_email) : undefined,
    pubName: String(row.pub_name),
    address: String(row.address ?? ""),
    neighborhood: String(row.neighborhood ?? ""),
    contactName: String(row.contact_name ?? ""),
    contactPhone: String(row.contact_phone ?? ""),
    contactEmail: String(row.contact_email ?? ""),
    outcome: row.outcome as FieldVisitOutcome,
    notes: String(row.notes ?? ""),
    photoUrl: row.photo_url ? String(row.photo_url) : undefined,
    status: row.status as FieldVisitStatus,
    pioneerJson: (row.pioneer_json as Record<string, unknown>) ?? null,
    createdPubId: row.created_pub_id ? String(row.created_pub_id) : null,
    claimCode: String(row.claim_code ?? ""),
    claimedBy: row.claimed_by ? String(row.claimed_by) : null,
    claimedAt: row.claimed_at ? String(row.claimed_at) : null,
    createdAt: String(row.created_at),
  };
}
