import { NextResponse } from "next/server";
import {
  getOrFetchDaySchedule,
  secondsUntilSfMidnight,
} from "@/lib/matches/day-cache";
import { buildDevFallbackPayload } from "@/lib/matches/dev-fallback-fixtures";
import { getApiFootballKey } from "@/lib/matches/config";
import { getFootballDataApiKey } from "@/lib/matches/football-data-fixtures";
import { getSportmonksApiKey } from "@/lib/matches/sportmonks-fixtures";
import { syncActiveMatchToInsForge } from "@/lib/matches/sync-to-insforge";

function hasAnyProviderKey(): boolean {
  return Boolean(
    getApiFootballKey() || getFootballDataApiKey() || getSportmonksApiKey(),
  );
}

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
      // Never CDN-cache demo/error so failover can recover within the same day.
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function GET() {
  if (!hasAnyProviderKey()) {
    return fallbackResponse(
      "No football API key configured (API_FOOTBALL_KEY / FOOTBALL_DATA_API_KEY / SPORTMONKS_API_KEY)",
    );
  }

  try {
    const payload = await getOrFetchDaySchedule();

    // Optional write-through of active match row (not the day schedule source).
    if (payload.match && !payload.demoSchedule && payload.teams.length > 0) {
      void syncActiveMatchToInsForge(payload.match, payload.teams, []);
    }

    const isDemo = Boolean(payload.demoSchedule);
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
        ...(isDemo ? { demoSchedule: true } : {}),
      },
      {
        headers: {
          // Live schedule can be edge-cached for the SF day; demo must not stick.
          "Cache-Control": isDemo
            ? "private, no-store"
            : `public, s-maxage=${cacheSeconds}, stale-while-revalidate=60`,
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch active match";
    return fallbackResponse(message);
  }
}
