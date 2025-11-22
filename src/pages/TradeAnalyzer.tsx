import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';

const TradeAnalyzer = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Trade Analyzer</h1>
              <p className="text-lg text-muted-foreground">
                Evaluate trade proposals with advanced analytics
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Your Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search your players..." className="pl-10" />
                    </div>
                    <div className="space-y-2">
                      {['Nathan MacKinnon', 'Leon Draisaitl', 'Cale Makar'].map((player) => (
                        <div key={player} className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="font-medium">{player}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Their Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search their players..." className="pl-10" />
                    </div>
                    <div className="space-y-2">
                      {['Connor McDavid', 'Auston Matthews', 'Quinn Hughes'].map((player) => (
                        <div key={player} className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="font-medium">{player}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mb-8">
              <Button size="lg" className="gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Analyze Trade
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trade Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Your Team Impact</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Goals per Week</span>
                        <div className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">+2.3</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Assists per Week</span>
                        <div className="flex items-center gap-2 text-red-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="font-medium">-1.8</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Overall Value</span>
                        <div className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">+5.2%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Their Team Impact</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Goals per Week</span>
                        <div className="flex items-center gap-2 text-red-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="font-medium">-1.9</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Assists per Week</span>
                        <div className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">+2.1</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">Overall Value</span>
                        <div className="flex items-center gap-2 text-red-600">
                          <TrendingDown className="h-4 w-4" />
                          <span className="font-medium">-3.8%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-sm font-medium text-green-600 mb-1">Trade Recommendation</div>
                  <div className="text-sm">This trade appears favorable for your team, providing a net positive impact on your roster.</div>
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

export default TradeAnalyzer;
