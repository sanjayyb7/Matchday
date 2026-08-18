import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { createPubAsAdmin } from "@/lib/pubs/admin-pubs";
import {
  createPubReward,
  isPartnerSubscribed,
  upsertPubPartnerSettings,
} from "@/lib/partner/store";
import { getLiveOrUpcomingMatch, getMatchLabel } from "@/lib/mock/data";

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    if (user.role !== "partner" && user.role !== "admin") {
      const subscribed = await isPartnerSubscribed(user.id);
      if (!subscribed) {
        return NextResponse.json(
          { error: "Subscribe to LocalDerby for Pubs ($10/mo) first" },
          { status: 402 },
        );
      }
    }

    const body = (await request.json()) as {
      name?: string;
      address?: string;
      neighborhood?: string;
      lat?: number;
      lng?: number;
      imageUrl?: string;
      couponsPerDay?: number;
      screeningLabel?: string;
      rewards?: Array<{ title: string; value?: string; description?: string }>;
    };

    if (!body.name || !body.address || body.lat == null || body.lng == null) {
      return NextResponse.json({ error: "Missing pub fields" }, { status: 400 });
    }

    const pub = await createPubAsAdmin({
      name: body.name,
      address: body.address,
      neighborhood: body.neighborhood || "San Francisco",
      lat: body.lat,
      lng: body.lng,
      imageUrl: body.imageUrl,
    });

    const live = getLiveOrUpcomingMatch();
    const screeningLabel =
      body.screeningLabel?.trim() ||
      (live ? getMatchLabel(live) : "Matchday screening");

    await upsertPubPartnerSettings({
      pubId: pub.id,
      ownerUserId: user.id,
      couponsPerDay: body.couponsPerDay ?? 20,
      screeningMatchIds: live ? [live.id] : [],
      screeningLabel,
      isLive: true,
    });

    const rewards = [];
    const rewardInputs =
      body.rewards?.length
        ? body.rewards
        : [{ title: "$5 off", value: "$5", description: "LocalDerby fan coupon" }];
    for (const reward of rewardInputs) {
      rewards.push(
        await createPubReward({
          pubId: pub.id,
          title: reward.title,
          value: reward.value || "$5",
          description: reward.description,
        }),
      );
    }

    return NextResponse.json({ pub, rewards, screeningLabel });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create pub" },
      { status: 500 },
    );
  }
}
