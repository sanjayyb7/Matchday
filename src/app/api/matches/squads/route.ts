import { NextRequest, NextResponse } from "next/server";
import { buildSquadsForMatchId } from "@/lib/matches/api-football";
import { getApiFootballKey } from "@/lib/matches/config";

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId")?.trim();
  if (!matchId) {
    return NextResponse.json(
      { error: "matchId is required" },
      { status: 400 },
    );
  }

  if (!getApiFootballKey()) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const payload = await buildSquadsForMatchId(matchId);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=120",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load squads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
