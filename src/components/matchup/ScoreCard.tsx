
import { Card, CardContent } from "@/components/ui/card";
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
  return (
    <Card className="mb-8 overflow-hidden border-fantasy-border shadow-lg animate-fade-in">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-br from-fantasy-light via-white to-fantasy-light p-8 border-b border-fantasy-border">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0 transition-all hover:scale-105">
            <div className="text-sm text-fantasy-muted mb-1 uppercase tracking-wider">Your Team</div>
            <div className="text-3xl font-bold text-fantasy-primary">{myTeamName}</div>
            <div className="text-fantasy-muted mt-1 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-positive/10 text-fantasy-positive text-xs font-bold">{myTeamRecord.wins}</span>
              <span className="text-fantasy-muted">-</span>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-danger/10 text-fantasy-danger text-xs font-bold">{myTeamRecord.losses}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 py-4 px-8 rounded-full bg-white shadow-md transition-transform hover:scale-105">
            <div className="text-5xl font-bold bg-gradient-to-r from-fantasy-primary to-fantasy-secondary bg-clip-text text-transparent">{myTeamPoints}</div>
            <div className="text-2xl text-fantasy-muted">vs</div>
            <div className="text-5xl font-bold bg-gradient-to-r from-fantasy-dark to-fantasy-muted bg-clip-text text-transparent">{opponentTeamPoints}</div>
          </div>
          
          <div className="flex flex-col items-center md:items-end mt-4 md:mt-0 transition-all hover:scale-105">
            <div className="text-sm text-fantasy-muted mb-1 uppercase tracking-wider">Opponent</div>
            <div className="text-3xl font-bold text-fantasy-dark">{opponentTeamName}</div>
            <div className="text-fantasy-muted mt-1 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-positive/10 text-fantasy-positive text-xs font-bold">{opponentTeamRecord.wins}</span>
              <span className="text-fantasy-muted">-</span>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-danger/10 text-fantasy-danger text-xs font-bold">{opponentTeamRecord.losses}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white/50 backdrop-blur-sm">
          <div className="text-sm font-medium mb-3 text-fantasy-dark/70">Week Progress</div>
          <div className="flex gap-4 items-center">
            <div className="text-xs font-medium text-fantasy-primary">Mon</div>
            <Progress 
              value={70} 
              className="h-3 flex-1 rounded-full overflow-hidden border border-fantasy-border/20" 
              indicatorClassName="bg-gradient-to-r from-fantasy-primary to-fantasy-secondary"
            />
            <div className="text-xs font-medium text-fantasy-primary">Sun</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
