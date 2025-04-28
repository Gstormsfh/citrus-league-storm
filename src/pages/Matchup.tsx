import { useState } from "react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamCard } from "@/components/matchup/TeamCard";
import { ScoreCard } from "@/components/matchup/ScoreCard";
import { DailyPointsChart } from "@/components/matchup/DailyPointsChart";
import { MatchupHistory } from "@/components/matchup/MatchupHistory";
import { LiveUpdates } from "@/components/matchup/LiveUpdates";
import { MatchupPlayer } from "@/components/matchup/types";

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
          
          <ScoreCard
            myTeamName="Citrus Crushers"
            myTeamRecord={{ wins: 7, losses: 3 }}
            opponentTeamName="Thunder Titans"
            opponentTeamRecord={{ wins: 9, losses: 1 }}
            myTeamPoints={myTeamPoints}
            opponentTeamPoints={opponentTeamPoints}
          />
          
          <Tabs defaultValue="lineup" className="mb-8 animate-fade-in">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 bg-white border border-fantasy-border/20 rounded-full p-1">
              <TabsTrigger value="lineup" className="rounded-full data-[state=active]:bg-fantasy-primary data-[state=active]:text-white">Lineup</TabsTrigger>
              <TabsTrigger value="dailyPoints" className="rounded-full data-[state=active]:bg-fantasy-primary data-[state=active]:text-white">Daily Points</TabsTrigger>
              <TabsTrigger value="matchupHistory" className="rounded-full data-[state=active]:bg-fantasy-primary data-[state=active]:text-white">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lineup" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TeamCard
                  title="My Team"
                  starters={myStarters}
                  bench={myBench}
                  gradientClass="bg-gradient-to-r from-fantasy-primary/10 to-fantasy-primary/5"
                />
                <TeamCard
                  title="Opponent's Team"
                  starters={opponentStarters}
                  bench={opponentBench}
                  gradientClass="bg-gradient-to-r from-fantasy-dark/10 to-fantasy-dark/5"
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
      </main>
      <Footer />
    </div>
  );
};

export default Matchup;
