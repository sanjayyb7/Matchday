import { NextResponse } from "next/server";
import { buildActiveMatchPayload } from "@/lib/matches/api-football";
import { buildDevFallbackPayload } from "@/lib/matches/dev-fallback-fixtures";
import {
  ACTIVE_MATCH_CACHE_SECONDS,
  getApiFootballKey,
} from "@/lib/matches/config";
import { deriveMatchStatus } from "@/lib/matches/match-window";
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
        "Cache-Control": `public, s-maxage=60, stale-while-revalidate=30`,
      },
    },
  );
}

export async function GET() {
  if (!getApiFootballKey()) {
    return fallbackResponse("API_FOOTBALL_KEY is not configured");
  }

  try {
    const payload = await buildActiveMatchPayload();

    if (payload.match) {
      await syncActiveMatchToInsForge(
        payload.match,
        payload.teams,
        payload.players,
      );
    }

    const hasLive = payload.fixtures.some(
      (fixture) => deriveMatchStatus(fixture) === "live",
    );
    const cacheSeconds = hasLive ? 60 : ACTIVE_MATCH_CACHE_SECONDS;

    return NextResponse.json(
      {
        match: payload.match,
        teams: payload.teams,
        players: payload.players,
        fixtures: payload.fixtures,
        source: "api-football",
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=30`,
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch active match";
    return fallbackResponse(message);
  }
}
