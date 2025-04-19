
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Star, TrendingUp, TrendingDown, BarChart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeStat, setActiveStat] = useState("standard");

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

  // Sort players by starter status
  Object.keys(positionGroups).forEach(position => {
    positionGroups[position].sort((a, b) => {
      if (a.starter && !b.starter) return -1;
      if (!a.starter && b.starter) return 1;
      return 0;
    });
  });

  const positionOrder = ['Centre', 'Right Wing', 'Left Wing', 'Defence', 'Goalie'];

  return (
    <div className="min-h-screen bg-fantasy-background text-fantasy-dark">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Fantasy Team Header - similar to the example image */}
          <div className="bg-white rounded-lg shadow-md border border-fantasy-border p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-fantasy-primary flex items-center justify-center text-white text-2xl font-bold">
                  HC
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-fantasy-dark">Hockey Champions</h1>
                  <div className="text-fantasy-muted text-sm">Manager: John Smith</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-fantasy-muted">Record</div>
                  <div className="font-bold">{teamStats.record}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-fantasy-muted">Points</div>
                  <div className="font-bold">{teamStats.points}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-fantasy-muted">Standing</div>
                  <div className="font-bold">#3</div>
                </div>
              </div>

              <div>
                <Button className="bg-fantasy-primary hover:bg-fantasy-primary/90 text-white">
                  Edit Lineup
                </Button>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="bg-white rounded-lg shadow-md border border-fantasy-border">
              <TabsList className="w-full p-0 bg-transparent border-b border-fantasy-border rounded-none gap-0">
                <TabsTrigger 
                  value="roster" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-fantasy-primary data-[state=active]:text-fantasy-primary"
                >
                  Roster
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-fantasy-primary data-[state=active]:text-fantasy-primary"
                >
                  Team Stats
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-fantasy-primary data-[state=active]:text-fantasy-primary"
                >
                  Trends &amp; Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-gm" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-fantasy-primary data-[state=active]:text-fantasy-primary"
                >
                  AI GM Tool
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roster" className="m-0 p-6">
                {/* Secondary tabs for roster view */}
                <Tabs value={activeStat} onValueChange={setActiveStat} className="mb-4">
                  <TabsList className="bg-fantasy-background/80 p-1">
                    <TabsTrigger value="standard" className="data-[state=active]:bg-white data-[state=active]:text-fantasy-primary">
                      Standard
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-white data-[state=active]:text-fantasy-primary">
                      Advanced
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Roster table similar to example */}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-fantasy-light hover:bg-fantasy-light">
                      <TableHead className="w-[40px]">POS</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right"># / Team</TableHead>
                      <TableHead className="text-right">G</TableHead>
                      <TableHead className="text-right">A</TableHead>
                      <TableHead className="text-right">PTS</TableHead>
                      <TableHead className="text-right">+/-</TableHead>
                      <TableHead className="text-right">PIM</TableHead>
                      <TableHead className="text-right">SOG</TableHead>
                      {activeStat === "advanced" && (
                        <>
                          <TableHead className="text-right">PP PTS</TableHead>
                          <TableHead className="text-right">SH PTS</TableHead>
                          <TableHead className="text-right">GWG</TableHead>
                          <TableHead className="text-right">FO%</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positionOrder.map(position => (
                      positionGroups[position]?.map((player) => (
                        <TableRow 
                          key={player.id} 
                          className="cursor-pointer hover:bg-fantasy-light"
                          onClick={() => handlePlayerClick(player)}
                        >
                          <TableCell className="font-medium">
                            <Badge className={`${player.starter ? 'bg-fantasy-primary' : 'bg-fantasy-muted'} text-white`}>
                              {position === 'Centre' ? 'C' : 
                               position === 'Right Wing' ? 'RW' : 
                               position === 'Left Wing' ? 'LW' : 
                               position === 'Defence' ? 'D' : 'G'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden">
                                <img 
                                  src={player.image} 
                                  alt={player.name} 
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-xs text-fantasy-muted">{player.position}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium">#{player.number}</div>
                            <div className="text-xs text-fantasy-muted">{player.team}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {position === 'Goalie' ? player.stats.wins : player.stats.goals}
                          </TableCell>
                          <TableCell className="text-right">
                            {position === 'Goalie' ? player.stats.losses : player.stats.assists}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {position === 'Goalie' ? player.stats.otl : player.stats.points}
                          </TableCell>
                          <TableCell className={`text-right ${
                            position !== 'Goalie' && player.stats.plusMinus > 0 
                              ? 'text-fantasy-positive' 
                              : position !== 'Goalie' && player.stats.plusMinus < 0 
                                ? 'text-fantasy-danger' 
                                : ''
                          }`}>
                            {position === 'Goalie' ? player.stats.gaa : player.stats.plusMinus > 0 ? `+${player.stats.plusMinus}` : player.stats.plusMinus}
                          </TableCell>
                          <TableCell className="text-right">
                            {position === 'Goalie' ? player.stats.savePct : player.stats.pim}
                          </TableCell>
                          <TableCell className="text-right">
                            {position === 'Goalie' ? player.stats.shutouts : player.stats.shots}
                          </TableCell>
                          {activeStat === "advanced" && (
                            <>
                              <TableCell className="text-right">{position !== 'Goalie' ? Math.floor(Math.random() * 30) : '-'}</TableCell>
                              <TableCell className="text-right">{position !== 'Goalie' ? Math.floor(Math.random() * 10) : '-'}</TableCell>
                              <TableCell className="text-right">{position !== 'Goalie' ? Math.floor(Math.random() * 10) : '-'}</TableCell>
                              <TableCell className="text-right">{position === 'Centre' ? `${Math.floor(45 + Math.random() * 15)}%` : '-'}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="stats" className="m-0 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-white to-fantasy-light border-fantasy-border">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-fantasy-dark mb-4">Team Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Record</span>
                          <span className="font-medium">{teamStats.record}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Points</span>
                          <span className="font-medium">{teamStats.points}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Last 10 Games</span>
                          <span className="font-medium">{teamStats.lastTenGames}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Current Streak</span>
                          <span className="font-medium">{teamStats.streak}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-white to-fantasy-light border-fantasy-border">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-fantasy-dark mb-4">Offense</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Goals For</span>
                          <span className="font-medium">{teamStats.goalsFor}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Avg. Goals/Game</span>
                          <span className="font-medium">{(teamStats.goalsFor / 72).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Power Play %</span>
                          <span className="font-medium">{teamStats.powerPlayPct}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Shots/Game</span>
                          <span className="font-medium">32.4</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-white to-fantasy-light border-fantasy-border">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-fantasy-dark mb-4">Defense</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Goals Against</span>
                          <span className="font-medium">{teamStats.goalsAgainst}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Avg. GA/Game</span>
                          <span className="font-medium">{(teamStats.goalsAgainst / 72).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Penalty Kill %</span>
                          <span className="font-medium">{teamStats.penaltyKillPct}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-fantasy-muted">Shots Against/Game</span>
                          <span className="font-medium">29.7</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-white to-fantasy-light border-fantasy-border">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-fantasy-dark mb-4">Scoring by Period</h3>
                      <div className="h-24 flex items-end space-x-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-fantasy-primary rounded-t"
                              style={{ height: `${Math.max(30, Math.random() * 100)}px` }}
                            />
                            <div className="mt-2 text-sm font-medium">
                              {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="m-0 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-white to-fantasy-light border-fantasy-border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-fantasy-dark">Recent Trends</h3>
                        <Badge className="bg-fantasy-secondary text-white">Last 30 days</Badge>
                      </div>
                      <div className="space-y-4">
                        {teamStats.trends.map((trend, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {trend.direction === "up" ? (
                                <TrendingUp className="text-fantasy-positive h-5 w-5" />
                              ) : (
                                <TrendingDown className="text-fantasy-danger h-5 w-5" />
                              )}
                              <span className="font-medium">{trend.stat}</span>
                            </div>
                            <span className={trend.direction === "up" ? "text-fantasy-positive font-medium" : "text-fantasy-danger font-medium"}>
                              {trend.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-white to-fantasy-light border-fantasy-border">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-fantasy-dark">Scoring Analysis</h3>
                        <Badge className="bg-fantasy-tertiary text-white">Full Season</Badge>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-fantasy-muted">Even Strength</span>
                            <span className="font-medium">68%</span>
                          </div>
                          <div className="w-full bg-fantasy-border rounded-full h-2">
                            <div className="bg-fantasy-primary rounded-full h-2" style={{ width: "68%" }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-fantasy-muted">Power Play</span>
                            <span className="font-medium">24%</span>
                          </div>
                          <div className="w-full bg-fantasy-border rounded-full h-2">
                            <div className="bg-fantasy-secondary rounded-full h-2" style={{ width: "24%" }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-fantasy-muted">Short-handed</span>
                            <span className="font-medium">5%</span>
                          </div>
                          <div className="w-full bg-fantasy-border rounded-full h-2">
                            <div className="bg-fantasy-tertiary rounded-full h-2" style={{ width: "5%" }}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-fantasy-muted">Empty Net</span>
                            <span className="font-medium">3%</span>
                          </div>
                          <div className="w-full bg-fantasy-border rounded-full h-2">
                            <div className="bg-fantasy-muted rounded-full h-2" style={{ width: "3%" }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 bg-gradient-to-br from-white to-fantasy-light border-fantasy-border">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-fantasy-dark mb-4">Top Performers (Last 10 Games)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {players.filter((p, i) => i < 3).map((player) => (
                          <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg border border-fantasy-border bg-white hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                              <img 
                                src={player.image} 
                                alt={player.name} 
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-fantasy-muted">{player.position}</div>
                              <div className="text-sm font-medium text-fantasy-primary">
                                {player.position === 'Goalie' 
                                  ? `${player.stats.wins} W, ${player.stats.savePct} SV%` 
                                  : `${player.stats.goals} G, ${player.stats.assists} A, ${player.stats.points} P`
                                }
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="ai-gm" className="m-0 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="border-fantasy-border bg-white">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-fantasy-primary/20 flex items-center justify-center">
                            <BarChart className="h-5 w-5 text-fantasy-primary" />
                          </div>
                          <h3 className="text-xl font-semibold text-fantasy-dark">AI GM Analysis</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg border border-fantasy-border bg-fantasy-light">
                            <h4 className="font-medium mb-2 text-fantasy-dark">Team Assessment</h4>
                            <p className="text-sm text-fantasy-muted">
                              Your team is well-balanced but could use more depth at the wing positions. 
                              Consider acquiring a top-tier winger to complement McDavid and Draisaitl.
                            </p>
                          </div>
                          
                          <div className="p-4 rounded-lg border border-fantasy-border bg-fantasy-light">
                            <h4 className="font-medium mb-2 text-fantasy-dark">Recommended Actions</h4>
                            <ul className="text-sm text-fantasy-muted space-y-2">
                              <li className="flex items-start gap-2">
                                <span className="text-fantasy-primary">•</span>
                                <span>Trade for a scoring winger using your excess defensive depth</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-fantasy-primary">•</span>
                                <span>Consider starting Shesterkin against upcoming opponent Toronto (favorable matchup)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-fantasy-primary">•</span>
                                <span>Monitor Tkachuk's PIM count - may impact your team's performance negatively</span>
                              </li>
                            </ul>
                          </div>

                          <div className="p-4 rounded-lg border border-fantasy-border bg-fantasy-light">
                            <h4 className="font-medium mb-2 text-fantasy-dark">Power Play Optimization</h4>
                            <p className="text-sm text-fantasy-muted">
                              Suggested PP1 unit: McDavid, Draisaitl, Pastrnak, Makar, and Kaprizov.
                              This combination maximizes one-timer opportunities from the left side.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-fantasy-border bg-white">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold text-fantasy-dark mb-4">Trade Finder</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>Target Position</span>
                            <Badge className="bg-fantasy-secondary">RW</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Available Assets</span>
                            <span className="font-medium">3</span>
                          </div>
                          <Button className="w-full bg-fantasy-primary hover:bg-fantasy-primary/90 text-white mt-2">
                            Find Trade Options
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-fantasy-border bg-white">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold text-fantasy-dark mb-4">Upcoming Schedule</h3>
                        <div className="space-y-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-fantasy-border hover:bg-fantasy-light transition-colors">
                              <div className="w-10 h-10 flex items-center justify-center bg-fantasy-primary/10 rounded-full">
                                <div className="text-xs font-medium">
                                  {i === 0 ? 'TUE' : i === 1 ? 'THU' : 'SAT'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">vs {i === 0 ? 'TOR' : i === 1 ? 'MTL' : 'BOS'}</div>
                                <div className="text-xs text-fantasy-muted">{i === 0 ? 'Home' : i === 1 ? 'Away' : 'Home'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Player Details Dialog */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
          {selectedPlayer && (
            <div>
              <div className="relative h-40 bg-gradient-to-r from-fantasy-primary to-fantasy-tertiary flex items-end overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant="outline" 
                    className={`font-bold px-3 py-1 ${selectedPlayer.starter ? 
                      'bg-fantasy-tertiary/90 text-white border-white/30' : 
                      'bg-fantasy-muted/50 text-white border-white/30'}`}
                  >
                    {selectedPlayer.starter ? 'Starter' : 'Bench'}
                  </Badge>
                </div>
                <div className="p-6 pb-0 flex items-end gap-4 relative z-10">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg translate-y-8 transition-transform duration-300 hover:scale-105">
                    <img 
                      src={selectedPlayer.image} 
                      alt={selectedPlayer.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="text-white mb-4">
                    <h2 className="text-2xl font-bold">{selectedPlayer.name}</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                        {selectedPlayer.position}
                      </Badge>
                      <span className="text-white/90">#{selectedPlayer.number}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-12">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="bg-fantasy-background w-full mb-6">
                    <TabsTrigger value="details" className="data-[state=active]:bg-fantasy-primary/20 data-[state=active]:text-fantasy-primary">
                      Player Details
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="data-[state=active]:bg-fantasy-primary/20 data-[state=active]:text-fantasy-primary">
                      Season Stats
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-fantasy-primary/20 data-[state=active]:text-fantasy-primary">
                      History
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Team:</span>
                          <span className="font-medium">{selectedPlayer.team}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Position:</span>
                          <span className="font-medium">{selectedPlayer.position}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Number:</span>
                          <span className="font-medium">#{selectedPlayer.number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Status:</span>
                          <span className="font-medium">{selectedPlayer.starter ? 'Starter' : 'Bench'}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Height:</span>
                          <span className="font-medium">{selectedPlayer.height}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Weight:</span>
                          <span className="font-medium">{selectedPlayer.weight}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Age:</span>
                          <span className="font-medium">{selectedPlayer.age}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fantasy-muted">Experience:</span>
                          <span className="font-medium">{selectedPlayer.experience}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {selectedPlayer.position === 'Goalie' ? (
                          <>
                            <Card className="bg-fantasy-light border-fantasy-border p-4">
                              <h4 className="text-sm text-fantasy-muted">Wins</h4>
                              <p className="text-2xl font-bold">{selectedPlayer.stats.wins}</p>
                            </Card>
                            <Card className="bg-fantasy-light border-fantasy-border p-4">
                              <h4 className="text-sm text-fantasy-muted">GAA</h4>
                              <p className="text-2xl font-bold">{selectedPlayer.stats.gaa}</p>
                            </Card>
                            <Card className="bg-fantasy-light border-fantasy-border p-4">
                              <h4 className="text-sm text-fantasy-muted">Save %</h4>
                              <p className="text-2xl font-bold">{selectedPlayer.stats.savePct}</p>
                            </Card>
                          </>
                        ) : (
                          <>
                            <Card className="bg-fantasy-light border-fantasy-border p-4">
                              <h4 className="text-sm text-fantasy-muted">Goals</h4>
                              <p className="text-2xl font-bold">{selectedPlayer.stats.goals}</p>
                            </Card>
                            <Card className="bg-fantasy-light border-fantasy-border p-4">
                              <h4 className="text-sm text-fantasy-muted">Assists</h4>
                              <p className="text-2xl font-bold">{selectedPlayer.stats.assists}</p>
                            </Card>
                            <Card className="bg-fantasy-light border-fantasy-border p-4">
                              <h4 className="text-sm text-fantasy-muted">Points</h4>
                              <p className="text-2xl font-bold">{selectedPlayer.stats.points}</p>
                            </Card>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-4 bg-fantasy-light p-4 rounded-md border border-fantasy-border">
                        <h4 className="text-sm text-fantasy-muted mb-2">Performance Trend</h4>
                        <div className="h-12 flex items-end gap-1">
                          {Array.from({length: 10}).map((_, i) => (
                            <div 
                              key={i} 
                              className="bg-gradient-to-t from-fantasy-primary to-fantasy-secondary rounded-sm"
                              style={{
                                height: `${Math.max(15, Math.random() * 100)}%`,
                                width: '8%'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history">
                    <div className="text-center py-4">
                      <p className="text-fantasy-muted">Player history data will be available after the season starts</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="border-t border-fantasy-border mt-6 pt-6 flex justify-between">
                  <Button variant="outline" size="sm" className="border-fantasy-muted text-fantasy-muted hover:bg-fantasy-light" onClick={() => setIsPlayerDialogOpen(false)}>
                    Close
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-fantasy-danger border-fantasy-danger/30 hover:bg-fantasy-danger/10">
                      Trade
                    </Button>
                    {!selectedPlayer.starter ? (
                      <Button size="sm" className="bg-fantasy-primary hover:bg-fantasy-primary/90 text-white">
                        Make Starter
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-fantasy-tertiary hover:bg-fantasy-tertiary/90 text-white">
                        Move to Bench
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roster;
