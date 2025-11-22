import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Trophy, Users } from 'lucide-react';

const ScheduleManager = () => {
  const upcomingMatchups = [
    { week: "Week 12", opponent: "Ice Warriors", date: "Dec 28 - Jan 3", status: "upcoming" },
    { week: "Week 13", opponent: "Frozen Fury", date: "Jan 4 - Jan 10", status: "upcoming" },
    { week: "Week 14", opponent: "Blizzard Kings", date: "Jan 11 - Jan 17", status: "upcoming" },
    { week: "Week 15", opponent: "Avalanche Elite", date: "Jan 18 - Jan 24", status: "upcoming" }
  ];

  const recentResults = [
    { week: "Week 11", opponent: "Puck Dynasty", score: "145-132", result: "win" },
    { week: "Week 10", opponent: "Hockey Legends", score: "128-138", result: "loss" },
    { week: "Week 9", opponent: "Goal Crushers", score: "156-142", result: "win" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Schedule Manager</h1>
              <p className="text-lg text-muted-foreground">
                View upcoming matchups and plan your lineup
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">8-3-0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Division Rank</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2nd</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Playoff Odds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">94%</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Matchups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMatchups.map((matchup, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold">{matchup.week}</div>
                          <div className="text-sm text-muted-foreground">vs {matchup.opponent}</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{matchup.date}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-12 rounded ${result.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-semibold">{result.week}</div>
                          <div className="text-sm text-muted-foreground">vs {result.opponent}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{result.score}</div>
                        <div className={`text-sm ${result.result === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                          {result.result === 'win' ? 'Win' : 'Loss'}
                        </div>
                      </div>
                    </div>
                  ))}
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

export default ScheduleManager;
