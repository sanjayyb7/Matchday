import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { listFieldVisits, reviewFieldVisit } from "@/lib/partner/store";
import { createPubAsAdmin } from "@/lib/pubs/admin-pubs";
import {
  createPubReward,
  upsertPubPartnerSettings,
} from "@/lib/partner/store";
import { pubs as seedPubs } from "@/lib/mock/data";

export async function GET() {
  try {
    const user = await requireAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const visits = await listFieldVisits();
    return NextResponse.json({ visits });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = (await request.json()) as {
      id?: string;
      status?: "verified" | "rejected" | "needs_follow_up" | "pending";
      createPubFromVisit?: boolean;
    };

    if (!body.id || !body.status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    let createdPubId: string | null = null;
    if (body.status === "verified" && body.createPubFromVisit) {
      const visits = await listFieldVisits();
      const visit = visits.find((v) => v.id === body.id);
      if (visit) {
        if (visit.createdPubId) {
          // Already claimed/created — keep existing pub + owner
          createdPubId = visit.createdPubId;
        } else {
          const pioneer = visit.pioneerJson as {
            pubName?: string;
            address?: string;
            neighborhood?: string;
            screeningMatches?: string[];
            rewards?: Array<{
              title: string;
              value?: string;
              description?: string;
            }>;
            couponsPerDay?: number;
          } | null;

          const ref = seedPubs[0];
          const pub = await createPubAsAdmin({
            name: pioneer?.pubName || visit.pubName,
            address: pioneer?.address || visit.address || "San Francisco, CA",
            neighborhood:
              pioneer?.neighborhood || visit.neighborhood || "San Francisco",
            lat: ref?.lat ?? 37.7749,
            lng: ref?.lng ?? -122.4194,
          });
          createdPubId = pub.id;

          // Leave owner unset until partner claims, unless already claimed
          const ownerUserId = visit.claimedBy || user.id;
          await upsertPubPartnerSettings({
            pubId: pub.id,
            ownerUserId,
            couponsPerDay: pioneer?.couponsPerDay ?? 20,
            screeningLabel:
              pioneer?.screeningMatches?.[0] || "Matchday screening",
            isLive: true,
          });

          const rewards =
            pioneer?.rewards?.length
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
      }
    }

    const visit = await reviewFieldVisit({
      id: body.id,
      status: body.status,
      reviewedBy: user.id,
      createdPubId: createdPubId ?? undefined,
    });

    return NextResponse.json({ visit });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 500 },
    );
  }
}
