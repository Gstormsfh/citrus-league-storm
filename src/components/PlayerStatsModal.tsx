import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Shield, Zap, Star, AlertCircle, Clock, User, Ruler, Weight, Calendar, Award, Activity, BarChart3, Users, Timer, Crosshair } from 'lucide-react';
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';
import { cn } from '@/lib/utils';

interface PlayerStatsModalProps {
  player: HockeyPlayer | null;
  isOpen: boolean;
  onClose: () => void;
}

const PlayerStatsModal = ({ player, isOpen, onClose }: PlayerStatsModalProps) => {
  if (!player) return null;

  const isGoalie = player.position === 'Goalie';
  const stats = player.stats || {};

  // Get status badge info
  const getStatusInfo = () => {
    if (!player.status) return null;
    const statusConfig = {
      'IR': { label: 'Injury Reserve', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' },
      'SUSP': { label: 'Suspended', variant: 'destructive' as const, icon: AlertCircle, color: 'text-orange-500' },
      'GTD': { label: 'Game Time Decision', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-500' },
      'WVR': { label: 'Waiver', variant: 'outline' as const, icon: AlertCircle, color: 'text-blue-500' },
    };
    return statusConfig[player.status];
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {player.number}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{player.name}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-sm">{player.position}</Badge>
                <span className="text-muted-foreground font-medium">{player.team}</span>
                {player.teamAbbreviation && (
                  <Badge variant="outline" className="text-xs">{player.teamAbbreviation}</Badge>
                )}
                {player.starter && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Starter
                  </Badge>
                )}
                {statusInfo && (
                  <Badge variant={statusInfo.variant} className="gap-1">
                    <statusInfo.icon className={cn("h-3 w-3", statusInfo.color)} />
                    {statusInfo.label}
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stats">Season Stats</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
            <TabsTrigger value="recent">Recent Form</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Season Stats Tab */}
          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isGoalie ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Wins</CardTitle>
                      <Shield className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.wins ?? 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.losses ?? 0}L {stats.otl ?? 0}OT
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Goals Against Avg</CardTitle>
                      <Target className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.gaa?.toFixed(2) ?? '0.00'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Save Percentage</CardTitle>
                      <Zap className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.savePct ? (stats.savePct * 100).toFixed(1) : '0.0'}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Shutouts</CardTitle>
                      <Star className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.shutouts ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                      <Activity className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.gamesPlayed ?? 0}</div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Goals</CardTitle>
                      <Target className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.goals ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Assists</CardTitle>
                      <Zap className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.assists ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                      <Star className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.points ?? (stats.goals ?? 0) + (stats.assists ?? 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">+/-</CardTitle>
                      <TrendingUp className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={cn(
                        "text-2xl font-bold",
                        (stats.plusMinus ?? 0) > 0 && "text-green-600",
                        (stats.plusMinus ?? 0) < 0 && "text-red-600"
                      )}>
                        {(stats.plusMinus ?? 0) > 0 ? '+' : ''}{stats.plusMinus ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Shots on Goal</CardTitle>
                      <Crosshair className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.shots ?? 0}</div>
                      {stats.shots && stats.goals && (
                        <p className="text-xs text-muted-foreground">
                          {((stats.goals / stats.shots) * 100).toFixed(1)}% shooting
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                      <Activity className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.gamesPlayed ?? 0}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Advanced Stats Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isGoalie ? (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Save Percentage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.savePct ? (stats.savePct * 100).toFixed(2) : '0.00'}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Goals Against Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.gaa?.toFixed(2) ?? '0.00'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Record</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.wins ?? 0}-{stats.losses ?? 0}-{stats.otl ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Time on Ice</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.toi ?? '0:00'}</div>
                      {stats.toiPercentage && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.toiPercentage.toFixed(1)}% of team TOI
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Hits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.hits ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Blocked Shots</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.blockedShots ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Power Play Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.powerPlayPoints ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Short Handed Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.shortHandedPoints ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Penalty Minutes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pim ?? 0}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Detailed Stats Tab */}
          <TabsContent value="detailed" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Skater Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">Goals</span>
                      <span className="font-bold">{stats.goals ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">Assists</span>
                      <span className="font-bold">{stats.assists ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">Points</span>
                      <span className="font-bold">{stats.points ?? (stats.goals ?? 0) + (stats.assists ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">+/-</span>
                      <span className={cn(
                        "font-bold",
                        (stats.plusMinus ?? 0) > 0 && "text-green-600",
                        (stats.plusMinus ?? 0) < 0 && "text-red-600"
                      )}>
                        {(stats.plusMinus ?? 0) > 0 ? '+' : ''}{stats.plusMinus ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">Shots</span>
                      <span className="font-bold">{stats.shots ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">Hits</span>
                      <span className="font-bold">{stats.hits ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">Blocks</span>
                      <span className="font-bold">{stats.blockedShots ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">PIM</span>
                      <span className="font-bold">{stats.pim ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">PPP</span>
                      <span className="font-bold">{stats.powerPlayPoints ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">SHP</span>
                      <span className="font-bold">{stats.shortHandedPoints ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">Games</span>
                      <span className="font-bold">{stats.gamesPlayed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm text-muted-foreground">TOI</span>
                      <span className="font-bold">{stats.toi ?? '0:00'}</span>
                    </div>
                  </div>
                  {stats.toiPercentage && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">TOI Percentage</span>
                        <span className="font-bold">{stats.toiPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(stats.toiPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {isGoalie && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Goalie Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Wins</span>
                        <span className="font-bold">{stats.wins ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Losses</span>
                        <span className="font-bold">{stats.losses ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">OT Losses</span>
                        <span className="font-bold">{stats.otl ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">GAA</span>
                        <span className="font-bold">{stats.gaa?.toFixed(2) ?? '0.00'}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Save %</span>
                        <span className="font-bold">
                          {stats.savePct ? (stats.savePct * 100).toFixed(2) : '0.00'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Shutouts</span>
                        <span className="font-bold">{stats.shutouts ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Games</span>
                        <span className="font-bold">{stats.gamesPlayed ?? 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Recent Form Tab */}
          <TabsContent value="recent" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Recent game data will be displayed here</p>
                  <p className="text-sm mt-2">Last 5-10 games with goals, assists, points, and +/-</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Player Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Height</span>
                      </div>
                      <span className="font-semibold">{player.height ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Weight</span>
                      </div>
                      <span className="font-semibold">{player.weight ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Age</span>
                      </div>
                      <span className="font-semibold">{player.age ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Experience</span>
                      </div>
                      <span className="font-semibold">{player.experience ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Team</span>
                      </div>
                      <span className="font-semibold">{player.team}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Position</span>
                      </div>
                      <Badge variant="secondary">{player.position}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Jersey Number</span>
                      </div>
                      <span className="font-semibold">#{player.number}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Status & Roster
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Roster Status</span>
                      <Badge variant={player.starter ? "default" : "secondary"}>
                        {player.starter ? "Starter" : "Bench"}
                      </Badge>
                    </div>
                    {player.status && (
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <span className="text-muted-foreground">Injury Status</span>
                        <Badge variant={statusInfo?.variant || "outline"}>
                          {statusInfo?.label || player.status}
                        </Badge>
                      </div>
                    )}
                    {player.teamAbbreviation && (
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                        <span className="text-muted-foreground">Team Abbreviation</span>
                        <Badge variant="outline">{player.teamAbbreviation}</Badge>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Player ID</span>
                      <span className="font-mono text-sm">{player.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerStatsModal;
