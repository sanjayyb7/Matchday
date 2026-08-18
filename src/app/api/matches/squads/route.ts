import { NextRequest, NextResponse } from "next/server";
import { getOrFetchSquadsForMatch } from "@/lib/matches/day-cache";
import { getApiFootballKey } from "@/lib/matches/config";
import { getFootballDataApiKey } from "@/lib/matches/football-data-fixtures";
import { getSportmonksApiKey } from "@/lib/matches/sportmonks-fixtures";

function hasAnyProviderKey(): boolean {
  return Boolean(
    getApiFootballKey() || getFootballDataApiKey() || getSportmonksApiKey(),
  );
}

export async function GET(request: NextRequest) {
  const matchId = request.nextUrl.searchParams.get("matchId")?.trim();
  if (!matchId) {
    return NextResponse.json(
      { error: "matchId is required" },
      { status: 400 },
    );
  }

  if (!hasAnyProviderKey()) {
    return NextResponse.json(
      {
        error:
          "No football API key configured (API_FOOTBALL_KEY / FOOTBALL_DATA_API_KEY / SPORTMONKS_API_KEY)",
      },
      { status: 503 },
    );
  }

  try {
    const payload = await getOrFetchSquadsForMatch(matchId);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load squads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
