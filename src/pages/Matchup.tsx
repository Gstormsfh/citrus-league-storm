
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Matchup = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 vibrant-gradient-2 bg-clip-text text-transparent">
              Week 11 Matchup
            </h1>
            <p className="text-lg text-muted-foreground">
              Your Citrus Crushers vs. Touchdown Titans
            </p>
          </div>
          
          <div className="bg-card border rounded-xl shadow-md p-6 mb-8 animated-element">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full overflow-hidden mb-2">
                  <img src="https://images.unsplash.com/photo-1617777938240-9a1d8e3ba07c?q=80&w=400&auto=format&fit=crop" alt="Your Team" className="h-full w-full object-cover" />
                </div>
                <h3 className="text-lg font-bold">Citrus Crushers</h3>
                <p className="text-muted-foreground text-sm">You (7-3)</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">87</div>
                  <div className="text-xs text-muted-foreground">PROJECTED</div>
                </div>
                <div className="text-lg font-bold">VS</div>
                <div className="text-center">
                  <div className="text-3xl font-bold">82</div>
                  <div className="text-xs text-muted-foreground">PROJECTED</div>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full overflow-hidden mb-2">
                  <img src="https://images.unsplash.com/photo-1606131731446-5568d87113aa?q=80&w=400&auto=format&fit=crop" alt="Opponent Team" className="h-full w-full object-cover" />
                </div>
                <h3 className="text-lg font-bold">Touchdown Titans</h3>
                <p className="text-muted-foreground text-sm">Alex Johnson (9-1)</p>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">Matchup Chance:</span>
                  </div>
                  <div className="text-sm font-medium">58% - 42%</div>
                </div>
                <div className="h-2 bg-muted mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '58%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="lineups" className="mb-8 animated-element">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
              <TabsTrigger value="lineups">Lineups</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="matchups">Matchups</TabsTrigger>
            </TabsList>
            <TabsContent value="lineups" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Lineup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <PlayerLineupItem 
                        position="QB" 
                        name="Patrick Mahomes" 
                        team="KC" 
                        opponent="vs LV" 
                        projection={24.5} 
                      />
                      <PlayerLineupItem 
                        position="RB" 
                        name="Christian McCaffrey" 
                        team="SF" 
                        opponent="vs SEA" 
                        projection={18.7} 
                      />
                      <PlayerLineupItem 
                        position="RB" 
                        name="Saquon Barkley" 
                        team="PHI" 
                        opponent="@ DAL" 
                        projection={16.3} 
                      />
                      <PlayerLineupItem 
                        position="WR" 
                        name="Justin Jefferson" 
                        team="MIN" 
                        opponent="vs DET" 
                        projection={21.2} 
                      />
                      <PlayerLineupItem 
                        position="WR" 
                        name="CeeDee Lamb" 
                        team="DAL" 
                        opponent="vs PHI" 
                        projection={19.8} 
                      />
                      <PlayerLineupItem 
                        position="TE" 
                        name="Travis Kelce" 
                        team="KC" 
                        opponent="vs LV" 
                        projection={14.3} 
                      />
                      <PlayerLineupItem 
                        position="FLEX" 
                        name="DeVonta Smith" 
                        team="PHI" 
                        opponent="@ DAL" 
                        projection={13.1} 
                      />
                      <PlayerLineupItem 
                        position="D/ST" 
                        name="49ers" 
                        team="SF" 
                        opponent="vs SEA" 
                        projection={8.2} 
                      />
                      <PlayerLineupItem 
                        position="K" 
                        name="Justin Tucker" 
                        team="BAL" 
                        opponent="@ PIT" 
                        projection={8.4} 
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">144.5 pts</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Opponent's Lineup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <PlayerLineupItem 
                        position="QB" 
                        name="Josh Allen" 
                        team="BUF" 
                        opponent="vs MIA" 
                        projection={22.1} 
                      />
                      <PlayerLineupItem 
                        position="RB" 
                        name="Derrick Henry" 
                        team="BAL" 
                        opponent="@ PIT" 
                        projection={17.2} 
                      />
                      <PlayerLineupItem 
                        position="RB" 
                        name="Breece Hall" 
                        team="NYJ" 
                        opponent="vs NE" 
                        projection={14.8} 
                      />
                      <PlayerLineupItem 
                        position="WR" 
                        name="Tyreek Hill" 
                        team="MIA" 
                        opponent="@ BUF" 
                        projection={20.5} 
                      />
                      <PlayerLineupItem 
                        position="WR" 
                        name="Amon-Ra St. Brown" 
                        team="DET" 
                        opponent="@ MIN" 
                        projection={18.9} 
                      />
                      <PlayerLineupItem 
                        position="TE" 
                        name="Mark Andrews" 
                        team="BAL" 
                        opponent="@ PIT" 
                        projection={12.7} 
                      />
                      <PlayerLineupItem 
                        position="FLEX" 
                        name="Jaylen Waddle" 
                        team="MIA" 
                        opponent="@ BUF" 
                        projection={13.5} 
                      />
                      <PlayerLineupItem 
                        position="D/ST" 
                        name="Eagles" 
                        team="PHI" 
                        opponent="@ DAL" 
                        projection={7.4} 
                      />
                      <PlayerLineupItem 
                        position="K" 
                        name="Evan McPherson" 
                        team="CIN" 
                        opponent="vs TEN" 
                        projection={7.8} 
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">134.9 pts</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="players" className="mt-6">
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold mb-2">Player Comparison Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  Detailed player-by-player comparison will be available in the next update.
                </p>
                <Button className="btn-vibrant-orange">View Lineup</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="matchups" className="mt-6">
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold mb-2">Position Matchups Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  Detailed position-by-position matchup analysis will be available in the next update.
                </p>
                <Button className="btn-vibrant-orange">View Lineup</Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <Card className="mb-8 animated-element">
            <CardHeader>
              <CardTitle>Matchup History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <span className="block text-sm mb-1">Week 4, 2024</span>
                    <div className="flex items-center">
                      <span className="font-medium">Citrus Crushers</span>
                      <span className="mx-2 text-green-600 font-bold">W</span>
                      <span>148-132</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">vs. Touchdown Titans</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <span className="block text-sm mb-1">Week 11, 2023</span>
                    <div className="flex items-center">
                      <span className="font-medium">Citrus Crushers</span>
                      <span className="mx-2 text-red-600 font-bold">L</span>
                      <span>118-135</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">vs. Touchdown Titans</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <span className="block text-sm mb-1">Week 2, 2023</span>
                    <div className="flex items-center">
                      <span className="font-medium">Citrus Crushers</span>
                      <span className="mx-2 text-green-600 font-bold">W</span>
                      <span>157-145</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">vs. Touchdown Titans</div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <div className="inline-flex items-center bg-muted/50 rounded-lg p-2">
                  <div className="px-3 py-1 text-center">
                    <div className="text-xl font-bold">2</div>
                    <div className="text-xs text-muted-foreground">WINS</div>
                  </div>
                  <div className="px-3 py-1 border-l border-r border-border text-center">
                    <div className="text-xl font-bold">1</div>
                    <div className="text-xs text-muted-foreground">LOSS</div>
                  </div>
                  <div className="px-3 py-1 text-center">
                    <div className="text-xl font-bold">66%</div>
                    <div className="text-xs text-muted-foreground">WIN RATE</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const PlayerLineupItem = ({ 
  position, 
  name, 
  team, 
  opponent, 
  projection 
}: { 
  position: string; 
  name: string; 
  team: string; 
  opponent: string; 
  projection: number;
}) => (
  <div className="flex items-center justify-between border-b border-border pb-2">
    <div className="flex items-center">
      <div className="w-8 text-xs font-medium bg-muted/50 rounded-md h-6 flex items-center justify-center mr-2">
        {position}
      </div>
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{team} {opponent}</div>
      </div>
    </div>
    <div className="font-medium">{projection}</div>
  </div>
);

export default Matchup;
