import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, TrendingDown, AlertCircle, Calendar, ChevronRight, ShieldCheck } from 'lucide-react';

interface PositionStats {
  position: string;
  grade: string;
  score: number;
  avgPoints: number;
  leagueRank: number;
  description: string;
  strengths: string[];
  weaknesses: string[];
  suggestion?: string;
}

interface FreeAgentRec {
  id: number;
  name: string;
  position: string;
  team: string;
  pointsPerGame: number;
  gamesThisWeek: number;
  scheduleAdvantage: boolean;
  rostered: number;
}

const TeamAnalytics = () => {
  // Mock Analysis Data
  const positionalAnalysis: PositionStats[] = [
    {
      position: "Centers",
      grade: "A+",
      score: 98,
      avgPoints: 14.2,
      leagueRank: 1,
      description: "Elite production. McDavid and Draisaitl provide an unmatched floor and ceiling.",
      strengths: ["Scoring", "Assists", "Consistency"],
      weaknesses: [],
      suggestion: "Hold steady. No improvements needed."
    },
    {
      position: "Wingers",
      grade: "B",
      score: 82,
      avgPoints: 8.5,
      leagueRank: 5,
      description: "Solid but inconsistent. Hyman is carrying the load, but secondary scoring is lacking.",
      strengths: ["Goal Scoring"],
      weaknesses: ["Assists", "+/-"],
      suggestion: "Look for a playmaking winger on waivers to balance the scoring dependence."
    },
    {
      position: "Defense",
      grade: "A-",
      score: 91,
      avgPoints: 9.8,
      leagueRank: 2,
      description: "Very strong top pair. Bouchard is performing like a top-5 option.",
      strengths: ["Power Play Points", "Blocks"],
      weaknesses: ["Depth"],
      suggestion: "Consider streaming a 4th defenseman for off-nights."
    },
    {
      position: "Goalies",
      grade: "C-",
      score: 72,
      avgPoints: 4.1,
      leagueRank: 9,
      description: "Underperforming significantly. Skinner has been volatile.",
      strengths: ["Saves"],
      weaknesses: ["GAA", "Wins"],
      suggestion: "Urgent upgrade recommended. Target a starter on a defensive team."
    }
  ];

  const freeAgentTargets: FreeAgentRec[] = [
    { id: 1, name: "Joey Daccord", position: "G", team: "SEA", pointsPerGame: 5.8, gamesThisWeek: 4, scheduleAdvantage: true, rostered: 42 },
    { id: 2, name: "Charlie Coyle", position: "C/RW", team: "BOS", pointsPerGame: 6.2, gamesThisWeek: 4, scheduleAdvantage: true, rostered: 55 },
    { id: 3, name: "Gustav Forsling", position: "D", team: "FLA", pointsPerGame: 5.1, gamesThisWeek: 3, scheduleAdvantage: false, rostered: 38 },
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (grade.startsWith('B')) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    if (grade.startsWith('C')) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                  Stormy Analytics
                </h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI-Powered Roster Optimization
                </p>
              </div>
              <div className="flex gap-3">
                <Card className="px-4 py-2 bg-purple-500/5 border-purple-500/20">
                  <div className="text-xs text-muted-foreground uppercase font-semibold">Team Rating</div>
                  <div className="text-2xl font-bold text-purple-600">92.4 <span className="text-sm font-normal text-muted-foreground">/ 100</span></div>
                </Card>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Positional Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Positional Deep Dive
                </h2>
                
                <div className="space-y-4">
                  {positionalAnalysis.map((pos) => (
                    <Card key={pos.position} className="overflow-hidden border-l-4" style={{ borderLeftColor: pos.grade.startsWith('A') ? '#22c55e' : pos.grade.startsWith('B') ? '#3b82f6' : pos.grade.startsWith('C') ? '#eab308' : '#ef4444' }}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-bold">{pos.position}</h3>
                              <Badge variant="outline" className={getGradeColor(pos.grade)}>Grade: {pos.grade}</Badge>
                              <Badge variant="secondary" className="text-xs">Rank #{pos.leagueRank}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{pos.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{pos.avgPoints}</div>
                            <div className="text-xs text-muted-foreground">Avg Pts/Game</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Performance Score</span>
                              <span>{pos.score}/100</span>
                            </div>
                            <Progress value={pos.score} className="h-2" />
                          </div>

                          {pos.suggestion && (
                            <div className="bg-muted/40 p-3 rounded-lg flex gap-3 items-start mt-3 border border-dashed">
                              <Brain className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-purple-700 dark:text-purple-400">Stormy's Suggestion</div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{pos.suggestion}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right Column: Stormy's Targets */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> AI Recommended Targets
                </h2>

                <Card className="bg-slate-950 text-slate-50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Urgent: Goaltending
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Your goalie grade is C-. Improving this position is the #1 priority to increase win probability.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {freeAgentTargets.filter(p => p.position === 'G').map(player => (
                         <div key={player.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <div className="font-bold text-base">{player.name}</div>
                               <div className="text-xs text-slate-400">{player.team} • {player.position}</div>
                             </div>
                             <Button size="sm" variant="secondary" className="h-7 text-xs">Claim</Button>
                           </div>
                           <div className="grid grid-cols-2 gap-2 text-xs">
                             <div className="bg-black/20 p-1.5 rounded flex flex-col items-center">
                               <span className="text-slate-400">Avg Pts</span>
                               <span className="font-mono font-bold text-green-400">{player.pointsPerGame}</span>
                             </div>
                             <div className="bg-black/20 p-1.5 rounded flex flex-col items-center relative overflow-hidden">
                               <span className="text-slate-400">This Week</span>
                               <span className="font-mono font-bold text-white">{player.gamesThisWeek} Gms</span>
                               {player.scheduleAdvantage && (
                                 <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-1 animate-pulse" />
                               )}
                             </div>
                           </div>
                         </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                   <CardHeader>
                     <CardTitle className="text-base">Schedule Maximizers</CardTitle>
                     <CardDescription>Free agents with favorable schedules this week</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-3">
                      {freeAgentTargets.filter(p => p.position !== 'G').map(player => (
                        <div key={player.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer border">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                               {player.team.substring(0,2)}
                             </div>
                             <div>
                               <div className="font-medium text-sm">{player.name}</div>
                               <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Badge variant="outline" className="h-4 px-1 text-[9px]">{player.position}</Badge>
                                  <span>{player.rostered}% Rostered</span>
                               </div>
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="text-xs font-bold flex items-center justify-end gap-1 text-green-600">
                               <Calendar className="h-3 w-3" /> {player.gamesThisWeek} Gms
                             </div>
                             <div className="text-[10px] text-muted-foreground">vs Avg Repl</div>
                           </div>
                        </div>
                      ))}
                      <Button variant="ghost" className="w-full text-xs text-primary mt-2" onClick={() => window.location.href = '/free-agents?tab=schedule'}>
                        View All Schedule Trends <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                   </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeamAnalytics;
