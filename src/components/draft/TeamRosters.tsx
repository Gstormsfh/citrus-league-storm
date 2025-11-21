import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy } from 'lucide-react';

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

interface TeamRostersProps {
  teams: Team[];
  draftHistory: DraftPick[];
}

export const TeamRosters = ({ teams, draftHistory }: TeamRostersProps) => {
  const getTeamPicks = (teamId: string) => {
    return draftHistory.filter(pick => pick.teamId === teamId);
  };

  const getPositionCount = (picks: DraftPick[], position: string) => {
    return picks.filter(pick => pick.position === position).length;
  };

  const TeamRosterCard = ({ team }: { team: Team }) => {
    const picks = getTeamPicks(team.id);
    const positionCounts = {
      C: getPositionCount(picks, 'C'),
      LW: getPositionCount(picks, 'LW'),
      RW: getPositionCount(picks, 'RW'),
      D: getPositionCount(picks, 'D'),
      G: getPositionCount(picks, 'G'),
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <div>
              <h3 className="font-semibold">{team.name}</h3>
              <p className="text-sm text-muted-foreground">{team.owner}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{picks.length}</div>
            <div className="text-xs text-muted-foreground">picks</div>
          </div>
        </div>

        {/* Position Summary */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Object.entries(positionCounts).map(([position, count]) => (
            <div key={position} className="text-center">
              <div className="text-xs text-muted-foreground">{position}</div>
              <div className="text-sm font-medium">{count}</div>
            </div>
          ))}
        </div>

        {/* Draft Picks List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {picks.length > 0 ? (
            picks.map(pick => (
              <div key={pick.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground w-8">
                    {pick.round}.{pick.pick % teams.length || teams.length}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{pick.playerName}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {pick.position}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No picks yet
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team Rosters
        </h2>
        <div className="text-sm text-muted-foreground">
          {draftHistory.length} total picks made
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teams.map(team => (
          <TeamRosterCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
};