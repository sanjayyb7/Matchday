import { createInsForgeAdminClient } from "@/lib/insforge/admin";
import { INSFORGE_ENABLED, INSFORGE_API_KEY } from "@/lib/insforge/config";
import type { Match, Player, Team } from "@/types";

export async function syncActiveMatchToInsForge(
  match: Match,
  teams: Team[],
  players: Player[],
): Promise<void> {
  if (!INSFORGE_ENABLED || !INSFORGE_API_KEY) return;

  const client = createInsForgeAdminClient();

  for (const team of teams) {
    await client.database.from("teams").upsert([
      {
        id: team.id,
        name: team.name,
        flag_url: team.flagUrl,
        country_code: team.countryCode,
        color: team.color,
      },
    ]);
  }

  for (const player of players) {
    await client.database.from("players").upsert([
      {
        id: player.id,
        team_id: player.teamId,
        name: player.name,
        number: player.number,
        image_url: player.imageUrl,
        age: player.age,
        country: player.country,
        position: player.position,
        club: player.club,
        goals: player.stats.goals,
        assists: player.stats.assists,
        caps: player.stats.caps,
      },
    ]);
  }

  await client.database.from("matches").upsert([
    {
      id: match.id,
      home_team_id: match.homeTeamId,
      away_team_id: match.awayTeamId,
      kickoff: match.kickoff,
      status: match.status,
      venue: match.venue ?? null,
    },
  ]);
}
