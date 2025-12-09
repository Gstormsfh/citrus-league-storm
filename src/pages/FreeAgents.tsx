import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, TrendingUp, Filter, List, Grid, Star, Info } from 'lucide-react';
import { PlayerService, Player } from '@/services/PlayerService';
import { LeagueService } from '@/services/LeagueService';
import { ScheduleService } from '@/services/ScheduleService';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PlayerStatsModal from '@/components/PlayerStatsModal';
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';

const FreeAgents = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('available');
  const [viewMode, setViewMode] = useState<'summary' | 'all'>('summary');
  const [players, setPlayers] = useState<Player[]>([]);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [scheduleMaximizers, setScheduleMaximizers] = useState<Array<Player & { gamesThisWeek: number; gameDays: string[] }>>([]);

  // Player Stats Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<HockeyPlayer | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
    fetchPlayers();
    setWatchlist(new Set(LeagueService.getWatchlist()));
  }, [searchParams]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // Get user's league ID if logged in
      let currentLeagueId: string | undefined = undefined;
      if (user) {
        const { data: userTeamData } = await supabase
          .from('teams')
          .select('league_id')
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (userTeamData) {
          currentLeagueId = userTeamData.league_id;
          setLeagueId(currentLeagueId);
        }
      }
      
      // Get all players from staging files (staging_2025_skaters & staging_2025_goalies)
      // PlayerService.getAllPlayers() is the ONLY source for player data
      const allPlayers = await PlayerService.getAllPlayers();
      
      // LeagueService determines free agents - uses real database if leagueId provided
      // Dropped players (with deleted_at) will be included as free agents
      const freeAgents = await LeagueService.getFreeAgents(allPlayers, currentLeagueId);
      setPlayers(freeAgents);
      
      // Calculate schedule maximizers (players with 4+ games this week)
      await calculateScheduleMaximizers(freeAgents);
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

  const calculateScheduleMaximizers = async (freeAgents: Player[]) => {
    try {
      const maximizers: Array<Player & { gamesThisWeek: number; gameDays: string[] }> = [];
      
      // Calculate games this week for each player
      for (const player of freeAgents) {
        const { games, count } = await ScheduleService.getGamesThisWeek(player.team);
        
        // Only include players with 4+ games this week
        if (count >= 4) {
          // Get day abbreviations for each game
          const gameDays = games.map(game => {
            const gameDate = new Date(game.game_date);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return dayNames[gameDate.getDay()];
          });
          
          maximizers.push({
            ...player,
            gamesThisWeek: count,
            gameDays: [...new Set(gameDays)] // Remove duplicates
          });
        }
      }
      
      // Sort by games count (descending), then by points
      maximizers.sort((a, b) => {
        if (b.gamesThisWeek !== a.gamesThisWeek) {
          return b.gamesThisWeek - a.gamesThisWeek;
        }
        return (b.points || 0) - (a.points || 0);
      });
      
      setScheduleMaximizers(maximizers.slice(0, 20)); // Top 20
    } catch (error) {
      console.error('Error calculating schedule maximizers:', error);
      setScheduleMaximizers([]);
    }
  };

  const handleAddPlayer = async (player: Player) => {
    if (!user || !leagueId) {
      toast({
        title: "Error",
        description: "You must be logged in and have a team to add players.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { success, error } = await LeagueService.addPlayer(
        leagueId,
        user.id,
        player.id,
        'Free Agents Page'
      );

      if (success) {
        toast({
          title: "Player Added",
          description: `${player.full_name} has been added to your roster.`,
        });
        // Refresh the free agents list to remove the added player
        await fetchPlayers();
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to add player. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to add player. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleWatchlist = (player: Player) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(player.id)) {
      newWatchlist.delete(player.id);
      LeagueService.removeFromWatchlist(player.id);
      toast({ title: "Removed from Watch List", description: `${player.full_name} removed.` });
    } else {
      newWatchlist.add(player.id);
      LeagueService.addToWatchlist(player.id);
      toast({ title: "Added to Watch List", description: `${player.full_name} added.` });
    }
    setWatchlist(newWatchlist);
  };

  // Filter players based on search and position
  const getFilteredPlayers = (sourcePlayers: Player[]) => {
    return sourcePlayers.filter(player => {
      const matchesSearch = player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            player.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition = positionFilter === 'ALL' || 
        (positionFilter === 'W' ? (player.position === 'LW' || player.position === 'RW') : player.position === positionFilter);
      
      return matchesSearch && matchesPosition;
    });
  };

  const filteredPlayers = getFilteredPlayers(players);

  // Helper to convert Player to HockeyPlayer for the modal
  const toHockeyPlayer = (p: Player): HockeyPlayer => ({
    id: p.id,
    name: p.full_name,
    position: p.position,
    number: parseInt(p.jersey_number || '0'),
    starter: false,
    stats: {
      gamesPlayed: p.games_played || 0,
      goals: p.goals || 0,
      assists: p.assists || 0,
      points: p.points || 0,
      plusMinus: p.plus_minus || 0,
      shots: p.shots || 0,
      hits: p.hits || 0,
      blockedShots: p.blocks || 0,
      xGoals: p.xGoals || 0,
      corsi: p.corsi || 0,
      fenwick: p.fenwick || 0,
      wins: p.wins || 0,
      losses: p.losses || 0,
      otl: p.ot_losses || 0,
      gaa: p.goals_against_average || 0,
      savePct: p.save_percentage || 0
    },
    team: p.team,
    teamAbbreviation: p.team,
    status: p.status === 'injured' ? 'IR' : null,
    image: p.headshot_url || undefined,
    projectedPoints: (p.points || 0) / 20
  });

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(toHockeyPlayer(player));
    setIsPlayerDialogOpen(true);
  };

  // Derived lists for Summary View
  const topTrending = [...filteredPlayers]
    .map(p => ({
      ...p,
      adds: Math.floor((p.points || 0) * 15 + (p.full_name.length * 10)) // Mock adds count
    }))
    .sort((a, b) => b.adds - a.adds)
    .slice(0, 5);

  const topProjected = [...filteredPlayers]
    .sort((a, b) => ((b.points || 0) / 20) - ((a.points || 0) / 20)) // Mock projection
    .slice(0, 5);

  const positions = ['ALL', 'C', 'LW', 'RW', 'W', 'D', 'G'];

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
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-6">
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2"><Calendar className="h-4 w-4" /> Schedule</TabsTrigger>
            <TabsTrigger value="watch">Watch List</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-6">
            {/* Quick Position Filters */}
            <div className="flex flex-wrap gap-2">
              {positions.map((pos) => (
                <Badge
                  key={pos}
                  variant={positionFilter === pos ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90 px-4 py-1 text-sm transition-all"
                  onClick={() => setPositionFilter(pos)}
                >
                  {pos === 'W' ? 'Wingers' : (pos === 'ALL' ? 'All Positions' : pos)}
                </Badge>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading players...</p>
              </div>
            ) : (
              <>
                {viewMode === 'summary' && !searchQuery ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Trending Table */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Top Trending
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('all')}>See All</Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Mobile List View */}
                        <div className="md:hidden">
                          {topTrending.map(player => (
                            <div key={player.id} className="p-3 border-b flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="font-medium">{player.full_name}</span>
                                <span className="text-xs text-muted-foreground">{player.position} • {player.team}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="font-bold text-green-600">{player.adds.toLocaleString()}</div>
                                  <div className="text-[10px] text-muted-foreground">Adds</div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleAddPlayer(player)}>
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-right">Pos</TableHead>
                                <TableHead className="text-right">Adds</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topTrending.map(player => (
                              <TableRow key={player.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span 
                                      className="hover:underline hover:text-primary cursor-pointer"
                                      onClick={() => handlePlayerClick(player)}
                                    >
                                      {player.full_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{player.team}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{player.position}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                  {player.adds.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className={`h-8 w-8 ${watchlist.has(player.id) ? 'text-yellow-500' : 'text-muted-foreground'}`}
                                      onClick={() => toggleWatchlist(player)}
                                    >
                                      <Star className={`h-4 w-4 ${watchlist.has(player.id) ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleAddPlayer(player)}>
                                      +
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Projected Table */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          Top Projected (Week)
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('all')}>See All</Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Mobile List View */}
                        <div className="md:hidden">
                          {topProjected.map(player => (
                            <div key={player.id} className="p-3 border-b flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="font-medium">{player.full_name}</span>
                                <span className="text-xs text-muted-foreground">{player.position} • {player.team}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="font-bold text-blue-600">{((player.points || 0) / 10).toFixed(1)}</div>
                                  <div className="text-[10px] text-muted-foreground">Proj</div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleAddPlayer(player)}>
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-right">Pos</TableHead>
                                <TableHead className="text-right">Proj</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topProjected.map(player => (
                              <TableRow key={player.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span 
                                      className="hover:underline hover:text-primary cursor-pointer"
                                      onClick={() => handlePlayerClick(player)}
                                    >
                                      {player.full_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{player.team}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{player.position}</TableCell>
                                <TableCell className="text-right font-bold text-blue-600">
                                  {((player.points || 0) / 10).toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className={`h-8 w-8 ${watchlist.has(player.id) ? 'text-yellow-500' : 'text-muted-foreground'}`}
                                      onClick={() => toggleWatchlist(player)}
                                    >
                                      <Star className={`h-4 w-4 ${watchlist.has(player.id) ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleAddPlayer(player)}>
                                      +
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">All Available Players</h3>
                      {viewMode === 'all' && !searchQuery && (
                        <Button variant="outline" size="sm" onClick={() => setViewMode('summary')}>Back to Summary</Button>
                      )}
                    </div>
                    
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
                                    <h3 
                                      className="font-bold text-lg hover:underline hover:text-primary cursor-pointer"
                                      onClick={() => handlePlayerClick(player)}
                                    >
                                      {player.full_name}
                                    </h3>
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
                                      <div><span className="text-muted-foreground">GAA:</span> {typeof player.goals_against_average === 'number' ? player.goals_against_average.toFixed(2) : '0.00'}</div>
                                      <div><span className="text-muted-foreground">SV%:</span> {typeof player.save_percentage === 'number' ? player.save_percentage.toFixed(3) : '.000'}</div>
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
                              <div className="ml-4 flex flex-col gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className={`h-8 w-8 ${watchlist.has(player.id) ? 'text-yellow-500' : 'text-muted-foreground'}`}
                                  onClick={() => toggleWatchlist(player)}
                                >
                                  <Star className={`h-4 w-4 ${watchlist.has(player.id) ? 'fill-current' : ''}`} />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => handlePlayerClick(player)}>
                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={() => handleAddPlayer(player)}>+</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
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

             {loading ? (
               <div className="text-center py-12 text-muted-foreground">Loading schedule data...</div>
             ) : scheduleMaximizers.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>No players with 4+ games this week found.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 {scheduleMaximizers.map((player) => (
                   <Card key={player.id} className="overflow-hidden hover:border-blue-500/50 transition-colors border-blue-500/20">
                    <CardContent className="p-0">
                      <div className="flex items-center p-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg mr-4 relative">
                          {player.team}
                          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                            {player.gamesThisWeek}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg">{player.full_name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                 <span>{player.position}</span>
                                 <span>•</span>
                                 <span className="text-green-600 font-medium flex items-center gap-1">
                                   <TrendingUp className="h-3 w-3" /> High Volume Week
                                 </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-primary">
                                {((player.points || 0) / 82).toFixed(1)}
                              </div>
                              <p className="text-xs text-muted-foreground">Pts/Gm</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex gap-2 text-sm overflow-x-auto pb-1">
                             {player.gameDays.map(day => (
                               <div key={day} className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">
                                 {day}
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`${watchlist.has(player.id) ? 'text-yellow-500' : 'text-muted-foreground'}`}
                            onClick={() => toggleWatchlist(player)}
                          >
                            <Star className={`h-4 w-4 ${watchlist.has(player.id) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button size="sm" onClick={() => handleAddPlayer(player)}>+</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                 ))}
               </div>
             )}
          </TabsContent>
          
          <TabsContent value="watch">
            {players.filter(p => watchlist.has(p.id)).length === 0 ? (
               <div className="p-12 text-center border-2 border-dashed rounded-lg">
                 <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                 <h3 className="text-lg font-medium">Your watch list is empty</h3>
                 <p className="text-muted-foreground mt-2">Star players to keep track of their performance.</p>
                 <Button variant="link" onClick={() => setActiveTab('available')} className="mt-4">
                   Browse Available Players
                 </Button>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {players.filter(p => watchlist.has(p.id)).map((player) => (
                <Card key={player.id} className="overflow-hidden hover:border-yellow-500/50 transition-colors border-yellow-500/10">
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {player.position} • {player.team}
                              <Badge variant="outline" className="border-yellow-500/30 text-yellow-600 bg-yellow-500/5">Watched</Badge>
                            </div>
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
                               <div><span className="text-muted-foreground">GAA:</span> {typeof player.goals_against_average === 'number' ? player.goals_against_average.toFixed(2) : '0.00'}</div>
                               <div><span className="text-muted-foreground">SV%:</span> {typeof player.save_percentage === 'number' ? player.save_percentage.toFixed(3) : '.000'}</div>
                             </>
                           ) : (
                             <>
                               <div><span className="text-muted-foreground">G:</span> {player.goals || 0}</div>
                               <div><span className="text-muted-foreground">A:</span> {player.assists || 0}</div>
                               <div><span className="text-muted-foreground">AVG:</span> {((player.points || 0) / 82).toFixed(1)}</div>
                             </>
                           )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-yellow-500"
                          onClick={() => toggleWatchlist(player)}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => handlePlayerClick(player)}>
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleAddPlayer(player)}>+</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Player Stats Modal */}
        <PlayerStatsModal
          player={selectedPlayer}
          isOpen={isPlayerDialogOpen}
          onClose={() => setIsPlayerDialogOpen(false)}
        />
      </main>
      <Footer />
    </div>
  );
};

export default FreeAgents;
