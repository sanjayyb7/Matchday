import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth/require-user";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { createInsForgeAdminClient } from "@/lib/insforge/admin";

/** Wipe a squad thread so a demo can start from an empty chat. */
export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = (await request.json()) as {
      teamId?: string;
      matchId?: string;
    };
    const teamId = body.teamId?.trim();
    const matchId = body.matchId?.trim();
    if (!teamId || !matchId) {
      return NextResponse.json(
        { error: "teamId and matchId are required" },
        { status: 400 },
      );
    }

    const server = await createInsForgeServerClient();
    const { data: membershipRows } = await server.database
      .from("user_identities")
      .select("id")
      .eq("user_id", user.id)
      .eq("match_id", matchId)
      .eq("team_id", teamId)
      .limit(1);

    if (!membershipRows?.length) {
      return NextResponse.json(
        { error: "Join this squad before resetting chat." },
        { status: 403 },
      );
    }

    try {
      const { error } = await createInsForgeAdminClient()
        .database.from("chat_messages")
        .delete()
        .eq("team_id", teamId)
        .eq("match_id", matchId);
      if (error) {
        throw error;
      }
    } catch (adminError) {
      // No admin key / admin delete failed — still wipe whatever RLS allows.
      console.error("[chat reset] admin wipe failed, falling back to user delete", adminError);
      const { error } = await server.database
        .from("chat_messages")
        .delete()
        .eq("team_id", teamId)
        .eq("match_id", matchId);
      if (error) {
        return NextResponse.json(
          { error: "Could not reset chat." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Could not reset chat." }, { status: 500 });
  }
}
