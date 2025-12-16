
export type MatchupPlayerStatus = "In Game" | "Final" | null;

export type MatchupPlayer = {
  id: number;
  name: string;
  position: string;
  team: string;
  points: number;
  projectedPoints?: number;
  gamesRemaining: number;
  status: MatchupPlayerStatus;
  isStarter: boolean;
  stats: {
    goals: number;
    assists: number;
    sog: number;
    blk: number;
    gamesPlayed?: number;
    xGoals?: number;
  };
  isToday?: boolean;
  gameInfo?: {
    opponent: string;
    time?: string;
    score?: string;
    period?: string;
  };
  projection?: {
    // Matchup-specific projection (for this week's games)
    matchup_projected_xg: number; // Sum of final_projected_xg for all games in matchup week
    matchup_projected_points: number; // matchup_projected_xg × 20 (conversion factor)
    gsax_factor_pct: number;
    qoc_factor_pct: number;
    explainability_message?: string | null;
    // Rest of Season projection (matchup-neutral, player talent)
    ros_projected_xg: number; // Per-game RoS projection
    ros_projected_points: number; // ros_projected_xg × 20
  };
};
