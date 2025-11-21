
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
    name: "Jordan Love",
    position: "QB",
    team: "GB",
    opponent: "@ MIN",
    projectedPoints: 18.7,
    stats: {
      passingYards: 3864,
      passingTDs: 32,
      interceptions: 11
    },
    trend: "up",
    rostered: 89
  },
  {
    id: 2,
    name: "Jayden Reed",
    position: "WR",
    team: "GB",
    opponent: "@ MIN",
    projectedPoints: 14.2,
    stats: {
      receptions: 64,
      receivingYards: 793,
      receivingTDs: 8
    },
    trend: "up",
    rostered: 78
  },
  {
    id: 3,
    name: "Chuba Hubbard",
    position: "RB",
    team: "CAR",
    opponent: "vs ATL",
    projectedPoints: 12.8,
    stats: {
      rushingYards: 726,
      rushingTDs: 5,
      receptions: 37
    },
    trend: "neutral",
    rostered: 84
  },
  {
    id: 4,
    name: "Dalton Schultz",
    position: "TE",
    team: "HOU",
    opponent: "vs TEN",
    projectedPoints: 10.5,
    stats: {
      receptions: 52,
      receivingYards: 578,
      receivingTDs: 5
    },
    trend: "down",
    rostered: 67
  },
  {
    id: 5,
    name: "Gus Edwards",
    position: "RB",
    team: "LAC",
    opponent: "vs CIN",
    projectedPoints: 11.3,
    stats: {
      rushingYards: 687,
      rushingTDs: 8,
      receptions: 14
    },
    trend: "up",
    rostered: 75
  },
  {
    id: 6,
    name: "Patriots",
    position: "DST",
    team: "NE",
    opponent: "@ NYJ",
    projectedPoints: 7.8,
    stats: {
      sacks: 32,
      interceptions: 13,
      fumbleRecoveries: 8
    },
    trend: "neutral",
    rostered: 42
  },
  {
    id: 7,
    name: "Jake Moody",
    position: "K",
    team: "SF",
    opponent: "vs SEA",
    projectedPoints: 9.1,
    stats: {
      fieldGoals: 27,
      fieldGoalAttempts: 30,
      extraPoints: 42
    },
    trend: "up",
    rostered: 58
  },
  {
    id: 8,
    name: "Noah Brown",
    position: "WR",
    team: "WAS",
    opponent: "vs NYG",
    projectedPoints: 9.4,
    stats: {
      receptions: 33,
      receivingYards: 479,
      receivingTDs: 3
    },
    trend: "down",
    rostered: 23
  }
];

const FreeAgents = () => {
  const [position, setPosition] = useState("All");
  const [sort, setSort] = useState("projected");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  
  const handleAddPlayer = (player: typeof freeAgents[0]) => {
    toast({
      title: "Player Added",
      description: `${player.name} has been added to your team.`,
      variant: "default"
    });
  };
  
  const filteredAgents = freeAgents.filter(player => {
    // Filter by position
    if (position !== "All" && player.position !== position) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by selected criteria
    switch (sort) {
      case "projected":
        return b.projectedPoints - a.projectedPoints;
      case "name":
        return a.name.localeCompare(b.name);
      case "rostered":
        return b.rostered - a.rostered;
      default:
        return 0;
    }
  });
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 vibrant-gradient-3 bg-clip-text text-transparent">
              Free Agents
            </h1>
            <p className="text-lg text-muted-foreground">
              Find players to improve your roster and gain a competitive edge
            </p>
          </div>
          
          <Card className="mb-8 animated-element">
            <CardHeader>
              <CardTitle>Available Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Position</label>
                  <Select defaultValue={position} onValueChange={setPosition}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Positions</SelectItem>
                      <SelectItem value="QB">Quarterbacks</SelectItem>
                      <SelectItem value="RB">Running Backs</SelectItem>
                      <SelectItem value="WR">Wide Receivers</SelectItem>
                      <SelectItem value="TE">Tight Ends</SelectItem>
                      <SelectItem value="DST">Defense/Special Teams</SelectItem>
                      <SelectItem value="K">Kickers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <Select defaultValue={sort} onValueChange={setSort}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="projected">Projected Points</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="rostered">% Rostered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Input 
                      placeholder="Search players..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-background"
                    />
                    {searchTerm && (
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setSearchTerm("")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Player</th>
                      <th className="px-4 py-3 font-medium">Position</th>
                      <th className="px-4 py-3 font-medium">Matchup</th>
                      <th className="px-4 py-3 font-medium">Projected</th>
                      <th className="px-4 py-3 font-medium">% Rostered</th>
                      <th className="px-4 py-3 font-medium">Trend</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAgents.length > 0 ? (
                      filteredAgents.map((player) => (
                        <tr key={player.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center text-xs font-medium mr-3">
                                {player.team}
                              </div>
                              <div className="font-medium">{player.name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {player.position}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {player.team} {player.opponent}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {player.projectedPoints}
                          </td>
                          <td className="px-4 py-3">
                            {player.rostered}%
                          </td>
                          <td className="px-4 py-3">
                            {player.trend === "up" && (
                              <span className="text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                </svg>
                              </span>
                            )}
                            {player.trend === "down" && (
                              <span className="text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                              </span>
                            )}
                            {player.trend === "neutral" && (
                              <span className="text-muted-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                </svg>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-[hsl(var(--vibrant-orange))] border-[hsl(var(--vibrant-orange))] hover:bg-[hsl(var(--vibrant-orange))]/10"
                              onClick={() => handleAddPlayer(player)}
                            >
                              Add
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                          No players found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <div className="max-w-3xl mx-auto animated-element">
            <Card>
              <CardHeader>
                <CardTitle>Free Agent Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--vibrant-orange))]/10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[hsl(var(--vibrant-orange))]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Look for Value</h3>
                      <p className="text-muted-foreground text-sm">
                        Focus on players with high projected points but lower roster percentages. These hidden gems can give you an edge.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--vibrant-purple))]/10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[hsl(var(--vibrant-purple))]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Consider Matchups</h3>
                      <p className="text-muted-foreground text-sm">
                        A player facing a weak defense might outperform their averages. Look at the opponent when making decisions.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Watch for Trends</h3>
                      <p className="text-muted-foreground text-sm">
                        Players trending upward may continue their momentum. Be proactive and grab ascending players early.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FreeAgents;
