import type { Player, Team } from "@/types";

const FALLBACK_POSITIONS = [
  "Goalkeeper",
  "Defender",
  "Defender",
  "Defender",
  "Defender",
  "Midfielder",
  "Midfielder",
  "Midfielder",
  "Forward",
  "Forward",
  "Forward",
] as const;

/** Placeholder squad when API-Football squads are unavailable (e.g. free tier). */
export function generateFallbackSquad(team: Team): Player[] {
  const color = team.color.replace("#", "");

  return FALLBACK_POSITIONS.map((position, index) => {
    const number = index === 0 ? 1 : index + 1;
    const seed = `${team.id}-${number}`;

    return {
      id: `${team.id}-fallback-${number}`,
      teamId: team.id,
      name: `${team.name} #${number}`,
      number,
      imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${color}`,
      age: 25,
      country: team.name,
      position,
      club: team.name,
      stats: { goals: 0, assists: 0, caps: 0 },
    };
  });
}
