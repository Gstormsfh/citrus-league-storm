import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Shield, Zap, Star } from 'lucide-react';

interface PlayerStatsModalProps {
  player: any;
  isOpen: boolean;
  onClose: () => void;
}

const PlayerStatsModal = ({ player, isOpen, onClose }: PlayerStatsModalProps) => {
  if (!player) return null;

  const isGoalie = player.position === 'Goalie';

  // Advanced stats (simulated for demo)
  const advancedStats = {
    corsiFor: 58.2,
    fenwickFor: 56.8,
    pdoPercent: 102.3,
    relativeCorsi: 4.2,
    oZoneStartPct: 62.1,
    timeOnIce: '21:34',
    ppTimeOnIce: '3:42',
    shTimeOnIce: '0:56',
    faceoffWinPct: 54.3,
    hits: 89,
    blocks: 42,
    takeaways: 28,
    giveaways: 19,
    shotPct: isGoalie ? null : 12.5,
    savesPct: isGoalie ? 0.915 : null,
    qualityStarts: isGoalie ? 18 : null,
    highDangerSaves: isGoalie ? 156 : null
  };

  const recentForm = [
    { game: 'vs BOS', points: 2, goals: 1, assists: 1 },
    { game: 'at NYR', points: 1, goals: 0, assists: 1 },
    { game: 'vs TOR', points: 3, goals: 2, assists: 1 },
    { game: 'at MTL', points: 0, goals: 0, assists: 0 },
    { game: 'vs VAN', points: 1, goals: 1, assists: 0 }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl font-bold">
              {player.number}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{player.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{player.position}</Badge>
                <span className="text-muted-foreground">{player.team}</span>
                {player.starter && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Season Stats</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="recent">Recent Form</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isGoalie ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Wins</CardTitle>
                      <Shield className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.wins}</div>
                      <p className="text-xs text-muted-foreground">
                        {player.stats.losses}L {player.stats.otl}OT
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Goals Against Avg</CardTitle>
                      <Target className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.gaa}</div>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">+0.12 vs last month</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Save Percentage</CardTitle>
                      <Zap className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(player.stats.savePct * 100).toFixed(1)}%</div>
                      <div className="flex items-center text-xs">
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-red-500">-1.2% vs last month</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Shutouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.shutouts}</div>
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
                      <div className="text-2xl font-bold">{player.stats.goals}</div>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">+12% vs last season</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Assists</CardTitle>
                      <Zap className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.assists}</div>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">+8% vs last season</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                      <Star className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.points}</div>
                      <p className="text-xs text-muted-foreground">
                        Rank: #3 in position
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">+/-</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}</div>
                      <div className="flex items-center text-xs">
                        {player.stats.plusMinus > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Shots</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.shots}</div>
                      <p className="text-xs text-muted-foreground">
                        {advancedStats.shotPct}% shooting
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">PIM</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{player.stats.pim}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isGoalie ? (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Quality Starts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.qualityStarts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">High Danger Saves</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.highDangerSaves}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">PDO%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.pdoPercent}%</div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Corsi For %</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.corsiFor}%</div>
                      <p className="text-xs text-muted-foreground">Shot attempt differential</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Fenwick For %</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.fenwickFor}%</div>
                      <p className="text-xs text-muted-foreground">Unblocked shot attempts</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">O-Zone Start %</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.oZoneStartPct}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">TOI/Game</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.timeOnIce}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">PP TOI/Game</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.ppTimeOnIce}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Hits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{advancedStats.hits}</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Last 5 Games</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentForm.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="font-medium">{game.game}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>G: {game.goals}</span>
                        <span>A: {game.assists}</span>
                        <Badge variant={game.points > 1 ? "default" : game.points === 1 ? "secondary" : "outline"}>
                          {game.points} PTS
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Player Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium">{player.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Height:</span>
                    <span className="font-medium">{player.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{player.weight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-medium">{player.experience}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Fantasy Impact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fantasy Rank:</span>
                    <span className="font-medium">#12 {player.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly Projection:</span>
                    <span className="font-medium text-green-600">14.2 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rest of Season:</span>
                    <span className="font-medium">Buy</span>
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