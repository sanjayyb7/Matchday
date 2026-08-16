import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import {
  getPartnerSubscription,
  isPartnerSubscribed,
  listPubsForOwner,
  getPubPartnerSettings,
  listRewardsForPub,
  countClaimsToday,
} from "@/lib/partner/store";
import { createInsForgeAdminClient } from "@/lib/insforge/admin";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const subscribed = await isPartnerSubscribed(user.id);
    const subscription = await getPartnerSubscription(user.id);
    const pubIds = subscribed ? await listPubsForOwner(user.id) : [];

    const pubs = [];
    if (pubIds.length > 0) {
      const { data } = await createInsForgeAdminClient()
        .database.from("pubs")
        .select("*")
        .in("id", pubIds);
      for (const row of data ?? []) {
        const pubId = String(row.id);
        const settings = await getPubPartnerSettings(pubId);
        const rewards = await listRewardsForPub(pubId);
        const claimsToday = await countClaimsToday(pubId);
        pubs.push({
          id: pubId,
          name: String(row.name),
          address: String(row.address),
          neighborhood: String(row.neighborhood),
          lat: Number(row.lat),
          lng: Number(row.lng),
          imageUrl: String(row.image_url),
          couponsPerDay: settings?.couponsPerDay ?? 20,
          screeningLabel: settings?.screeningLabel ?? "",
          screeningMatchIds: settings?.screeningMatchIds ?? [],
          claimsToday,
          remainingToday: Math.max(
            0,
            (settings?.couponsPerDay ?? 20) - claimsToday,
          ),
          rewards,
        });
      }
    }

    return NextResponse.json({
      subscribed,
      subscription,
      role: user.role,
      pubs,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
