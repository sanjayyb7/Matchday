import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { updatePubAsAdmin } from "@/lib/pubs/admin-pubs";
import {
  getPubPartnerSettings,
  isPartnerSubscribed,
  listPubsForOwner,
  replaceActiveReward,
  upsertPubPartnerSettings,
} from "@/lib/partner/store";

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser();
    const subscribed =
      user.role === "admin" || (await isPartnerSubscribed(user.id));
    if (!subscribed) {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 402 },
      );
    }

    const body = (await request.json()) as {
      pubId?: string;
      name?: string;
      address?: string;
      neighborhood?: string;
      couponsPerDay?: number;
      screeningLabel?: string;
      rewardTitle?: string;
      rewardValue?: string;
    };

    if (!body.pubId) {
      return NextResponse.json({ error: "pubId required" }, { status: 400 });
    }

    if (user.role !== "admin") {
      const owned = await listPubsForOwner(user.id);
      if (!owned.includes(body.pubId)) {
        return NextResponse.json({ error: "Not your pub" }, { status: 403 });
      }
    }

    let pub = null;
    if (
      body.name != null ||
      body.address != null ||
      body.neighborhood != null
    ) {
      pub = await updatePubAsAdmin(body.pubId, {
        name: body.name,
        address: body.address,
        neighborhood: body.neighborhood,
      });
    }

    const existing = await getPubPartnerSettings(body.pubId);
    await upsertPubPartnerSettings({
      pubId: body.pubId,
      ownerUserId: existing?.ownerUserId || user.id,
      couponsPerDay: body.couponsPerDay ?? existing?.couponsPerDay ?? 20,
      screeningMatchIds: existing?.screeningMatchIds ?? [],
      screeningLabel: body.screeningLabel ?? existing?.screeningLabel,
      isLive: true,
    });

    let reward = null;
    if (body.rewardTitle?.trim()) {
      reward = await replaceActiveReward({
        pubId: body.pubId,
        title: body.rewardTitle.trim(),
        value: body.rewardValue?.trim() || "$5",
        description: body.rewardTitle.trim(),
      });
    }

    return NextResponse.json({ ok: true, pub, reward });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
