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
  getUpcomingMatchesNext24Hours,
  getDisplayableUpcomingMatches,
  getLastMatchFetchError,
  isUsingFallbackFixtures,
  getMatchLabel,
  getDerivedMatchStatus,
  isIdentityStillActive,
  getAllPlayers,
  hydrateStaticDataFromInsForge,
  isStaticDataHydrated,
  refreshActiveMatchFromApi,
  isActiveMatchHydrated,
  refreshPubsFromInsForge,
  subscribePubs,
  notifyPubsChanged,
} from "@/lib/mock/data";

export const dataSource = INSFORGE_ENABLED ? "insforge-postgres" : "mock-json";

export async function fetchTeamsFromInsForge() {
  if (!INSFORGE_ENABLED) return mockData.teams;
  await mockData.hydrateStaticDataFromInsForge();
  return mockData.teams;
}
