import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Clock } from 'lucide-react';

interface DraftPick {
  id: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  position: string;
  round: number;
  pick: number;
  timestamp: number;
}

interface Team {
  id: string;
  name: string;
  owner: string;
  color: string;
  picks: DraftPick[];
}

interface DraftBoardProps {
  teams: Team[];
  draftHistory: DraftPick[];
  currentPick: number;
  currentRound: number;
}

export const DraftBoard = ({ teams, draftHistory, currentPick, currentRound }: DraftBoardProps) => {
  const totalRounds = 16;
  const totalPicks = teams.length * totalRounds;

  const getDraftPick = (round: number, teamIndex: number): DraftPick | null => {
    const pickNumber = (round - 1) * teams.length + teamIndex + 1;
    return draftHistory.find(pick => pick.pick === pickNumber) || null;
  };

  const isPendingPick = (round: number, teamIndex: number): boolean => {
    const pickNumber = (round - 1) * teams.length + teamIndex + 1;
    return pickNumber === currentPick;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Draft Board
        </h2>
        <div className="text-sm text-muted-foreground">
          {draftHistory.length} of {totalPicks} picks made
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-9 gap-2 mb-4">
            <div className="font-medium text-xs text-muted-foreground">Round</div>
            {teams.map((team) => (
              <div key={team.id} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-xs font-medium truncate">{team.name}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {team.owner}
                </div>
              </div>
            ))}
          </div>

          {/* Draft Grid */}
          <div className="space-y-2">
            {Array.from({ length: Math.min(currentRound + 2, totalRounds) }, (_, roundIndex) => {
              const round = roundIndex + 1;
              return (
                <div key={round} className="grid grid-cols-9 gap-2">
                  <div className="flex items-center justify-center bg-muted/50 rounded p-2">
                    <span className="text-sm font-medium">{round}</span>
                  </div>
                  
                  {teams.map((team, teamIndex) => {
                    const pick = getDraftPick(round, teamIndex);
                    const isPending = isPendingPick(round, teamIndex);
                    const pickNumber = (round - 1) * teams.length + teamIndex + 1;
                    
                    return (
                      <div key={`${round}-${team.id}`} className="relative">
                        <Card className={`
                          p-3 h-16 flex items-center justify-center text-center transition-all
                          ${isPending ? 'ring-2 ring-primary bg-primary/5' : ''}
                          ${pick ? 'bg-green-50 border-green-200' : 'bg-muted/20'}
                        `}>
                          {isPending && (
                            <div className="absolute -top-1 -right-1">
                              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                            </div>
                          )}
                          
                          {pick ? (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-green-700 truncate">
                                {pick.playerName}
                              </div>
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {pick.position}
                              </Badge>
                            </div>
                          ) : isPending ? (
                            <div className="space-y-1">
                              <Clock className="h-4 w-4 text-primary mx-auto" />
                              <div className="text-xs text-primary font-medium">
                                On Clock
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Pick {pickNumber}
                            </div>
                          )}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Show upcoming rounds indicator */}
          {currentRound < totalRounds - 2 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">
                {totalRounds - Math.min(currentRound + 2, totalRounds)} more rounds to show...
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};