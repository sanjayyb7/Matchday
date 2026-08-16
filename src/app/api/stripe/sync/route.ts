import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { getStripe } from "@/lib/stripe/client";
import {
  getPartnerSubscription,
  setProfileRole,
  upsertPartnerSubscription,
} from "@/lib/partner/store";

/** After Checkout success, sync subscription if webhook is slow/missing. */
export async function POST() {
  try {
    const user = await requireAuthUser();
    const existing = await getPartnerSubscription(user.id);
    if (existing?.status === "active" || existing?.status === "trialing") {
      return NextResponse.json({ subscribed: true, subscription: existing });
    }

    const stripe = getStripe();
    let customerId = existing?.stripeCustomerId;
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 5,
      });
      customerId =
        customers.data.find((c) => c.metadata?.localderby_user_id === user.id)
          ?.id || customers.data[0]?.id;
    }
    if (!customerId) {
      return NextResponse.json({ subscribed: false });
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 5,
    });
    const active = subs.data.find(
      (s) => s.status === "active" || s.status === "trialing",
    );
    if (!active) {
      return NextResponse.json({ subscribed: false });
    }

    await upsertPartnerSubscription({
      userId: user.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: active.id,
      status: active.status === "trialing" ? "trialing" : "active",
    currentPeriodEnd: (active as { current_period_end?: number }).current_period_end
      ? new Date(
          ((active as { current_period_end?: number }).current_period_end ?? 0) *
            1000,
        ).toISOString()
      : null,
    });
    await setProfileRole(user.id, "partner");

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
