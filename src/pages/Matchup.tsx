import { useState, useEffect } from "react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from 'lucide-react';

type MatchupPlayerStatus = "In Game" | "Final" | "Yet to Play";

type MatchupPlayer = {
  id: number;
  name: string;
  position: string;
  team: string;
  points: number;
  gamesRemaining: number;
  status: MatchupPlayerStatus;
  isStarter: boolean;
};

const Matchup = () => {
  const [myTeam, setMyTeam] = useState<MatchupPlayer[]>([
    { id: 1, name: "Connor McDavid", position: "C", team: "EDM", points: 32.5, gamesRemaining: 2, status: "In Game", isStarter: true },
    { id: 2, name: "Leon Draisaitl", position: "C", team: "EDM", points: 28.2, gamesRemaining: 1, status: "Yet to Play", isStarter: true },
    { id: 3, name: "Auston Matthews", position: "C", team: "TOR", points: 25.7, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 4, name: "Nathan MacKinnon", position: "C", team: "COL", points: 22.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true },
    { id: 5, name: "David Pastrnak", position: "RW", team: "BOS", points: 21.4, gamesRemaining: 1, status: "In Game", isStarter: true },
    { id: 6, name: "Mikko Rantanen", position: "RW", team: "COL", points: 18.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true },
    { id: 7, name: "Kirill Kaprizov", position: "LW", team: "MIN", points: 17.5, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 8, name: "Alex Ovechkin", position: "LW", team: "WSH", points: 16.2, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 9, name: "Cale Makar", position: "D", team: "COL", points: 15.7, gamesRemaining: 2, status: "Yet to Play", isStarter: true },
    { id: 10, name: "Adam Fox", position: "D", team: "NYR", points: 13.8, gamesRemaining: 1, status: "In Game", isStarter: true },
    { id: 11, name: "Roman Josi", position: "D", team: "NSH", points: 11.5, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 12, name: "Victor Hedman", position: "D", team: "TBL", points: 10.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true },
    { id: 13, name: "Andrei Vasilevskiy", position: "G", team: "TBL", points: 24.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true },
    { id: 14, name: "Igor Shesterkin", position: "G", team: "NYR", points: 23.2, gamesRemaining: 1, status: "In Game", isStarter: true },
    { id: 15, name: "Matt Duchene", position: "C", team: "DAL", points: 8.5, gamesRemaining: 2, status: "Yet to Play", isStarter: false },
    { id: 16, name: "Mitch Marner", position: "RW", team: "TOR", points: 14.8, gamesRemaining: 0, status: "Final", isStarter: false },
    { id: 17, name: "Brady Tkachuk", position: "LW", team: "OTT", points: 12.3, gamesRemaining: 1, status: "Yet to Play", isStarter: false },
    { id: 18, name: "Quinn Hughes", position: "D", team: "VAN", points: 9.7, gamesRemaining: 2, status: "Yet to Play", isStarter: false },
    { id: 19, name: "Jacob Markstrom", position: "G", team: "CGY", points: 18.5, gamesRemaining: 0, status: "Final", isStarter: false },
  ]);

  const [opponentTeam, setOpponentTeam] = useState<MatchupPlayer[]>([
    { id: 101, name: "Sidney Crosby", position: "C", team: "PIT", points: 29.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true },
    { id: 102, name: "Nikita Kucherov", position: "RW", team: "TBL", points: 27.9, gamesRemaining: 1, status: "Yet to Play", isStarter: true },
    { id: 103, name: "Artemi Panarin", position: "LW", team: "NYR", points: 26.2, gamesRemaining: 1, status: "In Game", isStarter: true },
    { id: 104, name: "Brad Marchand", position: "LW", team: "BOS", points: 22.1, gamesRemaining: 1, status: "In Game", isStarter: true },
    { id: 105, name: "Elias Pettersson", position: "C", team: "VAN", points: 20.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true },
    { id: 106, name: "Jack Hughes", position: "C", team: "NJD", points: 19.5, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 107, name: "William Nylander", position: "RW", team: "TOR", points: 18.2, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 108, name: "Matthew Tkachuk", position: "RW", team: "FLA", points: 17.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true },
    { id: 109, name: "Brent Burns", position: "D", team: "CAR", points: 13.2, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 110, name: "Dougie Hamilton", position: "D", team: "NJD", points: 12.5, gamesRemaining: 0, status: "Final", isStarter: true },
    { id: 111, name: "Shea Theodore", position: "D", team: "VGK", points: 11.8, gamesRemaining: 1, status: "In Game", isStarter: true },
    { id: 112, name: "Moritz Seider", position: "D", team: "DET", points: 9.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true },
    { id: 113, name: "Connor Hellebuyck", position: "G", team: "WPG", points: 26.3, gamesRemaining: 2, status: "Yet to Play", isStarter: true },
    { id: 114, name: "Ilya Sorokin", position: "G", team: "NYI", points: 22.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true },
    { id: 115, name: "Tim Stützle", position: "C", team: "OTT", points: 10.4, gamesRemaining: 1, status: "Yet to Play", isStarter: false },
    { id: 116, name: "Cole Caufield", position: "RW", team: "MTL", points: 9.8, gamesRemaining: 0, status: "Final", isStarter: false },
    { id: 117, name: "Timo Meier", position: "LW", team: "NJD", points: 11.2, gamesRemaining: 0, status: "Final", isStarter: false },
    { id: 118, name: "Rasmus Dahlin", position: "D", team: "BUF", points: 10.1, gamesRemaining: 2, status: "Yet to Play", isStarter: false },
    { id: 119, name: "Juuse Saros", position: "G", team: "NSH", points: 17.6, gamesRemaining: 0, status: "Final", isStarter: false },
  ]);

  const [updates, setUpdates] = useState<string[]>([
    "Connor McDavid scored a goal! +5 points.",
    "David Pastrnak with an assist! +3 points.",
    "Igor Shesterkin made a save! +0.2 points.",
    "Adam Fox with a power play assist! +4 points."
  ]);

  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUpdateIndex(prev => (prev + 1) % updates.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [updates.length]);

  const getStatusColor = (status: MatchupPlayerStatus) => {
    switch (status) {
      case "In Game": return "bg-fantasy-secondary text-fantasy-dark animate-pulse";
      case "Final": return "bg-fantasy-muted/60 text-fantasy-dark";
      case "Yet to Play": return "bg-fantasy-light text-fantasy-dark";
      default: return "bg-fantasy-muted/60 text-fantasy-dark";
    }
  };

  const getTeamPoints = (team: MatchupPlayer[]) => {
    return team.reduce((sum, player) => sum + player.points, 0).toFixed(1);
  };

  const myTeamPoints = getTeamPoints(myTeam);
  const opponentTeamPoints = getTeamPoints(opponentTeam);

  const myStarters = myTeam.filter(p => p.isStarter);
  const myBench = myTeam.filter(p => !p.isStarter);
  const opponentStarters = opponentTeam.filter(p => p.isStarter);
  const opponentBench = opponentTeam.filter(p => !p.isStarter);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const myDailyPoints = [15.2, 22.8, 18.5, 29.1, 24.7, 30.2, 42.8];
  const opponentDailyPoints = [18.9, 20.4, 22.1, 22.5, 19.3, 26.8, 38.7];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-fantasy-light/30">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-fantasy-primary to-fantasy-secondary bg-clip-text text-transparent">
              This Week's Matchup
            </h1>
            <p className="text-lg text-fantasy-dark/80">
              Citrus Crushers vs. Thunder Titans
            </p>
          </div>
          
          <Card className="mb-8 overflow-hidden border-fantasy-border shadow-lg animate-fade-in">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-br from-fantasy-light via-white to-fantasy-light p-8 border-b border-fantasy-border">
                <div className="flex flex-col items-center md:items-start mb-4 md:mb-0 transition-all hover:scale-105">
                  <div className="text-sm text-fantasy-muted mb-1 uppercase tracking-wider">Your Team</div>
                  <div className="text-3xl font-bold text-fantasy-primary">Citrus Crushers</div>
                  <div className="text-fantasy-muted mt-1 flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-positive/10 text-fantasy-positive text-xs font-bold">7</span>
                    <span className="text-fantasy-muted">-</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-danger/10 text-fantasy-danger text-xs font-bold">3</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 py-4 px-8 rounded-full bg-white shadow-md transition-transform hover:scale-105">
                  <div className="text-5xl font-bold bg-gradient-to-r from-fantasy-primary to-fantasy-secondary bg-clip-text text-transparent">{myTeamPoints}</div>
                  <div className="text-2xl text-fantasy-muted">vs</div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-fantasy-dark to-fantasy-muted bg-clip-text text-transparent">{opponentTeamPoints}</div>
                </div>
                
                <div className="flex flex-col items-center md:items-end mt-4 md:mt-0 transition-all hover:scale-105">
                  <div className="text-sm text-fantasy-muted mb-1 uppercase tracking-wider">Opponent</div>
                  <div className="text-3xl font-bold text-fantasy-dark">Thunder Titans</div>
                  <div className="text-fantasy-muted mt-1 flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-positive/10 text-fantasy-positive text-xs font-bold">9</span>
                    <span className="text-fantasy-muted">-</span>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fantasy-danger/10 text-fantasy-danger text-xs font-bold">1</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white/50 backdrop-blur-sm">
                <div className="text-sm font-medium mb-3 text-fantasy-dark/70">Week Progress</div>
                <div className="flex gap-4 items-center">
                  <div className="text-xs font-medium text-fantasy-primary">Mon</div>
                  <Progress 
                    value={70} 
                    className="h-3 flex-1 rounded-full overflow-hidden border border-fantasy-border/20" 
                    indicatorClassName="bg-gradient-to-r from-fantasy-primary to-fantasy-secondary"
                  />
                  <div className="text-xs font-medium text-fantasy-primary">Sun</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="lineup" className="mb-8 animate-fade-in">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 bg-white border border-fantasy-border/20 rounded-full p-1">
              <TabsTrigger value="lineup" className="rounded-full data-[state=active]:bg-fantasy-primary data-[state=active]:text-white">Lineup</TabsTrigger>
              <TabsTrigger value="dailyPoints" className="rounded-full data-[state=active]:bg-fantasy-primary data-[state=active]:text-white">Daily Points</TabsTrigger>
              <TabsTrigger value="matchupHistory" className="rounded-full data-[state=active]:bg-fantasy-primary data-[state=active]:text-white">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lineup" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-fantasy-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-fantasy-primary/10 to-fantasy-primary/5 py-4">
                    <CardTitle className="text-center text-fantasy-primary">My Team</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-fantasy-border bg-white">
                      <h3 className="text-sm font-medium text-fantasy-muted mb-2">Starters</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Position</TableHead>
                            <TableHead className="min-w-[200px]">Player</TableHead>
                            <TableHead className="text-right w-[80px]">Pts</TableHead>
                            <TableHead className="text-right w-[100px]">Games Left</TableHead>
                            <TableHead className="text-center w-[120px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {myStarters.map(player => (
                            <TableRow key={player.id}>
                              <TableCell className="font-medium">{player.position}</TableCell>
                              <TableCell>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-xs text-fantasy-muted">{player.team}</div>
                              </TableCell>
                              <TableCell className="text-right">{player.points}</TableCell>
                              <TableCell className="text-right">{player.gamesRemaining}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={getStatusColor(player.status)}>
                                  {player.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {myBench.length > 0 && (
                      <div className="p-4 bg-fantasy-light/50">
                        <h3 className="text-sm font-medium text-fantasy-muted mb-2">Bench</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Position</TableHead>
                              <TableHead className="min-w-[200px]">Player</TableHead>
                              <TableHead className="text-right w-[80px]">Pts</TableHead>
                              <TableHead className="text-right w-[100px]">Games Left</TableHead>
                              <TableHead className="text-center w-[120px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {myBench.map(player => (
                              <TableRow key={player.id}>
                                <TableCell className="font-medium">{player.position}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{player.name}</div>
                                  <div className="text-xs text-fantasy-muted">{player.team}</div>
                                </TableCell>
                                <TableCell className="text-right">{player.points}</TableCell>
                                <TableCell className="text-right">{player.gamesRemaining}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getStatusColor(player.status)}>
                                    {player.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="border-fantasy-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-fantasy-dark/10 to-fantasy-dark/5 py-4">
                    <CardTitle className="text-center text-fantasy-dark">Opponent's Team</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-fantasy-border bg-white">
                      <h3 className="text-sm font-medium text-fantasy-muted mb-2">Starters</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Position</TableHead>
                            <TableHead className="min-w-[200px]">Player</TableHead>
                            <TableHead className="text-right w-[80px]">Pts</TableHead>
                            <TableHead className="text-right w-[100px]">Games Left</TableHead>
                            <TableHead className="text-center w-[120px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {opponentStarters.map(player => (
                            <TableRow key={player.id}>
                              <TableCell className="font-medium">{player.position}</TableCell>
                              <TableCell>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-xs text-fantasy-muted">{player.team}</div>
                              </TableCell>
                              <TableCell className="text-right">{player.points}</TableCell>
                              <TableCell className="text-right">{player.gamesRemaining}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={getStatusColor(player.status)}>
                                  {player.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {opponentBench.length > 0 && (
                      <div className="p-4 bg-fantasy-light/50">
                        <h3 className="text-sm font-medium text-fantasy-muted mb-2">Bench</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Position</TableHead>
                              <TableHead className="min-w-[200px]">Player</TableHead>
                              <TableHead className="text-right w-[80px]">Pts</TableHead>
                              <TableHead className="text-right w-[100px]">Games Left</TableHead>
                              <TableHead className="text-center w-[120px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {opponentBench.map(player => (
                              <TableRow key={player.id}>
                                <TableCell className="font-medium">{player.position}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{player.name}</div>
                                  <div className="text-xs text-fantasy-muted">{player.team}</div>
                                </TableCell>
                                <TableCell className="text-right">{player.points}</TableCell>
                                <TableCell className="text-right">{player.gamesRemaining}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getStatusColor(player.status)}>
                                    {player.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="dailyPoints" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Points Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {dayLabels.map((day, index) => (
                      <div key={day} className="text-center">
                        <div className="bg-fantasy-light rounded-t-md py-1 text-xs font-medium">
                          {day}
                        </div>
                        <div className="flex flex-col">
                          <div className="h-[100px] bg-fantasy-primary/20 relative">
                            <div 
                              className="absolute bottom-0 left-0 right-0 bg-fantasy-primary"
                              style={{ height: `${(myDailyPoints[index] / 50) * 100}%` }}
                            ></div>
                            <div className="absolute bottom-1 left-0 right-0 text-xs text-white font-bold">
                              {myDailyPoints[index]}
                            </div>
                          </div>
                          <div className="h-[100px] bg-fantasy-muted/20 relative">
                            <div 
                              className="absolute bottom-0 left-0 right-0 bg-fantasy-muted"
                              style={{ height: `${(opponentDailyPoints[index] / 50) * 100}%` }}
                            ></div>
                            <div className="absolute bottom-1 left-0 right-0 text-xs text-white font-bold">
                              {opponentDailyPoints[index]}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center gap-8">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-fantasy-primary mr-2"></div>
                      <span className="text-sm">My Team</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-fantasy-muted mr-2"></div>
                      <span className="text-sm">Opponent</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="matchupHistory" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Matchup History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-fantasy-light rounded-md">
                      <div>
                        <span className="block text-sm mb-1">Week 4, 2024</span>
                        <div className="flex items-center">
                          <span className="font-medium">Citrus Crushers</span>
                          <span className="mx-2 text-fantasy-positive font-bold">W</span>
                          <span>148-132</span>
                        </div>
                      </div>
                      <div className="text-fantasy-muted">vs. Thunder Titans</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-fantasy-light rounded-md">
                      <div>
                        <span className="block text-sm mb-1">Week 11, 2023</span>
                        <div className="flex items-center">
                          <span className="font-medium">Citrus Crushers</span>
                          <span className="mx-2 text-fantasy-danger font-bold">L</span>
                          <span>118-135</span>
                        </div>
                      </div>
                      <div className="text-fantasy-muted">vs. Thunder Titans</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-fantasy-light rounded-md">
                      <div>
                        <span className="block text-sm mb-1">Week 2, 2023</span>
                        <div className="flex items-center">
                          <span className="font-medium">Citrus Crushers</span>
                          <span className="mx-2 text-fantasy-positive font-bold">W</span>
                          <span>157-145</span>
                        </div>
                      </div>
                      <div className="text-fantasy-muted">vs. Thunder Titans</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center bg-fantasy-light rounded-lg p-2">
                      <div className="px-3 py-1 text-center">
                        <div className="text-xl font-bold">2</div>
                        <div className="text-xs text-fantasy-muted">WINS</div>
                      </div>
                      <div className="px-3 py-1 border-l border-r border-fantasy-border text-center">
                        <div className="text-xl font-bold">1</div>
                        <div className="text-xs text-fantasy-muted">LOSS</div>
                      </div>
                      <div className="px-3 py-1 text-center">
                        <div className="text-xl font-bold">66%</div>
                        <div className="text-xs text-fantasy-muted">WIN RATE</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-fantasy-primary/90 to-fantasy-secondary/90 text-white py-3 backdrop-blur-md">
            <div className="container mx-auto flex items-center justify-center">
              <div className="animate-bounce mr-2">⚡</div>
              <div className="text-sm font-medium animate-fade-in">{updates[currentUpdateIndex]}</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Matchup;
