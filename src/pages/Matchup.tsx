import { useState } from "react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamCard } from "@/components/matchup/TeamCard";
import { ScoreCard } from "@/components/matchup/ScoreCard";
import { DailyPointsChart } from "@/components/matchup/DailyPointsChart";
import { MatchupHistory } from "@/components/matchup/MatchupHistory";
import { LiveUpdates } from "@/components/matchup/LiveUpdates";
import { Button } from "@/components/ui/button";
import { MatchupPlayer } from "@/components/matchup/types";
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';
import PlayerStatsModal from '@/components/PlayerStatsModal';

const Matchup = () => {
  const [activeTab, setActiveTab] = useState("lineup");

  const [selectedPlayer, setSelectedPlayer] = useState<HockeyPlayer | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);

  const toHockeyPlayer = (p: MatchupPlayer): HockeyPlayer => ({
    id: p.id.toString(),
    name: p.name,
    position: p.position,
    number: 0,
    starter: p.isStarter,
    stats: {
      goals: p.stats.goals,
      assists: p.stats.assists,
      points: p.points,
      plusMinus: 0,
      shots: p.stats.sog,
      hits: 0,
      blockedShots: p.stats.blk,
      wins: 0,
      losses: 0,
      otl: 0,
      gaa: 0,
      savePct: 0,
      shutouts: 0
    },
    team: p.team,
    teamAbbreviation: p.team,
    status: p.status === 'Yet to Play' ? null : (p.status === 'In Game' ? 'Active' : null),
    image: undefined,
    projectedPoints: 0
  });

  const handlePlayerClick = (player: MatchupPlayer) => {
    setSelectedPlayer(toHockeyPlayer(player));
    setIsPlayerDialogOpen(true);
  };

  const [myTeam] = useState<MatchupPlayer[]>([
    { id: 1, name: "Connor McDavid", position: "C", team: "EDM", points: 32.5, gamesRemaining: 2, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 2, sog: 4, blk: 0 }, gameInfo: { opponent: "vs CGY", score: "EDM 4-2", period: "3rd 12:45" } },
    { id: 2, name: "Leon Draisaitl", position: "C", team: "EDM", points: 28.2, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 0, assists: 1, sog: 2, blk: 0 }, gameInfo: { opponent: "vs CGY", score: "EDM 4-2", period: "3rd 12:45" } },
    { id: 3, name: "Auston Matthews", position: "C", team: "TOR", points: 25.7, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 2, assists: 0, sog: 6, blk: 1 } },
    { id: 4, name: "Nathan MacKinnon", position: "C", team: "COL", points: 22.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 3, sog: 5, blk: 0 } },
    { id: 5, name: "David Pastrnak", position: "RW", team: "BOS", points: 21.4, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 1, sog: 3, blk: 0 }, gameInfo: { opponent: "@ FLA", score: "BOS 2-1", period: "2nd 4:20" } },
    { id: 6, name: "Mikko Rantanen", position: "RW", team: "COL", points: 18.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 2, sog: 2, blk: 1 } },
    { id: 7, name: "Kirill Kaprizov", position: "LW", team: "MIN", points: 17.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 4, blk: 0 } },
    { id: 8, name: "Alex Ovechkin", position: "LW", team: "WSH", points: 16.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 5, blk: 1 } },
    { id: 9, name: "Cale Makar", position: "D", team: "COL", points: 15.7, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 2, sog: 2, blk: 2 } },
    { id: 10, name: "Adam Fox", position: "D", team: "NYR", points: 13.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
    { id: 11, name: "Roman Josi", position: "D", team: "NSH", points: 11.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 3, blk: 2 } },
    { id: 12, name: "Victor Hedman", position: "D", team: "TBL", points: 10.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 1 } },
    { id: 13, name: "Andrei Vasilevskiy", position: "G", team: "TBL", points: 24.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0 } },
    { id: 14, name: "Igor Shesterkin", position: "G", team: "NYR", points: 23.2, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
    { id: 15, name: "Matt Duchene", position: "C", team: "DAL", points: 8.5, gamesRemaining: 2, status: "Yet to Play", isStarter: false, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "@ STL", time: "8:00 PM" } },
    { id: 16, name: "Mitch Marner", position: "RW", team: "TOR", points: 14.8, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 2, sog: 3, blk: 1 } },
    { id: 17, name: "Brady Tkachuk", position: "LW", team: "OTT", points: 12.3, gamesRemaining: 1, status: "Yet to Play", isStarter: false, isToday: false, stats: { goals: 1, assists: 0, sog: 5, blk: 4 } },
    { id: 18, name: "Quinn Hughes", position: "D", team: "VAN", points: 9.7, gamesRemaining: 2, status: "Yet to Play", isStarter: false, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 0 } },
    { id: 19, name: "Jacob Markstrom", position: "G", team: "CGY", points: 18.5, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0 } },
  ]);

  const [opponentTeam] = useState<MatchupPlayer[]>([
    { id: 101, name: "Sidney Crosby", position: "C", team: "PIT", points: 29.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs PHI", time: "7:30 PM" } },
    { id: 102, name: "Nikita Kucherov", position: "RW", team: "TBL", points: 27.9, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 1, assists: 2, sog: 4, blk: 0 } },
    { id: 103, name: "Artemi Panarin", position: "LW", team: "NYR", points: 26.2, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
    { id: 104, name: "Brad Marchand", position: "LW", team: "BOS", points: 22.1, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 0, assists: 1, sog: 2, blk: 1 }, gameInfo: { opponent: "@ FLA", score: "BOS 2-1", period: "2nd 4:20" } },
    { id: 105, name: "Elias Pettersson", position: "C", team: "VAN", points: 20.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 1, assists: 1, sog: 3, blk: 1 } },
    { id: 106, name: "Jack Hughes", position: "C", team: "NJD", points: 19.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 1, sog: 5, blk: 0 } },
    { id: 107, name: "William Nylander", position: "RW", team: "TOR", points: 18.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 4, blk: 0 } },
    { id: 108, name: "Matthew Tkachuk", position: "RW", team: "FLA", points: 17.8, gamesRemaining: 2, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 0, sog: 3, blk: 2 }, gameInfo: { opponent: "vs BOS", score: "BOS 2-1", period: "2nd 4:20" } },
    { id: 109, name: "Brent Burns", position: "D", team: "CAR", points: 13.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 3, blk: 2 } },
    { id: 110, name: "Dougie Hamilton", position: "D", team: "NJD", points: 12.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 3 } },
    { id: 111, name: "Shea Theodore", position: "D", team: "VGK", points: 11.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "@ LAK", time: "10:00 PM" } },
    { id: 112, name: "Moritz Seider", position: "D", team: "DET", points: 9.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 1, blk: 4 } },
    { id: 113, name: "Connor Hellebuyck", position: "G", team: "WPG", points: 26.3, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0 } },
    { id: 114, name: "Ilya Sorokin", position: "G", team: "NYI", points: 22.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "@ WAS", time: "7:00 PM" } },
    { id: 115, name: "Tim Stützle", position: "C", team: "OTT", points: 10.4, gamesRemaining: 1, status: "Yet to Play", isStarter: false, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 0 } },
    { id: 116, name: "Cole Caufield", position: "RW", team: "MTL", points: 9.8, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 1, assists: 0, sog: 3, blk: 0 } },
    { id: 117, name: "Timo Meier", position: "LW", team: "NJD", points: 11.2, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 1, sog: 4, blk: 1 } },
    { id: 118, name: "Rasmus Dahlin", position: "D", team: "BUF", points: 10.1, gamesRemaining: 2, status: "Yet to Play", isStarter: false, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs OTT", time: "7:00 PM" } },
    { id: 119, name: "Juuse Saros", position: "G", team: "NSH", points: 17.6, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0 } },
  ]);

  const [updates] = useState<string[]>([
    "Connor McDavid scored a goal! +5 points.",
    "David Pastrnak with an assist! +3 points.",
    "Igor Shesterkin made a save! +0.2 points.",
    "Adam Fox with a power play assist! +4 points."
  ]);

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative elements to match Home page */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--vibrant-yellow))] rounded-full opacity-10 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[hsl(var(--vibrant-green))] rounded-full opacity-10 blur-3xl -z-10"></div>

      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
             <div>
               <h1 className="text-4xl font-bold mb-2 citrus-gradient-text">Matchup</h1>
               <p className="text-muted-foreground text-lg">Week 12 • Citrus Crushers vs Thunder Titans</p>
             </div>
             <div className="flex gap-2">
                <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">Week 11</Button>
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md">Week 12</Button>
                <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">Week 13</Button>
             </div>
          </div>
          
          <ScoreCard
            myTeamName="Citrus Crushers"
            myTeamRecord={{ wins: 7, losses: 3 }}
            opponentTeamName="Thunder Titans"
            opponentTeamRecord={{ wins: 9, losses: 1 }}
            myTeamPoints={myTeamPoints}
            opponentTeamPoints={opponentTeamPoints}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 rounded-none h-auto gap-6">
              <TabsTrigger 
                value="lineup" 
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-muted-foreground data-[state=active]:border-fantasy-secondary data-[state=active]:text-fantasy-secondary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all hover:text-fantasy-secondary/80"
              >
                Lineup
              </TabsTrigger>
              <TabsTrigger 
                value="dailyPoints" 
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-muted-foreground data-[state=active]:border-fantasy-secondary data-[state=active]:text-fantasy-secondary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all hover:text-fantasy-secondary/80"
              >
                Daily Points
              </TabsTrigger>
              <TabsTrigger 
                value="matchupHistory" 
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-muted-foreground data-[state=active]:border-fantasy-secondary data-[state=active]:text-fantasy-secondary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all hover:text-fantasy-secondary/80"
              >
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="lineup" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TeamCard
                  title="Citrus Crushers"
                  starters={myStarters}
                  bench={myBench}
                  gradientClass="border-t-4 border-fantasy-secondary"
                  onPlayerClick={handlePlayerClick}
                />
                <TeamCard
                  title="Thunder Titans"
                  starters={opponentStarters}
                  bench={opponentBench}
                  gradientClass="border-t-4 border-fantasy-primary"
                  onPlayerClick={handlePlayerClick}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="dailyPoints" className="mt-8">
              <DailyPointsChart
                dayLabels={dayLabels}
                myDailyPoints={myDailyPoints}
                opponentDailyPoints={opponentDailyPoints}
              />
            </TabsContent>
            
            <TabsContent value="matchupHistory" className="mt-8">
              <MatchupHistory />
            </TabsContent>
          </Tabs>
          
          <LiveUpdates updates={updates} />
        </div>
        
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

export default Matchup;
