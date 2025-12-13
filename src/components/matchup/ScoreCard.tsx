import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  myTeamName: string;
  myTeamRecord: { wins: number; losses: number };
  opponentTeamName: string;
  opponentTeamRecord: { wins: number; losses: number };
  myTeamPoints: string;
  opponentTeamPoints: string;
}

export const ScoreCard = ({
  myTeamName,
  myTeamRecord,
  opponentTeamName,
  opponentTeamRecord,
  myTeamPoints,
  opponentTeamPoints,
}: ScoreCardProps) => {
  // Calculate win probability based on scores
  const myPointsNum = parseFloat(myTeamPoints) || 0;
  const oppPointsNum = parseFloat(opponentTeamPoints) || 0;
  const totalPoints = myPointsNum + oppPointsNum;
  const winProbability = totalPoints > 0 ? Math.round((myPointsNum / totalPoints) * 100) : 50;
  
  return (
    <div className="mb-6 bg-card border-2 border-primary/20 rounded-lg shadow-md overflow-hidden bg-gradient-to-br from-card to-primary/5">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* My Team - Citrus Green */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
            <div className="text-2xl font-bold text-fantasy-secondary mb-1">{myTeamName}</div>
            <div className="text-xs text-muted-foreground font-medium bg-fantasy-secondary/10 px-2 py-1 rounded-full">
              {myTeamRecord.wins}-{myTeamRecord.losses} Record
            </div>
          </div>
          
          {/* Score Display - Citrus Colors */}
          <div className="flex items-center gap-6 px-8 py-4 bg-gradient-to-r from-fantasy-secondary/10 via-transparent to-[hsl(var(--vibrant-orange))]/10 rounded-lg">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-fantasy-secondary mb-1">{myTeamPoints}</div>
              <div className="text-xs text-muted-foreground font-medium">Points</div>
            </div>
            <div className="text-lg font-semibold text-muted-foreground/40">—</div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[hsl(var(--vibrant-orange))] mb-1">{opponentTeamPoints}</div>
              <div className="text-xs text-muted-foreground font-medium">Points</div>
            </div>
          </div>
          
          {/* Opponent - Citrus Orange */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right flex-1">
            <div className="text-2xl font-bold text-[hsl(var(--vibrant-orange))] mb-1">{opponentTeamName}</div>
            <div className="text-xs text-muted-foreground font-medium bg-[hsl(var(--vibrant-orange))]/10 px-2 py-1 rounded-full">
              {opponentTeamRecord.wins}-{opponentTeamRecord.losses} Record
            </div>
          </div>
        </div>
        
        {/* Win Probability Bar - Citrus Gradient */}
        <div className="mt-6 pt-6 border-t border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Win Probability</span>
            <span className="text-sm font-bold text-fantasy-secondary">{winProbability}%</span>
          </div>
          <Progress 
            value={winProbability} 
            className="h-2 bg-muted/30" 
            indicatorClassName="bg-gradient-to-r from-fantasy-secondary to-fantasy-primary" 
          />
        </div>
      </div>
    </div>
  );
};
