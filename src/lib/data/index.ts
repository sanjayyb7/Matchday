import { INSFORGE_ENABLED } from "@/lib/insforge/config";
import * as mockData from "@/lib/mock/data";

export {
  pubs,
  matches,
  teams,
  getTeam,
  getPlayersByTeam,
  getPlayer,
  getPub,
  getMatch,
  getLiveOrUpcomingMatch,
  getMatchLabel,
  getAllPlayers,
} from "@/lib/mock/data";

/**
 * Static football data is seeded in InsForge Postgres when backend is enabled.
 * Reads still use local JSON loaders for now — same IDs/content as the database seed.
 */
export const dataSource = INSFORGE_ENABLED ? "insforge-seeded" : "mock-json";

export async function fetchTeamsFromInsForge() {
  if (!INSFORGE_ENABLED) return mockData.teams;
  const { getInsForgeBrowserClient } = await import("@/lib/insforge/client");
  const client = getInsForgeBrowserClient();
  const { data } = await client.database.from("teams").select("*");
  return (
    data?.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      flagUrl: String(row.flag_url),
      countryCode: String(row.country_code),
      color: String(row.color),
    })) ?? mockData.teams
  );
}
