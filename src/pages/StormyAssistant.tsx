import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Brain, Zap, MessageSquare, Clock, Shield, Settings, Crown } from 'lucide-react';

const StormyAssistant = () => {
  const usageStats = {
    weeklyRequests: 14,
    weeklyLimit: 50,
    resetDate: "Monday at 3:00 AM"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-purple-600 mb-4 shadow-lg shadow-primary/20">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Stormy Settings</h1>
            <p className="text-lg text-muted-foreground">
              Manage your AI assistant preferences and usage
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Usage Card */}
            <Card className="border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Weekly Usage
                </CardTitle>
                <CardDescription>Requests remaining this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {usageStats.weeklyRequests}<span className="text-xl text-muted-foreground font-normal">/{usageStats.weeklyLimit}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Requests Used</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Usage Level</span>
                    <span>{Math.round((usageStats.weeklyRequests / usageStats.weeklyLimit) * 100)}%</span>
                  </div>
                  <Progress value={(usageStats.weeklyRequests / usageStats.weeklyLimit) * 100} className="h-2" />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Resets on:</span>
                  </div>
                  <span className="font-medium">{usageStats.resetDate}</span>
                </div>

                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Unlimited
                </Button>
              </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card className="border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Configuration
                </CardTitle>
                <CardDescription>Customize Stormy's behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Proactive Hints</Label>
                    <p className="text-sm text-muted-foreground">
                      Show suggestion bubbles on new pages
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Trade Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when a fair trade is found
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Personality Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable humorous / trash-talk style
                    </p>
                  </div>
                  <Switch />
                </div>

                 <div className="pt-4 border-t">
                   <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                     <Shield className="h-4 w-4 text-primary" /> Data & Privacy
                   </h4>
                   <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                     Stormy analyzes your league data to provide insights. Your chat history is stored privately to improve future recommendations.
                   </p>
                   <Button variant="outline" size="sm" className="w-full">Clear Chat History</Button>
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

export default StormyAssistant;
