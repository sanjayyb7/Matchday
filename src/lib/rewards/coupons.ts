export type CouponStatus = "locked" | "progress" | "unlocked";

export interface PubCoupon {
  id: string;
  title: string;
  description: string;
  value: string;
  emoji: string;
  requirement: string;
  status: CouponStatus;
  /** 0–100 when status is progress */
  progress?: number;
}

export interface SquadCouponContext {
  presentPlayers: number;
  rosterSize: number;
  presentFans: number;
}

export function getPubCoupons({
  presentPlayers,
  rosterSize,
  presentFans,
}: SquadCouponContext): PubCoupon[] {
  const isFullSquad =
    rosterSize > 0 && presentPlayers >= rosterSize;
  const squadProgress =
    rosterSize > 0 ? Math.round((presentPlayers / rosterSize) * 100) : 0;

  const earlyBirdTarget = 5;
  const formationTarget = 8;

  return [
    {
      id: "full-squad",
      title: "Full Squad Round",
      description: "Everyone at the pub gets a round on the house.",
      value: "$5",
      emoji: "🍺",
      requirement: `All ${rosterSize} squad players represented`,
      status: isFullSquad ? "unlocked" : "progress",
      progress: squadProgress,
    },
    {
      id: "early-bird",
      title: "Early Bird Pint",
      description: "First fans through the door catch the deal.",
      value: "$3 off",
      emoji: "⏰",
      requirement: `${earlyBirdTarget} fans checked in`,
      status:
        presentFans >= earlyBirdTarget
          ? "unlocked"
          : presentFans > 0
            ? "progress"
            : "locked",
      progress: Math.min(
        100,
        Math.round((presentFans / earlyBirdTarget) * 100),
      ),
    },
    {
      id: "formation-bonus",
      title: "Formation Feast",
      description: "Share a platter when the squad fills out.",
      value: "Free wings",
      emoji: "🍗",
      requirement: `${formationTarget} different players at pub`,
      status:
        presentPlayers >= formationTarget
          ? "unlocked"
          : presentPlayers > 0
            ? "progress"
            : "locked",
      progress: Math.min(
        100,
        Math.round((presentPlayers / formationTarget) * 100),
      ),
    },
    {
      id: "derby-night",
      title: "Derby Double",
      description: "Rivalry matches unlock buy-one-get-one pints.",
      value: "BOGO",
      emoji: "⚔️",
      requirement: "Active during derby fixtures",
      status: "locked",
    },
    {
      id: "loyalty",
      title: "Matchday Regular",
      description: "Your third check-in this month unlocks food credit.",
      value: "10% off food",
      emoji: "⭐",
      requirement: "3 pub check-ins this month",
      status: "locked",
      progress: 33,
    },
    {
      id: "mvp-raffle",
      title: "MOTM Raffle",
      description: "Vote for man of the match to enter the jersey draw.",
      value: "Jersey entry",
      emoji: "👕",
      requirement: "Cast your MOTM vote after full time",
      status: "locked",
    },
  ];
}
