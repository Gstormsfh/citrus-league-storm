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
    <div className="mb-8 rounded-2xl overflow-hidden glass-panel">
      <div className="p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* My Team - Green Theme */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="text-3xl font-bold text-primary tracking-tight">{myTeamName}</div>
            <div className="text-muted-foreground font-medium mt-1 bg-white/50 px-3 py-1 rounded-full text-xs">
              {myTeamRecord.wins}-{myTeamRecord.losses}
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8 bg-white/40 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/40 shadow-sm">
            <div className="text-4xl md:text-5xl font-bold text-primary">{myTeamPoints}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">vs</div>
            <div className="text-4xl md:text-5xl font-bold text-[hsl(var(--vibrant-orange))]">{opponentTeamPoints}</div>
          </div>
          
          {/* Opponent - Orange Theme */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <div className="text-3xl font-bold text-[hsl(var(--vibrant-orange))] tracking-tight">{opponentTeamName}</div>
            <div className="text-muted-foreground font-medium mt-1 bg-white/50 px-3 py-1 rounded-full text-xs">
              {opponentTeamRecord.wins}-{opponentTeamRecord.losses}
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="flex justify-between text-sm font-medium mb-3">
             <span className="text-muted-foreground">Win Probability</span>
             <span className="text-primary font-bold">68%</span>
          </div>
          <Progress value={68} className="h-3 bg-muted/50" indicatorClassName="bg-gradient-to-r from-primary to-[hsl(var(--vibrant-green))]" />
        </div>
      </div>
    </div>
  );
};
