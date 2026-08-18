import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import {
  setProfileRole,
  upsertPartnerSubscription,
} from "@/lib/partner/store";

/** Hackathon promo codes that unlock partner dashboard without Stripe. */
const PROMO_CODES = new Set(["J007"]);

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase() || "";

    if (!PROMO_CODES.has(code)) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 },
      );
    }

    await upsertPartnerSubscription({
      userId: user.id,
      stripeCustomerId: null,
      stripeSubscriptionId: `promo:${code}`,
      status: "active",
      currentPeriodEnd: null,
    });
    await setProfileRole(user.id, "partner");

    return NextResponse.json({
      ok: true,
      subscribed: true,
      code,
      redirectTo: "/partner",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Promo failed" },
      { status: 500 },
    );
  }
}
