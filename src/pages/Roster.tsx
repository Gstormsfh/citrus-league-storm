
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StarIcon, Star } from 'lucide-react';

// Enhanced player data with starter status and more details
const players = [
  {
    id: 1,
    name: 'James Wilson',
    position: 'QB',
    number: 12,
    starter: true,
    stats: { passing: 3240, touchdowns: 28, interceptions: 7 },
    team: 'Arizona Cardinals',
    college: 'Ohio State',
    height: '6\'2"',
    weight: '220 lbs',
    age: 27,
    experience: '5 years',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    position: 'RB',
    number: 23,
    starter: true,
    stats: { rushing: 1120, touchdowns: 9, fumbles: 2 },
    team: 'Los Angeles Rams',
    college: 'Alabama',
    height: '5\'11"',
    weight: '215 lbs',
    age: 25,
    experience: '3 years',
    image: 'https://images.unsplash.com/photo-1580064003896-8eba6fc5435f?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 3,
    name: 'Tyler Martinez',
    position: 'WR',
    number: 84,
    starter: true,
    stats: { receiving: 1050, touchdowns: 11, receptions: 87 },
    team: 'San Francisco 49ers',
    college: 'Michigan',
    height: '6\'1"',
    weight: '198 lbs',
    age: 26,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1574883052806-413e0927a4d7?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 4,
    name: 'Darius Smith',
    position: 'TE',
    number: 87,
    starter: true,
    stats: { receiving: 780, touchdowns: 6, receptions: 62 },
    team: 'Seattle Seahawks',
    college: 'Notre Dame',
    height: '6\'5"',
    weight: '250 lbs',
    age: 28,
    experience: '5 years',
    image: 'https://images.unsplash.com/photo-1627037558426-c2d07beda3af?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Jordan Williams',
    position: 'LB',
    number: 55,
    starter: true,
    stats: { tackles: 112, sacks: 7, interceptions: 1 },
    team: 'Philadelphia Eagles',
    college: 'Penn State',
    height: '6\'3"',
    weight: '245 lbs',
    age: 27,
    experience: '4 years',
    image: 'https://images.unsplash.com/photo-1580652870699-ae85c08a1ace?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 6,
    name: 'Michael Taylor',
    position: 'CB',
    number: 27,
    starter: true,
    stats: { tackles: 64, interceptions: 4, passDefended: 12 },
    team: 'New England Patriots',
    college: 'LSU',
    height: '6\'0"',
    weight: '195 lbs',
    age: 24,
    experience: '2 years',
    image: 'https://images.unsplash.com/photo-1527861518817-93eef51df1c6?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 7,
    name: 'David Roberts',
    position: 'QB',
    number: 11,
    starter: false,
    stats: { passing: 875, touchdowns: 5, interceptions: 3 },
    team: 'Arizona Cardinals',
    college: 'Clemson',
    height: '6\'3"',
    weight: '225 lbs',
    age: 24,
    experience: '2 years',
    image: 'https://images.unsplash.com/photo-1565035010268-a3816f98589a?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 8,
    name: 'Chris Nelson',
    position: 'RB',
    number: 28,
    starter: false,
    stats: { rushing: 450, touchdowns: 3, fumbles: 1 },
    team: 'Los Angeles Rams',
    college: 'Auburn',
    height: '5\'10"',
    weight: '205 lbs',
    age: 23,
    experience: '1 year',
    image: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?q=80&w=200&auto=format&fit=crop'
  },
  {
    id: 9,
    name: 'Kevin Jones',
    position: 'WR',
    number: 18,
    starter: false,
    stats: { receiving: 425, touchdowns: 3, receptions: 32 },
    team: 'San Francisco 49ers',
    college: 'Florida State',
    height: '6\'0"',
    weight: '192 lbs',
    age: 25,
    experience: '2 years',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'
  },
];

const Roster = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<typeof players[0] | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);

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

  // Filter starters and bench players
  const starters = players.filter(player => player.starter);
  const benchPlayers = players.filter(player => !player.starter);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 citrus-gradient-text">Team Roster</h1>
            <p className="text-lg text-muted-foreground">Manage your fantasy team's lineup and track player performance.</p>
          </div>

          <Tabs defaultValue="offense" className="w-full max-w-5xl mx-auto mb-12">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8 bg-muted">
              <TabsTrigger value="offense">Offense</TabsTrigger>
              <TabsTrigger value="defense">Defense</TabsTrigger>
              <TabsTrigger value="special">Special Teams</TabsTrigger>
            </TabsList>
            
            <TabsContent value="offense" className="space-y-8">
              <div className="rounded-lg border shadow-sm">
                <div className="p-4 bg-muted/30">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    Starters
                  </h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Key Stat</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {starters.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position)).map((player) => (
                      <TableRow key={player.id} className="animated-element hover:bg-muted/50 cursor-pointer" onClick={() => handlePlayerClick(player)}>
                        <TableCell className="font-medium">{player.number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                              <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold bg-primary/10 text-primary">
                            {player.position}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {player.position === 'QB' && `${player.stats.passing} yds, ${player.stats.touchdowns} TD`}
                          {player.position === 'RB' && `${player.stats.rushing} yds, ${player.stats.touchdowns} TD`}
                          {player.position === 'WR' && `${player.stats.receiving} yds, ${player.stats.receptions} rec`}
                          {player.position === 'TE' && `${player.stats.receiving} yds, ${player.stats.receptions} rec`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => {
                            e.stopPropagation();
                            handlePlayerClick(player);
                          }}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-lg border shadow-sm">
                <div className="p-4 bg-muted/30">
                  <h2 className="text-xl font-bold">Bench</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Key Stat</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benchPlayers.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position)).map((player) => (
                      <TableRow key={player.id} className="animated-element hover:bg-muted/50 cursor-pointer" onClick={() => handlePlayerClick(player)}>
                        <TableCell className="font-medium">{player.number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                              <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold bg-muted/50">
                            {player.position}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {player.position === 'QB' && `${player.stats.passing} yds, ${player.stats.touchdowns} TD`}
                          {player.position === 'RB' && `${player.stats.rushing} yds, ${player.stats.touchdowns} TD`}
                          {player.position === 'WR' && `${player.stats.receiving} yds, ${player.stats.receptions} rec`}
                          {player.position === 'TE' && `${player.stats.receiving} yds, ${player.stats.receptions} rec`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => {
                            e.stopPropagation();
                            handlePlayerClick(player);
                          }}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="text-center animated-element">
                <Button className="btn-vibrant-purple">Add Player</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="defense" className="space-y-8">
              <div className="rounded-lg border shadow-sm">
                <div className="p-4 bg-muted/30">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    Starters
                  </h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Key Stat</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {starters.filter(p => ['LB', 'CB'].includes(p.position)).map((player) => (
                      <TableRow key={player.id} className="animated-element hover:bg-muted/50 cursor-pointer" onClick={() => handlePlayerClick(player)}>
                        <TableCell className="font-medium">{player.number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                              <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold bg-[hsl(var(--vibrant-blue))]/10 text-[hsl(var(--vibrant-blue))]">
                            {player.position}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {player.position === 'LB' && `${player.stats.tackles} tackles, ${player.stats.sacks} sacks`}
                          {player.position === 'CB' && `${player.stats.tackles} tackles, ${player.stats.interceptions} INT`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => {
                            e.stopPropagation();
                            handlePlayerClick(player);
                          }}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="text-center animated-element">
                <Button className="btn-vibrant-blue">Add Defender</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="special" className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-6 animated-element">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium">No Special Teams Players Yet</h3>
                <p className="text-muted-foreground max-w-md">Add kickers, punters, and return specialists to enhance your team's special teams unit.</p>
                <Button className="btn-vibrant-orange mt-4">Add Special Teams Player</Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="bg-muted/30 rounded-xl p-6 max-w-5xl mx-auto animated-element">
            <h2 className="text-2xl font-bold mb-4">Team Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-2">Current Rank</h3>
                <p className="text-3xl font-bold text-green-700">#3</p>
                <p className="text-sm text-green-600 mt-1">Up from #5 last week</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <h3 className="text-lg font-medium text-amber-800 mb-2">Points Scored</h3>
                <p className="text-3xl font-bold text-amber-700">1,247</p>
                <p className="text-sm text-amber-600 mt-1">Avg 124.7 per week</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Record</h3>
                <p className="text-3xl font-bold text-blue-700">7-3</p>
                <p className="text-sm text-blue-600 mt-1">70% win rate</p>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Player Detail Dialog */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          {selectedPlayer && (
            <div>
              <div className="relative h-40 bg-gradient-to-r from-primary/80 to-accent/80 flex items-end">
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant="outline" 
                    className={`font-bold px-3 py-1 ${selectedPlayer.starter ? 
                      'bg-amber-100 text-amber-800 border-amber-300' : 
                      'bg-blue-100 text-blue-800 border-blue-300'}`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Player Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Team:</span>
                        <span className="font-medium">{selectedPlayer.team}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">College:</span>
                        <span className="font-medium">{selectedPlayer.college}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Height:</span>
                        <span className="font-medium">{selectedPlayer.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="font-medium">{selectedPlayer.weight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{selectedPlayer.age}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Experience:</span>
                        <span className="font-medium">{selectedPlayer.experience}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Season Stats</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedPlayer.stats).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border mt-6 pt-6 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setIsPlayerDialogOpen(false)}>Close</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Trade</Button>
                    {!selectedPlayer.starter ? (
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600">Make Starter</Button>
                    ) : (
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">Move to Bench</Button>
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
