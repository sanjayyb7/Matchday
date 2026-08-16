import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { createCouponClaim, listRewardsForPub } from "@/lib/partner/store";

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = (await request.json()) as {
      pubId?: string;
      rewardId?: string;
    };
    if (!body.pubId) {
      return NextResponse.json({ error: "pubId required" }, { status: 400 });
    }

    let rewardId = body.rewardId;
    if (!rewardId) {
      const rewards = await listRewardsForPub(body.pubId);
      rewardId = rewards[0]?.id;
    }
    if (!rewardId) {
      return NextResponse.json(
        { error: "No rewards configured for this pub" },
        { status: 400 },
      );
    }

    const claim = await createCouponClaim({
      pubId: body.pubId,
      rewardId,
      userId: user.id,
    });

    return NextResponse.json({
      claim,
      qrPayload: claim.token,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Claim failed" },
      { status: 400 },
    );
  }
}
