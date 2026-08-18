import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { isPartnerSubscribed, redeemCouponByToken } from "@/lib/partner/store";

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const subscribed =
      user.role === "admin" ||
      user.role === "partner" ||
      (await isPartnerSubscribed(user.id));
    if (!subscribed) {
      return NextResponse.json({ error: "Partner access required" }, { status: 403 });
    }

    const body = (await request.json()) as { token?: string };
    if (!body.token?.trim()) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const redeemed = await redeemCouponByToken({
      token: body.token,
      redeemedBy: user.id,
    });
    return NextResponse.json({ ok: true, redeemed });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Redeem failed" },
      { status: 400 },
    );
  }
}
