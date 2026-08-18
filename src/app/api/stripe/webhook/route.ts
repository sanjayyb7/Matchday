import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import {
  setProfileRole,
  upsertPartnerSubscription,
  type SubscriptionStatus,
} from "@/lib/partner/store";

export const runtime = "nodejs";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  if (status === "canceled" || status === "unpaid") return "canceled";
  return "inactive";
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId =
    subscription.metadata?.localderby_user_id ||
    (typeof subscription.customer === "string" ? "" : "");
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      resolvedUserId = customer.metadata?.localderby_user_id ?? "";
    }
  }
  if (!resolvedUserId) return;

  const status = mapStatus(subscription.status);
  const periodEnd = (subscription as { current_period_end?: number })
    .current_period_end;
  await upsertPartnerSubscription({
    userId: resolvedUserId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status,
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
  });

  if (status === "active" || status === "trialing") {
    await setProfileRole(resolvedUserId, "partner");
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ||
          session.metadata?.localderby_user_id ||
          "";
        if (userId && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          if (!subscription.metadata?.localderby_user_id) {
            await stripe.subscriptions.update(subId, {
              metadata: { localderby_user_id: userId },
            });
          }
          await syncSubscription({
            ...subscription,
            metadata: {
              ...subscription.metadata,
              localderby_user_id: userId,
            },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
