import { NextResponse } from "next/server";
import {
  getOrFetchDaySchedule,
  secondsUntilSfMidnight,
} from "@/lib/matches/day-cache";
import { buildDevFallbackPayload } from "@/lib/matches/dev-fallback-fixtures";
import { getApiFootballKey } from "@/lib/matches/config";
import { syncActiveMatchToInsForge } from "@/lib/matches/sync-to-insforge";

function fallbackResponse(error: string) {
  const payload = buildDevFallbackPayload();
  return NextResponse.json(
    {
      ...payload,
      source: "fallback",
      error,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${secondsUntilSfMidnight()}, stale-while-revalidate=60`,
      },
    },
  );
}

export async function GET() {
  if (!getApiFootballKey()) {
    return fallbackResponse("API_FOOTBALL_KEY is not configured");
  }

  try {
    const payload = await getOrFetchDaySchedule();

    // Optional write-through of active match row (not the day schedule source).
    if (payload.match && !payload.demoSchedule && payload.teams.length > 0) {
      void syncActiveMatchToInsForge(payload.match, payload.teams, []);
    }

    const cacheSeconds = secondsUntilSfMidnight();

    return NextResponse.json(
      {
        match: payload.match,
        teams: payload.teams,
        players: payload.players,
        fixtures: payload.fixtures,
        source: payload.source,
        cacheDate: payload.cacheDate,
        ...(payload.demoReason ? { error: payload.demoReason } : {}),
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=60`,
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch active match";
    return fallbackResponse(message);
  }
}
