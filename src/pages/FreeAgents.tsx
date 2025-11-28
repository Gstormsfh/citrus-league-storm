import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, TrendingUp } from 'lucide-react';
import { PlayerService, Player } from '@/services/PlayerService';
import { LeagueService } from '@/services/LeagueService';

const FreeAgents = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('available');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
    fetchPlayers();
  }, [searchParams]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const allPlayers = await PlayerService.getAllPlayers();
      const freeAgents = await LeagueService.getFreeAgents(allPlayers);
      setPlayers(freeAgents);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to load players. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = (player: Player) => {
    toast({
      title: "Waiver Claim Submitted",
      description: `Claim for ${player.full_name} has been submitted successfully.`,
      variant: "default"
    });
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          player.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === 'ALL' || player.position === positionFilter;
    
    return matchesSearch && matchesPosition;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Free Agents</h1>
            <p className="text-muted-foreground">Available players to improve your roster</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input 
              placeholder="Search players..." 
              className="max-w-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Positions</SelectItem>
                <SelectItem value="C">Center</SelectItem>
                <SelectItem value="LW">Left Wing</SelectItem>
                <SelectItem value="RW">Right Wing</SelectItem>
                <SelectItem value="D">Defense</SelectItem>
                <SelectItem value="G">Goalie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2"><Calendar className="h-4 w-4" /> Schedule</TabsTrigger>
            <TabsTrigger value="waivers">Waiver Wire</TabsTrigger>
            <TabsTrigger value="watch">Watch List</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading players...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPlayers.map((player) => (
                  <Card key={player.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex items-center p-4">
                        <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden mr-4 border border-border">
                          {player.headshot_url ? (
                            <img src={player.headshot_url} alt={player.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-secondary-foreground font-bold text-lg">{player.team}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg">{player.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{player.position} • {player.team} • {player.status || 'Active'}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-primary">{player.points || 0}</div>
                              <p className="text-xs text-muted-foreground">Season Pts</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex gap-4 text-sm">
                            {player.position === 'G' ? (
                              <>
                                <div><span className="text-muted-foreground">W:</span> {player.wins || 0}</div>
                                <div><span className="text-muted-foreground">GAA:</span> {player.goals_against_average || '0.00'}</div>
                                <div><span className="text-muted-foreground">SV%:</span> {player.save_percentage || '.000'}</div>
                              </>
                            ) : (
                              <>
                                <div><span className="text-muted-foreground">G:</span> {player.goals || 0}</div>
                                <div><span className="text-muted-foreground">A:</span> {player.assists || 0}</div>
                                {player.shots !== null && <div><span className="text-muted-foreground">SOG:</span> {player.shots}</div>}
                                {player.blocks !== null && <div><span className="text-muted-foreground">BLK:</span> {player.blocks}</div>}
                                {player.hits !== null && <div><span className="text-muted-foreground">HIT:</span> {player.hits}</div>}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button size="sm" onClick={() => handleAddPlayer(player)}>+</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
             <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-4 flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-700 dark:text-blue-400">Schedule Maximizers</h3>
                  <p className="text-sm text-muted-foreground">These players have favorable schedules this week (4+ games or off-night games).</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {[...filteredPlayers, 
                 { id: 101, name: "Joey Daccord", position: "G", team: "SEA", opponent: "4 Games", projectedPoints: 5.8, stats: { wins: 12, gaa: 2.3, savePercentage: .920 }, trend: "up", games: 4, rostered: 42 },
                 { id: 102, name: "Charlie Coyle", position: "C/RW", team: "BOS", opponent: "4 Games", projectedPoints: 6.2, stats: { goals: 18, assists: 22 }, trend: "up", games: 4, rostered: 55 }
               ].filter(p => (p as any).games === 4 || Math.random() > 0.5).map((player: any) => (
                 <Card key={player.id} className="overflow-hidden hover:border-blue-500/50 transition-colors border-blue-500/20">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg mr-4 relative">
                        {player.team}
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">4</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{player.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                               <span>{player.position}</span>
                               <span>•</span>
                               <span className="text-green-600 font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> High Volume Week</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-primary">{player.projectedPoints}</div>
                            <p className="text-xs text-muted-foreground">Proj Pts</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex gap-2 text-sm overflow-x-auto pb-1">
                           {['Mon', 'Wed', 'Fri', 'Sun'].map(day => (
                             <div key={day} className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">{day}</div>
                           ))}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button size="sm" onClick={() => handleAddPlayer(player)}>+</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
               ))}
             </div>
          </TabsContent>
          
          <TabsContent value="waivers">
            <div className="p-8 text-center text-muted-foreground">
              No active waiver claims.
            </div>
          </TabsContent>
          
          <TabsContent value="watch">
            <div className="p-8 text-center text-muted-foreground">
              Your watch list is empty.
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default FreeAgents;
