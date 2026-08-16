import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { getAppUrl, getStripe, getStripePriceId } from "@/lib/stripe/client";
import {
  getPartnerSubscription,
  upsertPartnerSubscription,
} from "@/lib/partner/store";

export async function POST() {
  try {
    const user = await requireAuthUser();
    const stripe = getStripe();
    const priceId = getStripePriceId();
    const appUrl = getAppUrl();

    const existing = await getPartnerSubscription(user.id);
    let customerId = existing?.stripeCustomerId ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { localderby_user_id: user.id },
      });
      customerId = customer.id;
      await upsertPartnerSubscription({
        userId: user.id,
        stripeCustomerId: customerId,
        status: "inactive",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/partner?checkout=success`,
      cancel_url: `${appUrl}/for-pubs?checkout=cancel`,
      client_reference_id: user.id,
      metadata: { localderby_user_id: user.id },
      subscription_data: {
        metadata: { localderby_user_id: user.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
