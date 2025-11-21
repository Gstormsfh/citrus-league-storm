
export type MatchupPlayerStatus = "In Game" | "Final" | "Yet to Play";

export type MatchupPlayer = {
  id: number;
  name: string;
  position: string;
  team: string;
  points: number;
  gamesRemaining: number;
  status: MatchupPlayerStatus;
  isStarter: boolean;
};
