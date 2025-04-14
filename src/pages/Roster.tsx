
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronDown, ChevronRight, Star as StarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced player data with hockey positions
const players = [
  {
    id: 1,
    name: 'Connor McDavid',
    position: 'Centre',
    number: 97,
    starter: true,
    stats: { goals: 44, assists: 89, points: 133 },
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
    stats: { goals: 41, assists: 64, points: 105 },
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
    stats: { goals: 51, assists: 89, points: 140 },
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
    stats: { goals: 47, assists: 63, points: 110 },
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
    stats: { goals: 40, assists: 64, points: 104 },
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
    stats: { goals: 26, assists: 59, points: 85 },
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
    stats: { goals: 39, assists: 57, points: 96 },
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
    stats: { goals: 26, assists: 61, points: 87 },
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
    stats: { goals: 29, assists: 50, points: 79 },
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
    stats: { goals: 21, assists: 62, points: 83 },
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
    stats: { goals: 18, assists: 67, points: 85 },
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
    stats: { goals: 13, assists: 62, points: 75 },
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
    stats: { wins: 30, gaa: 2.50, savePct: 0.915 },
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
    stats: { wins: 36, gaa: 2.58, savePct: 0.913 },
    team: 'New York Rangers',
    height: '6\'2"',
    weight: '182 lbs',
    age: 28,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1561731172-9d906d7b13ad?q=80&w=200&auto=format&fit=crop'
  },
];

const Roster = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<typeof players[0] | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [expandedPositions, setExpandedPositions] = useState<Record<string, boolean>>({
    'Centre': true,
    'Right Wing': true,
    'Left Wing': true,
    'Defence': true,
    'Goalie': true
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.animated-element');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const handlePlayerClick = (player: typeof players[0]) => {
    setSelectedPlayer(player);
    setIsPlayerDialogOpen(true);
  };

  const togglePositionExpand = (position: string) => {
    setExpandedPositions(prev => ({
      ...prev,
      [position]: !prev[position]
    }));
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

  // Order of positions
  const positionOrder = ['Centre', 'Right Wing', 'Left Wing', 'Defence', 'Goalie'];

  return (
    <div className="min-h-screen bg-[#121820] text-white">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#33C3F0] via-[#9b87f5] to-[#7E69AB] inline-block text-transparent bg-clip-text">Team Roster</h1>
            <p className="text-lg text-[#8E9196]">Premium hockey team management with real-time player stats and lineup optimization.</p>
          </div>

          <div className="bg-[#1A1F2C]/70 rounded-lg border border-[#33C3F0]/20 backdrop-blur-sm shadow-lg max-w-5xl mx-auto mb-8">
            <div className="p-6 border-b border-[#33C3F0]/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">2024-2025 Season Roster</h2>
                <div className="flex items-center gap-3">
                  <Badge className="bg-[#33C3F0] text-white">
                    {players.filter(p => p.starter).length} Starters
                  </Badge>
                  <Badge className="bg-[#1A1F2C] text-[#8E9196] border border-[#8E9196]/30">
                    {players.filter(p => !p.starter).length} Bench
                  </Badge>
                </div>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-350px)] p-4">
              <div className="space-y-6 p-2">
                {positionOrder.map(position => (
                  <Card key={position} className="bg-[#221F26] border-[#33C3F0]/10">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => togglePositionExpand(position)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedPositions[position] ? 
                          <ChevronDown className="h-5 w-5 text-[#33C3F0]" /> : 
                          <ChevronRight className="h-5 w-5 text-[#33C3F0]" />}
                        <h3 className="text-xl font-semibold text-white">{position}</h3>
                        <Badge variant="outline" className="ml-2 bg-[#1A1F2C] border-[#33C3F0]/30 text-[#33C3F0]">
                          {positionGroups[position]?.length || 0}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-[#1A1F2C]/50 border-[#8E9196]/20 text-[#8E9196]">
                          {positionGroups[position]?.filter(p => p.starter).length || 0} Active
                        </Badge>
                      </div>
                    </div>
                    
                    {expandedPositions[position] && positionGroups[position] && (
                      <div className="px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-[#33C3F0]/10 hover:bg-[#1A1F2C]/30">
                              <TableHead className="w-12 text-[#8E9196]">No.</TableHead>
                              <TableHead className="text-[#8E9196]">Player</TableHead>
                              <TableHead className="text-[#8E9196]">Status</TableHead>
                              <TableHead className="text-[#8E9196]">Key Stats</TableHead>
                              <TableHead className="text-right text-[#8E9196]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {positionGroups[position].map((player) => (
                              <TableRow 
                                key={player.id} 
                                className={`animated-element border-[#33C3F0]/10 hover:bg-[#1A1F2C] cursor-pointer ${player.starter ? 'bg-[#1A1F2C]/30' : ''}`} 
                                onClick={() => handlePlayerClick(player)}
                              >
                                <TableCell className="font-medium text-white">{player.number}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#33C3F0]/30 to-[#9b87f5]/30 p-0.5">
                                      <img 
                                        src={player.image} 
                                        alt={player.name} 
                                        className="h-full w-full object-cover rounded-full" 
                                      />
                                    </div>
                                    <div>
                                      <span className="font-medium text-white">{player.name}</span>
                                      <div className="text-xs text-[#8E9196]">{player.team}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {player.starter ? (
                                    <div className="flex items-center">
                                      <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1.5" />
                                      <span className="text-amber-400">Starter</span>
                                    </div>
                                  ) : (
                                    <span className="text-[#8E9196] text-sm">Bench</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {position === 'Goalie' ? (
                                    <span className="text-[#aaadb0]">
                                      {player.stats.wins}W, {player.stats.gaa} GAA, {player.stats.savePct} SV%
                                    </span>
                                  ) : (
                                    <span className="text-[#aaadb0]">
                                      {player.stats.goals}G, {player.stats.assists}A, {player.stats.points}P
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    size="sm" 
                                    className="bg-[#1A1F2C] hover:bg-[#33C3F0]/20 text-[#33C3F0] border border-[#33C3F0]/30"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayerClick(player);
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 bg-gradient-to-br from-[#1A1F2C] to-[#221F26] border-[#33C3F0]/20">
              <h3 className="text-lg font-medium text-[#33C3F0] mb-2">Team Ranking</h3>
              <p className="text-3xl font-bold text-white">#3</p>
              <p className="text-sm text-[#8E9196] mt-1">Up from #5 last week</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#1A1F2C] to-[#221F26] border-[#33C3F0]/20">
              <h3 className="text-lg font-medium text-[#9b87f5] mb-2">Goals Scored</h3>
              <p className="text-3xl font-bold text-white">247</p>
              <p className="text-sm text-[#8E9196] mt-1">Avg 3.1 per game</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#1A1F2C] to-[#221F26] border-[#33C3F0]/20">
              <h3 className="text-lg font-medium text-[#7E69AB] mb-2">Record</h3>
              <p className="text-3xl font-bold text-white">42-22-8</p>
              <p className="text-sm text-[#8E9196] mt-1">92 points</p>
            </Card>
          </div>

          <div className="max-w-5xl mx-auto mt-10 flex justify-center gap-4">
            <Button className="bg-[#33C3F0] hover:bg-[#33C3F0]/80 text-white">Add Player</Button>
            <Button variant="outline" className="border-[#33C3F0]/30 text-[#33C3F0] hover:bg-[#33C3F0]/10">Export Roster</Button>
          </div>
        </div>
      </main>
      <Footer />

      {/* Player Detail Dialog */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-[#1A1F2C] border-[#33C3F0]/20 text-white">
          {selectedPlayer && (
            <div>
              <div className="relative h-40 bg-gradient-to-r from-[#33C3F0]/80 to-[#9b87f5]/80 flex items-end">
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant="outline" 
                    className={`font-bold px-3 py-1 ${selectedPlayer.starter ? 
                      'bg-amber-900/50 text-amber-200 border-amber-700/50' : 
                      'bg-[#1A1F2C]/50 text-[#8E9196] border-[#8E9196]/30'}`}
                  >
                    {selectedPlayer.starter ? 'Starter' : 'Bench'}
                  </Badge>
                </div>
                <div className="p-6 pb-0 flex items-end gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg translate-y-8">
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
                  <TabsList className="bg-[#221F26] w-full mb-6">
                    <TabsTrigger value="details" className="data-[state=active]:bg-[#33C3F0]/20 data-[state=active]:text-[#33C3F0]">Player Details</TabsTrigger>
                    <TabsTrigger value="stats" className="data-[state=active]:bg-[#33C3F0]/20 data-[state=active]:text-[#33C3F0]">Season Stats</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-[#33C3F0]/20 data-[state=active]:text-[#33C3F0]">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Team:</span>
                          <span className="font-medium text-white">{selectedPlayer.team}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Position:</span>
                          <span className="font-medium text-white">{selectedPlayer.position}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Number:</span>
                          <span className="font-medium text-white">#{selectedPlayer.number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Status:</span>
                          <span className="font-medium text-white">{selectedPlayer.starter ? 'Starter' : 'Bench'}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Height:</span>
                          <span className="font-medium text-white">{selectedPlayer.height}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Weight:</span>
                          <span className="font-medium text-white">{selectedPlayer.weight}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Age:</span>
                          <span className="font-medium text-white">{selectedPlayer.age}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#8E9196]">Experience:</span>
                          <span className="font-medium text-white">{selectedPlayer.experience}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stats">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {selectedPlayer.position === 'Goalie' ? (
                          <>
                            <Card className="bg-[#221F26] border-[#33C3F0]/20 p-4">
                              <h4 className="text-sm text-[#8E9196]">Wins</h4>
                              <p className="text-2xl font-bold text-white">{selectedPlayer.stats.wins}</p>
                            </Card>
                            <Card className="bg-[#221F26] border-[#33C3F0]/20 p-4">
                              <h4 className="text-sm text-[#8E9196]">GAA</h4>
                              <p className="text-2xl font-bold text-white">{selectedPlayer.stats.gaa}</p>
                            </Card>
                            <Card className="bg-[#221F26] border-[#33C3F0]/20 p-4">
                              <h4 className="text-sm text-[#8E9196]">Save %</h4>
                              <p className="text-2xl font-bold text-white">{selectedPlayer.stats.savePct}</p>
                            </Card>
                          </>
                        ) : (
                          <>
                            <Card className="bg-[#221F26] border-[#33C3F0]/20 p-4">
                              <h4 className="text-sm text-[#8E9196]">Goals</h4>
                              <p className="text-2xl font-bold text-white">{selectedPlayer.stats.goals}</p>
                            </Card>
                            <Card className="bg-[#221F26] border-[#33C3F0]/20 p-4">
                              <h4 className="text-sm text-[#8E9196]">Assists</h4>
                              <p className="text-2xl font-bold text-white">{selectedPlayer.stats.assists}</p>
                            </Card>
                            <Card className="bg-[#221F26] border-[#33C3F0]/20 p-4">
                              <h4 className="text-sm text-[#8E9196]">Points</h4>
                              <p className="text-2xl font-bold text-white">{selectedPlayer.stats.points}</p>
                            </Card>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-4 bg-[#221F26] p-4 rounded-md border border-[#33C3F0]/10">
                        <h4 className="text-sm text-[#8E9196] mb-2">Performance Trend</h4>
                        <div className="h-12 flex items-end gap-1">
                          {Array.from({length: 10}).map((_, i) => (
                            <div 
                              key={i} 
                              className="bg-gradient-to-t from-[#33C3F0] to-[#9b87f5] rounded-sm"
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
                      <p className="text-[#8E9196]">Player history data will be available after the season starts</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="border-t border-[#33C3F0]/20 mt-6 pt-6 flex justify-between">
                  <Button variant="outline" size="sm" className="border-[#8E9196]/30 text-[#8E9196] hover:bg-[#221F26]" onClick={() => setIsPlayerDialogOpen(false)}>Close</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-red-400 border-red-500/30 hover:bg-red-500/10">Trade</Button>
                    {!selectedPlayer.starter ? (
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Make Starter</Button>
                    ) : (
                      <Button size="sm" className="bg-[#33C3F0] hover:bg-[#33C3F0]/80">Move to Bench</Button>
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
