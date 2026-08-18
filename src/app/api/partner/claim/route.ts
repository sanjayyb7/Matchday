import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { createPubAsAdmin } from "@/lib/pubs/admin-pubs";
import {
  createPubReward,
  getFieldVisitByClaimCode,
  getPubPartnerSettings,
  isPartnerSubscribed,
  listRewardsForPub,
  markFieldVisitClaimed,
  upsertPubPartnerSettings,
  type FieldVisit,
} from "@/lib/partner/store";
import { pubs as seedPubs } from "@/lib/mock/data";

function pioneerFromVisit(visit: FieldVisit) {
  return (visit.pioneerJson ?? {}) as {
    pubName?: string;
    address?: string;
    neighborhood?: string;
    screeningMatches?: string[];
    rewards?: Array<{ title: string; value?: string; description?: string }>;
    couponsPerDay?: number;
  };
}

async function ensurePubFromVisit(visit: FieldVisit, ownerUserId: string) {
  if (visit.createdPubId) {
    const settings = await getPubPartnerSettings(visit.createdPubId);
    if (settings?.ownerUserId && settings.ownerUserId !== ownerUserId) {
      throw new Error("This pub is already linked to another partner");
    }
    await upsertPubPartnerSettings({
      pubId: visit.createdPubId,
      ownerUserId,
      couponsPerDay: settings?.couponsPerDay ?? 20,
      screeningMatchIds: settings?.screeningMatchIds,
      screeningLabel: settings?.screeningLabel ?? undefined,
      isLive: true,
    });
    return visit.createdPubId;
  }

  const pioneer = pioneerFromVisit(visit);
  const ref = seedPubs[0];
  const pub = await createPubAsAdmin({
    name: pioneer.pubName || visit.pubName,
    address: pioneer.address || visit.address || "San Francisco, CA",
    neighborhood:
      pioneer.neighborhood || visit.neighborhood || "San Francisco",
    lat: ref?.lat ?? 37.7749,
    lng: ref?.lng ?? -122.4194,
  });

  await upsertPubPartnerSettings({
    pubId: pub.id,
    ownerUserId,
    couponsPerDay: pioneer.couponsPerDay ?? 20,
    screeningLabel: pioneer.screeningMatches?.[0] || "Matchday screening",
    isLive: true,
  });

  const existingRewards = await listRewardsForPub(pub.id);
  if (existingRewards.length === 0) {
    const rewards =
      pioneer.rewards?.length
        ? pioneer.rewards
        : [{ title: "$5 off", value: "$5" }];
    for (const reward of rewards) {
      await createPubReward({
        pubId: pub.id,
        title: reward.title,
        value: reward.value || "$5",
        description: reward.description,
      });
    }
  }

  return pub.id;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const subscribed =
      user.role === "admin" || (await isPartnerSubscribed(user.id));
    if (!subscribed) {
      return NextResponse.json(
        { error: "Subscribe at /for-pubs first (Stripe or coupon J007)" },
        { status: 402 },
      );
    }

    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase() || "";
    if (!code) {
      return NextResponse.json({ error: "Claim code required" }, { status: 400 });
    }

    const visit = await getFieldVisitByClaimCode(code);
    if (!visit) {
      return NextResponse.json({ error: "Invalid claim code" }, { status: 404 });
    }
    if (visit.outcome === "not_interested") {
      return NextResponse.json(
        { error: "This visit was marked not interested" },
        { status: 400 },
      );
    }
    if (visit.claimedBy && visit.claimedBy !== user.id) {
      return NextResponse.json(
        { error: "This claim code was already used" },
        { status: 409 },
      );
    }
    if (visit.claimedBy === user.id && visit.createdPubId) {
      return NextResponse.json({
        ok: true,
        alreadyClaimed: true,
        pubId: visit.createdPubId,
        visit,
      });
    }

    const pubId = await ensurePubFromVisit(visit, user.id);
    const claimed = await markFieldVisitClaimed({
      id: visit.id,
      claimedBy: user.id,
      createdPubId: pubId,
    });

    return NextResponse.json({
      ok: true,
      pubId,
      visit: claimed,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Claim failed" },
      { status: 500 },
    );
  }
}
