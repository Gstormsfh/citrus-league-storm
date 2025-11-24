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
    <Card className="mb-8 overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-gradient-to-br from-fantasy-light to-white">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
            <div className="text-3xl font-bold text-fantasy-secondary">{myTeamName}</div>
            <div className="text-muted-foreground text-sm mt-1">
              {myTeamRecord.wins}-{myTeamRecord.losses}
            </div>
          </div>
          
          <div className="flex items-center gap-8 py-4">
            <div className="text-5xl font-bold text-fantasy-secondary">{myTeamPoints}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">vs</div>
            <div className="text-5xl font-bold text-fantasy-primary">{opponentTeamPoints}</div>
          </div>
          
          <div className="flex flex-col items-center md:items-end mt-4 md:mt-0">
            <div className="text-3xl font-bold text-fantasy-primary">{opponentTeamName}</div>
            <div className="text-muted-foreground text-sm mt-1">
              {opponentTeamRecord.wins}-{opponentTeamRecord.losses}
            </div>
          </div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="flex justify-between text-sm font-medium mb-3 text-muted-foreground">
             <span>Win Probability</span>
             <span className="text-fantasy-secondary">68%</span>
          </div>
          <Progress value={68} className="h-2 bg-fantasy-light" indicatorClassName="bg-fantasy-secondary" />
        </div>
      </CardContent>
    </Card>
  );
};
