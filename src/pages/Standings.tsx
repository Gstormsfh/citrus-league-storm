
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock teams data
const teams = [
  { 
    id: 1, 
    name: 'Touchdown Titans', 
    owner: 'Alex Johnson',
    logo: 'https://images.unsplash.com/photo-1606131731446-5568d87113aa?q=80&w=400&auto=format&fit=crop',
    record: { wins: 9, losses: 1 },
    points: 1432,
    streak: 'W4'
  },
  { 
    id: 2, 
    name: 'Scoring Sharks', 
    owner: 'Samantha Lee',
    logo: 'https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?q=80&w=400&auto=format&fit=crop',
    record: { wins: 8, losses: 2 },
    points: 1378,
    streak: 'W2'
  },
  { 
    id: 3, 
    name: 'Citrus Crushers', 
    owner: 'You',
    logo: 'https://images.unsplash.com/photo-1617777938240-9a1d8e3ba07c?q=80&w=400&auto=format&fit=crop',
    record: { wins: 7, losses: 3 },
    points: 1247,
    streak: 'W1'
  },
  { 
    id: 4, 
    name: 'Field Generals', 
    owner: 'Carlos Rodriguez',
    logo: 'https://images.unsplash.com/photo-1620741713132-07086ac93313?q=80&w=400&auto=format&fit=crop',
    record: { wins: 6, losses: 4 },
    points: 1189,
    streak: 'L1'
  },
  { 
    id: 5, 
    name: 'Blitz Brigade', 
    owner: 'Taylor Kim',
    logo: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?q=80&w=400&auto=format&fit=crop',
    record: { wins: 5, losses: 5 },
    points: 1145,
    streak: 'W3'
  },
  { 
    id: 6, 
    name: 'Goal Getters', 
    owner: 'Jamie Zhang',
    logo: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=400&auto=format&fit=crop',
    record: { wins: 4, losses: 6 },
    points: 1102,
    streak: 'L2'
  },
  { 
    id: 7, 
    name: 'Victory Vipers', 
    owner: 'Morgan Williams',
    logo: 'https://images.unsplash.com/photo-1562519819-016930be069d?q=80&w=400&auto=format&fit=crop',
    record: { wins: 3, losses: 7 },
    points: 1067,
    streak: 'L4'
  },
  { 
    id: 8, 
    name: 'Hustle Heroes', 
    owner: 'Jordan Patel',
    logo: 'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?q=80&w=400&auto=format&fit=crop',
    record: { wins: 2, losses: 8 },
    points: 987,
    streak: 'L1'
  },
  { 
    id: 9, 
    name: 'Gridiron Gladiators', 
    owner: 'Casey Thompson',
    logo: 'https://images.unsplash.com/photo-1610216705422-caa3fcb6d158?q=80&w=400&auto=format&fit=crop',
    record: { wins: 1, losses: 9 },
    points: 896,
    streak: 'L6'
  },
];

const Standings = () => {
  const [season, setSeason] = useState("2025");
  
  // Animation observer setup
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
  
  // Sort teams by winning record
  const sortedTeams = [...teams].sort((a, b) => {
    // First by wins
    if (b.record.wins !== a.record.wins) {
      return b.record.wins - a.record.wins;
    }
    // Then by points if wins are the same
    return b.points - a.points;
  });
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 vibrant-gradient-3 bg-clip-text text-transparent">League Standings</h1>
            <p className="text-lg text-muted-foreground">Track your team's position in the league rankings.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto mb-8">
            <div className="mb-4 md:mb-0 animated-element">
              <h2 className="text-2xl font-bold">CitrusSports League</h2>
              <p className="text-muted-foreground">Regular Season Standings</p>
            </div>
            
            <div className="flex items-center space-x-4 animated-element">
              <div className="w-36">
                <Select defaultValue={season} onValueChange={setSeason}>
                  <SelectTrigger className="w-36 bg-background">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent className="w-36 bg-background">
                    <SelectItem value="2023">2023 Season</SelectItem>
                    <SelectItem value="2024">2024 Season</SelectItem>
                    <SelectItem value="2025">2025 Season</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" size="sm" className="bg-background">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export
              </Button>
            </div>
          </div>
          
          <Card className="max-w-5xl mx-auto overflow-hidden animated-element">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-medium">Rank</th>
                    <th className="px-6 py-4 font-medium">Team</th>
                    <th className="px-6 py-4 font-medium">Record</th>
                    <th className="px-6 py-4 font-medium">Win %</th>
                    <th className="px-6 py-4 font-medium">Points</th>
                    <th className="px-6 py-4 font-medium">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedTeams.map((team, index) => {
                    const isUserTeam = team.owner === 'You';
                    const winPercentage = ((team.record.wins / (team.record.wins + team.record.losses)) * 100).toFixed(1);
                    
                    return (
                      <tr key={team.id} className={`${isUserTeam ? 'bg-primary/5' : 'hover:bg-muted/30'} transition-colors`}>
                        <td className="px-6 py-4 font-medium">
                          {index + 1}
                          {index < 4 && (
                            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">P</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden mr-3">
                              <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <div className="font-medium">{team.name}</div>
                              <div className="text-sm text-muted-foreground">{team.owner}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{team.record.wins}-{team.record.losses}</td>
                        <td className="px-6 py-4">{winPercentage}%</td>
                        <td className="px-6 py-4">{team.points.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${team.streak.startsWith('W') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {team.streak}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          
          <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="animated-element">
              <CardHeader>
                <CardTitle>Playoff Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedTeams.slice(0, 4).map((team, i) => (
                    <div key={team.id} className="flex items-center p-2 rounded-md bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-2">
                        {i+1}
                      </div>
                      <div className="font-medium">{team.name}</div>
                      <div className="ml-auto text-sm text-muted-foreground">{team.record.wins}-{team.record.losses}</div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-center text-sm text-muted-foreground">
                      Top 4 teams qualify for playoffs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="animated-element">
              <CardHeader>
                <CardTitle>Points Leaders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...teams].sort((a, b) => b.points - a.points).slice(0, 5).map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                          <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="font-medium">{team.name}</div>
                      </div>
                      <div className="font-bold text-[hsl(var(--vibrant-orange))]">{team.points}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="animated-element">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Week 10</div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Citrus Crushers</div>
                      <div className="font-bold text-green-600">W 132-118</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">vs. Hustle Heroes</div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Week 9</div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Citrus Crushers</div>
                      <div className="font-bold text-red-600">L 119-126</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">vs. Touchdown Titans</div>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Week 8</div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Citrus Crushers</div>
                      <div className="font-bold text-green-600">W 141-107</div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">vs. Victory Vipers</div>
                  </div>
                </div>
                <Button variant="link" className="mt-2 w-full text-[hsl(var(--vibrant-purple))]">View All Results</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Standings;
