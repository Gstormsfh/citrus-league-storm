import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { StatsOverviewCards } from '@/components/gm-office/StatsOverviewCards';
import { ActionsSidebar } from '@/components/gm-office/ActionsSidebar';
import { ActivityFeed } from '@/components/gm-office/ActivityFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GMOffice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--vibrant-orange))] via-primary to-[hsl(var(--vibrant-purple))] inline-block text-transparent bg-clip-text">
              GM's Office
            </h1>
            <p className="text-lg text-muted-foreground">
              Your command center for team management and strategy
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 space-y-8">
              <StatsOverviewCards />
              <ActivityFeed />
            </div>
            
            <div className="space-y-8">
              <ActionsSidebar />
            </div>
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
