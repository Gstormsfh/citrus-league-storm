import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const TeamAnalytics = () => {
  const metrics = [
    { label: "Weekly Average", value: "125.3", change: "+8.2%", trend: "up" },
    { label: "Season Total", value: "1,878", change: "+12.5%", trend: "up" },
    { label: "Win Rate", value: "68%", change: "-4%", trend: "down" },
    { label: "Points Per Game", value: "7.8", change: "+2.1%", trend: "up" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Team Analytics</h1>
              <p className="text-lg text-muted-foreground">
                Deep dive into your team's performance metrics
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardDescription>{metric.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold">{metric.value}</div>
                      <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {metric.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Position Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Wingers', 'Centers', 'Defensemen', 'Goalies'].map((position) => (
                      <div key={position} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <span className="font-medium">{position}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">Avg Points: {Math.floor(Math.random() * 20 + 10)}</span>
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Trends</CardTitle>
                  <CardDescription>Performance over the last 8 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[65, 78, 82, 71, 88, 95, 89, 102].map((value, i) => (
                      <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/30 transition-colors rounded-t" style={{ height: `${value}%` }} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeamAnalytics;
