
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GMOffice = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 vibrant-gradient-1 bg-clip-text text-transparent">
              GM's Office
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your team and make strategic decisions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <Card className="md:col-span-2 animated-element">
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
                <CardDescription>Citrus Crushers | Current Record: 7-3</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">League Rank</div>
                    <div className="text-3xl font-bold">3rd</div>
                    <div className="text-sm text-[hsl(var(--vibrant-orange))]">Top 33%</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Points For</div>
                    <div className="text-3xl font-bold">1,247</div>
                    <div className="text-sm text-primary">124.7 avg/week</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Points Against</div>
                    <div className="text-3xl font-bold">1,118</div>
                    <div className="text-sm text-[hsl(var(--vibrant-purple))]">111.8 avg/week</div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
                <div className="space-y-3 mb-6">
                  <ActivityItem 
                    date="Apr 5, 2025"
                    type="add"
                    description="Added WR Noah Brown (WAS) to team"
                  />
                  <ActivityItem 
                    date="Apr 3, 2025"
                    type="drop"
                    description="Dropped TE Cole Kmet (CHI) from team"
                  />
                  <ActivityItem 
                    date="Apr 2, 2025"
                    type="trade"
                    description="Traded RB Derrick Henry for WR CeeDee Lamb"
                  />
                </div>
                
                <h3 className="text-lg font-medium mb-3">Upcoming Schedule</h3>
                <div className="space-y-3">
                  <ScheduleItem 
                    week="Week 11"
                    opponent="Touchdown Titans"
                    record="9-1"
                    projection="Projected: 82-87"
                  />
                  <ScheduleItem 
                    week="Week 12"
                    opponent="Scoring Sharks"
                    record="8-2"
                    projection="Projected: 88-91"
                  />
                  <ScheduleItem 
                    week="Week 13"
                    opponent="Hustle Heroes"
                    record="2-8"
                    projection="Projected: 128-102"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="animated-element">
              <CardHeader>
                <CardTitle>Team Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full btn-vibrant-orange">
                  View Team Roster
                </Button>
                <Button className="w-full btn-vibrant-purple">
                  Propose Trade
                </Button>
                <Button variant="outline" className="w-full">
                  Add/Drop Players
                </Button>
                <Button variant="outline" className="w-full">
                  Manage Lineup
                </Button>
                
                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-3">Quick Links</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="text-[hsl(var(--vibrant-orange))] hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                        League Standings
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-[hsl(var(--vibrant-orange))] hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                        </svg>
                        Player Stats
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-[hsl(var(--vibrant-orange))] hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        League Settings
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-[hsl(var(--vibrant-orange))] hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        Message Board
                      </a>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="news" className="animated-element">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
              <TabsTrigger value="news">Team News</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="news" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Latest Team News</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <NewsItem 
                      title="Justin Jefferson expected to play this week" 
                      date="April 5, 2025"
                      description="Vikings WR Justin Jefferson (knee) is expected to be active for Sunday's game against the Lions. Jefferson was a full participant in Friday's practice."
                      impact="High"
                    />
                    
                    <NewsItem 
                      title="Patrick Mahomes listed as questionable" 
                      date="April 4, 2025"
                      description="Chiefs QB Patrick Mahomes (ankle) is listed as questionable for Sunday's game against the Raiders. Coach Andy Reid said he expects Mahomes to play."
                      impact="Medium"
                    />
                    
                    <NewsItem 
                      title="Travis Kelce signs one-year extension" 
                      date="April 2, 2025"
                      description="Chiefs TE Travis Kelce signed a one-year contract extension. The deal will keep him with the team through the 2026 season."
                      impact="Low"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analysis" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Team Strengths</h3>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        <li>Strong quarterback play with Patrick Mahomes</li>
                        <li>Elite wide receiver corps led by Justin Jefferson</li>
                        <li>Above average tight end with Travis Kelce</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Team Weaknesses</h3>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        <li>Running back depth is concerning</li>
                        <li>Defense/Special Teams performance has been inconsistent</li>
                        <li>Bye week management could be improved</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Recommended Actions</h3>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        <li>Consider trading a WR for RB depth</li>
                        <li>Monitor waiver wire for emerging running back options</li>
                        <li>Prepare backup options for Mahomes if injury persists</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent League Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <TransactionItem 
                      team="Touchdown Titans"
                      type="add"
                      player="Kenneth Walker III (RB - SEA)"
                      date="April 5, 2025"
                    />
                    
                    <TransactionItem 
                      team="Scoring Sharks"
                      type="trade"
                      player="Traded Ja'Marr Chase (WR) for Jonathan Taylor (RB)"
                      date="April 4, 2025"
                    />
                    
                    <TransactionItem 
                      team="Blitz Brigade"
                      type="drop"
                      player="Mike Williams (WR - NYJ)"
                      date="April 4, 2025"
                    />
                    
                    <TransactionItem 
                      team="Goal Getters"
                      type="add"
                      player="Packers (DST - GB)"
                      date="April 3, 2025"
                    />
                    
                    <TransactionItem 
                      team="Victory Vipers"
                      type="trade"
                      player="Traded T.J. Hockenson (TE) for Diontae Johnson (WR)"
                      date="April 2, 2025"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const ActivityItem = ({ date, type, description }: { date: string; type: 'add' | 'drop' | 'trade'; description: string }) => {
  const getIconByType = () => {
    switch (type) {
      case 'add':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        );
      case 'drop':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        );
      case 'trade':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[hsl(var(--vibrant-purple))]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        );
    }
  };
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
        {getIconByType()}
      </div>
      <div className="flex-1">
        <p className="text-sm">{description}</p>
      </div>
      <div className="text-xs text-muted-foreground">{date}</div>
    </div>
  );
};

const ScheduleItem = ({ week, opponent, record, projection }: { week: string; opponent: string; record: string; projection: string }) => (
  <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
    <div className="w-12 text-xs font-medium">
      {week}
    </div>
    <div className="flex-1">
      <p className="font-medium">{opponent}</p>
      <p className="text-xs text-muted-foreground">{record}</p>
    </div>
    <div className="text-xs text-muted-foreground">{projection}</div>
  </div>
);

const NewsItem = ({ title, date, description, impact }: { title: string; date: string; description: string; impact: 'High' | 'Medium' | 'Low' }) => {
  const getImpactColor = () => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-orange-100 text-orange-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
    }
  };
  
  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor()}`}>
          {impact} Impact
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{description}</p>
      <p className="text-xs text-muted-foreground">{date}</p>
    </div>
  );
};

const TransactionItem = ({ team, type, player, date }: { team: string; type: 'add' | 'drop' | 'trade'; player: string; date: string }) => {
  const getTypeLabel = () => {
    switch (type) {
      case 'add':
        return <span className="text-green-600 font-medium">Added</span>;
      case 'drop':
        return <span className="text-red-600 font-medium">Dropped</span>;
      case 'trade':
        return <span className="text-[hsl(var(--vibrant-purple))] font-medium">Trade</span>;
    }
  };
  
  return (
    <div className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
      <div className="flex-1">
        <p className="font-medium">{team}</p>
        <p className="text-sm">
          {getTypeLabel()}: {player}
        </p>
      </div>
      <div className="text-xs text-muted-foreground">{date}</div>
    </div>
  );
};

export default GMOffice;
