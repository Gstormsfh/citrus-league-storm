import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface DraftHistoryProps {
  draftHistory: DraftPick[];
}

export const DraftHistory = ({ draftHistory }: DraftHistoryProps) => {
  const sortedHistory = [...draftHistory].reverse(); // Show most recent first

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Draft History
        </h2>
        <div className="text-sm text-muted-foreground">
          {draftHistory.length} picks made
        </div>
      </div>

      {draftHistory.length > 0 ? (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {sortedHistory.map((pick, index) => (
              <div 
                key={pick.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border
                  ${index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {pick.pick}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      R{pick.round}
                    </div>
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">
                      {pick.playerName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">{pick.playerName}</div>
                    <div className="text-sm text-muted-foreground">
                      Selected by {pick.teamName}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{pick.position}</Badge>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(pick.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-muted-foreground mb-2">No picks made yet</div>
          <div className="text-sm text-muted-foreground">
            Draft history will appear here as picks are made
          </div>
        </div>
      )}
    </Card>
  );
};