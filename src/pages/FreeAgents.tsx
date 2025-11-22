import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Mock free agent data
const freeAgents = [
  {
    id: 1,
    name: "Connor Bedard",
    position: "C",
    team: "CHI",
    opponent: "@ STL",
    projectedPoints: 3.8,
    stats: {
      goals: 22,
      assists: 39,
      shots: 214
    },
    trend: "up",
    rostered: 98
  },
  {
    id: 2,
    name: "Luke Hughes",
    position: "D",
    team: "NJ",
    opponent: "@ WAS",
    projectedPoints: 2.4,
    stats: {
      goals: 9,
      assists: 38,
      blocks: 65
    },
    trend: "up",
    rostered: 82
  },
  {
    id: 3,
    name: "Pyotr Kochetkov",
    position: "G",
    team: "CAR",
    opponent: "vs NYR",
    projectedPoints: 4.2,
    stats: {
      wins: 18,
      gaa: 2.45,
      savePercentage: .912
    },
    trend: "neutral",
    rostered: 76
  },
  {
    id: 4,
    name: "Wyatt Johnston",
    position: "C/RW",
    team: "DAL",
    opponent: "vs NSH",
    projectedPoints: 2.9,
    stats: {
      goals: 24,
      assists: 28,
      hits: 45
    },
    trend: "down",
    rostered: 68
  },
  {
    id: 5,
    name: "Brock Faber",
    position: "D",
    team: "MIN",
    opponent: "@ WPG",
    projectedPoints: 2.1,
    stats: {
      goals: 6,
      assists: 35,
      toi: "25:12"
    },
    trend: "up",
    rostered: 72
  }
];

const FreeAgents = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');

  const handleAddPlayer = (player: any) => {
    toast({
      title: "Waiver Claim Submitted",
      description: `Claim for ${player.name} has been submitted successfully.`,
      variant: "default"
    });
  };

  const filteredPlayers = freeAgents.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          player.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === 'ALL' || player.position.includes(positionFilter);
    
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

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="waivers">Waiver Wire</TabsTrigger>
            <TabsTrigger value="watch">Watch List</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPlayers.map((player) => (
                <Card key={player.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground font-bold text-lg mr-4">
                        {player.team}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{player.name}</h3>
                            <p className="text-sm text-muted-foreground">{player.position} • {player.team} • {player.opponent}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-primary">{player.projectedPoints}</div>
                            <p className="text-xs text-muted-foreground">Proj Pts</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex gap-4 text-sm">
                          {player.position === 'G' ? (
                            <>
                              <div><span className="text-muted-foreground">W:</span> {player.stats.wins}</div>
                              <div><span className="text-muted-foreground">GAA:</span> {player.stats.gaa}</div>
                              <div><span className="text-muted-foreground">SV%:</span> {player.stats.savePercentage}</div>
                            </>
                          ) : (
                            <>
                              <div><span className="text-muted-foreground">G:</span> {player.stats.goals}</div>
                              <div><span className="text-muted-foreground">A:</span> {player.stats.assists}</div>
                              {player.stats.shots && <div><span className="text-muted-foreground">SOG:</span> {player.stats.shots}</div>}
                              {player.stats.blocks && <div><span className="text-muted-foreground">BLK:</span> {player.stats.blocks}</div>}
                              {player.stats.hits && <div><span className="text-muted-foreground">HIT:</span> {player.stats.hits}</div>}
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
