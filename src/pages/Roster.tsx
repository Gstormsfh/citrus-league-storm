import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, TrendingDown, BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayerStatsModal from '@/components/PlayerStatsModal';

// Sample player data - hockey themed
const players = [
  {
    id: 1,
    name: 'Connor McDavid',
    position: 'Centre',
    number: 97,
    starter: true,
    stats: { goals: 44, assists: 89, points: 133, plusMinus: 28, pim: 36, shots: 352 },
    team: 'Edmonton Oilers',
    height: '6\'1"',
    weight: '193 lbs',
    age: 27,
    experience: '9 years',
    image: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Leon Draisaitl',
    position: 'Centre',
    number: 29,
    starter: true,
    stats: { goals: 41, assists: 64, points: 105, plusMinus: 7, pim: 42, shots: 245 },
    team: 'Edmonton Oilers',
    height: '6\'2"',
    weight: '208 lbs',
    age: 28,
    experience: '9 years',
    image: 'https://images.unsplash.com/photo-1580064003896-8eba6fc5435f?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Nathan MacKinnon',
    position: 'Centre',
    number: 29,
    starter: false,
    stats: { goals: 51, assists: 89, points: 140, plusMinus: 32, pim: 28, shots: 370 },
    team: 'Colorado Avalanche',
    height: '6\'0"',
    weight: '200 lbs',
    age: 28,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1574883052806-413e0927a4d7?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'David Pastrnak',
    position: 'Right Wing',
    number: 88,
    starter: true,
    stats: { goals: 47, assists: 63, points: 110, plusMinus: 26, pim: 34, shots: 312 },
    team: 'Boston Bruins',
    height: '6\'0"',
    weight: '195 lbs',
    age: 28,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1562088287-e698e7c8e6da?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Mikko Rantanen',
    position: 'Right Wing',
    number: 96,
    starter: true,
    stats: { goals: 40, assists: 64, points: 104, plusMinus: 24, pim: 48, shots: 265 },
    team: 'Colorado Avalanche',
    height: '6\'4"',
    weight: '215 lbs',
    age: 27,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1580652870699-ae85c08a1ace?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 6,
    name: 'Mitchell Marner',
    position: 'Right Wing',
    number: 16,
    starter: false,
    stats: { goals: 26, assists: 59, points: 85, plusMinus: 16, pim: 22, shots: 198 },
    team: 'Toronto Maple Leafs',
    height: '6\'0"',
    weight: '175 lbs',
    age: 27,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1565035010268-a3816f98589a?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 7,
    name: 'Kirill Kaprizov',
    position: 'Left Wing',
    number: 97,
    starter: true,
    stats: { goals: 39, assists: 57, points: 96, plusMinus: 22, pim: 30, shots: 243 },
    team: 'Minnesota Wild',
    height: '5\'10"',
    weight: '201 lbs',
    age: 27,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1580852300654-203e8516c578?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 8,
    name: 'Matthew Tkachuk',
    position: 'Left Wing',
    number: 19,
    starter: true,
    stats: { goals: 26, assists: 61, points: 87, plusMinus: -2, pim: 110, shots: 234 },
    team: 'Florida Panthers',
    height: '6\'2"',
    weight: '202 lbs',
    age: 26,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 9,
    name: 'Jason Robertson',
    position: 'Left Wing',
    number: 21,
    starter: false,
    stats: { goals: 29, assists: 50, points: 79, plusMinus: 15, pim: 24, shots: 214 },
    team: 'Dallas Stars',
    height: '6\'3"',
    weight: '200 lbs',
    age: 25,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 10,
    name: 'Cale Makar',
    position: 'Defence',
    number: 8,
    starter: true,
    stats: { goals: 21, assists: 62, points: 83, plusMinus: 29, pim: 26, shots: 246 },
    team: 'Colorado Avalanche',
    height: '5\'11"',
    weight: '187 lbs',
    age: 25,
    experience: '5 years',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 11,
    name: 'Roman Josi',
    position: 'Defence',
    number: 59,
    starter: true,
    stats: { goals: 18, assists: 67, points: 85, plusMinus: -5, pim: 38, shots: 270 },
    team: 'Nashville Predators',
    height: '6\'1"',
    weight: '201 lbs',
    age: 33,
    experience: '13 years',
    image: 'https://images.unsplash.com/photo-1562087926-662f6680a456?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 12,
    name: 'Victor Hedman',
    position: 'Defence',
    number: 77,
    starter: false,
    stats: { goals: 13, assists: 62, points: 75, plusMinus: 14, pim: 52, shots: 195 },
    team: 'Tampa Bay Lightning',
    height: '6\'6"',
    weight: '241 lbs',
    age: 33,
    experience: '15 years',
    image: 'https://images.unsplash.com/photo-1582642030918-905439388d02?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 13,
    name: 'Andrei Vasilevskiy',
    position: 'Goalie',
    number: 88,
    starter: true,
    stats: { wins: 30, losses: 15, otl: 5, gaa: 2.50, savePct: 0.915, shutouts: 4 },
    team: 'Tampa Bay Lightning',
    height: '6\'3"',
    weight: '225 lbs',
    age: 29,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1560849807-bae5314c9e98?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 14,
    name: 'Igor Shesterkin',
    position: 'Goalie',
    number: 31,
    starter: false,
    stats: { wins: 36, losses: 17, otl: 2, gaa: 2.58, savePct: 0.913, shutouts: 3 },
    team: 'New York Rangers',
    height: '6\'2"',
    weight: '182 lbs',
    age: 28,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1561731172-9d906d7b13ad?q=80&w=200&auto=format&fit=crop'
  },
];

// Sample team stats for analytics section
const teamStats = {
  record: "42-22-8",
  points: 92,
  goalsFor: 247,
  goalsAgainst: 198,
  powerPlayPct: 23.5,
  penaltyKillPct: 82.4,
  lastTenGames: "7-2-1",
  streak: "W3",
  homeRecord: "22-10-4",
  awayRecord: "20-12-4",
  trends: [
    { stat: "Goals", direction: "up", value: "+2.4%" },
    { stat: "Save %", direction: "up", value: "+1.8%" },
    { stat: "PP%", direction: "down", value: "-3.2%" },
    { stat: "Shots", direction: "up", value: "+4.1%" },
    { stat: "PK%", direction: "up", value: "+0.7%" }
  ]
};

const Roster = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<typeof players[0] | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");

  const handlePlayerClick = (player: typeof players[0]) => {
    setSelectedPlayer(player);
    setIsPlayerDialogOpen(true);
  };

  // Group players by position
  const positionGroups = players.reduce((groups: Record<string, typeof players>, player) => {
    if (!groups[player.position]) {
      groups[player.position] = [];
    }
    groups[player.position].push(player);
    return groups;
  }, {});

  // Sort players by starter status within each position
  Object.keys(positionGroups).forEach(position => {
    positionGroups[position].sort((a, b) => {
      if (a.starter && !b.starter) return -1;
      if (!a.starter && b.starter) return 1;
      return 0;
    });
  });

  const positionOrder = ['Centre', 'Right Wing', 'Left Wing', 'Defence', 'Goalie'];
  const positionLabels: Record<string, string> = {
    'Centre': 'Centers',
    'Right Wing': 'Right Wingers', 
    'Left Wing': 'Left Wingers',
    'Defence': 'Defencemen',
    'Goalie': 'Goalies'
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Fantasy Team Header */}
          <div className="bg-card rounded-lg shadow-md border p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  HC
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Hockey Champions</h1>
                  <div className="text-muted-foreground text-sm">Manager: John Smith</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Record</div>
                  <div className="font-bold">{teamStats.record}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Points</div>
                  <div className="font-bold">{teamStats.points}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Standing</div>
                  <div className="font-bold">#3</div>
                </div>
              </div>

              <div>
                <Button>
                  Edit Lineup
                </Button>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="bg-card rounded-lg shadow-md border">
              <TabsList className="w-full p-0 bg-transparent border-b rounded-none gap-0">
                <TabsTrigger 
                  value="roster" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Roster
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Team Stats
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Trends & Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roster" className="m-0 p-6">
                {/* Position-based roster layout */}
                <div className="space-y-8">
                  {positionOrder.map((position) => {
                    const positionPlayers = positionGroups[position] || [];
                    if (positionPlayers.length === 0) return null;
                    
                    return (
                      <div key={position} className="space-y-4">
                        <h2 className="text-xl font-bold text-primary flex items-center">
                          {positionLabels[position]}
                          <Badge variant="secondary" className="ml-2">
                            {positionPlayers.length}
                          </Badge>
                        </h2>
                        
                        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Player</TableHead>
                                <TableHead className="text-center">Team</TableHead>
                                {position === 'Goalie' ? (
                                  <>
                                    <TableHead className="text-center">W</TableHead>
                                    <TableHead className="text-center">L</TableHead>
                                    <TableHead className="text-center">GAA</TableHead>
                                    <TableHead className="text-center">SV%</TableHead>
                                    <TableHead className="text-center">SO</TableHead>
                                  </>
                                ) : (
                                  <>
                                    <TableHead className="text-center">G</TableHead>
                                    <TableHead className="text-center">A</TableHead>
                                    <TableHead className="text-center">PTS</TableHead>
                                    <TableHead className="text-center">+/-</TableHead>
                                    <TableHead className="text-center">SOG</TableHead>
                                  </>
                                )}
                                <TableHead className="text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {positionPlayers.map((player, index) => (
                                <TableRow 
                                  key={player.id}
                                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                                  onClick={() => handlePlayerClick(player)}
                                >
                                  <TableCell>
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                      {player.number}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <div className="font-semibold">{player.name}</div>
                                        <div className="text-sm text-muted-foreground">{position}</div>
                                      </div>
                                      {player.starter && (
                                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="text-xs">
                                      {player.team.split(' ').pop()}
                                    </Badge>
                                  </TableCell>
                                  {position === 'Goalie' ? (
                                    <>
                                      <TableCell className="text-center font-medium">{player.stats.wins}</TableCell>
                                      <TableCell className="text-center">{player.stats.losses}</TableCell>
                                      <TableCell className="text-center">{player.stats.gaa}</TableCell>
                                      <TableCell className="text-center">{(player.stats.savePct * 100).toFixed(1)}%</TableCell>
                                      <TableCell className="text-center">{player.stats.shutouts}</TableCell>
                                    </>
                                  ) : (
                                    <>
                                      <TableCell className="text-center font-medium">{player.stats.goals}</TableCell>
                                      <TableCell className="text-center font-medium">{player.stats.assists}</TableCell>
                                      <TableCell className="text-center font-bold text-primary">{player.stats.points}</TableCell>
                                      <TableCell className="text-center">
                                        <span className={player.stats.plusMinus > 0 ? 'text-green-600' : player.stats.plusMinus < 0 ? 'text-red-600' : ''}>
                                          {player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-center">{player.stats.shots}</TableCell>
                                    </>
                                  )}
                                  <TableCell className="text-center">
                                    <Badge variant={player.starter ? "default" : "secondary"} className="text-xs">
                                      {player.starter ? "Starter" : "Bench"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="m-0 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.goalsFor}</div>
                      <p className="text-sm text-muted-foreground">Goals For</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.goalsAgainst}</div>
                      <p className="text-sm text-muted-foreground">Goals Against</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.powerPlayPct}%</div>
                      <p className="text-sm text-muted-foreground">Power Play %</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{teamStats.penaltyKillPct}%</div>
                      <p className="text-sm text-muted-foreground">Penalty Kill %</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="m-0 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Performance Trends</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamStats.trends.map((trend, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{trend.stat}</span>
                              <div className="flex items-center">
                                {trend.direction === 'up' ? (
                                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                  {trend.value}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Enhanced Player Stats Modal */}
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

export default Roster;