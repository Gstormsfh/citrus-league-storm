
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const TeamSettings = () => {
  const [teamName, setTeamName] = useState('Citrus Crushers');
  const [teamAbbreviation, setTeamAbbreviation] = useState('CC');
  const [teamDescription, setTeamDescription] = useState('A fierce competitor with a zesty strategy.');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  const { toast } = useToast();
  
  const handleSaveTeamInfo = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Team information updated",
      description: "Your team details have been saved successfully.",
      variant: "default"
    });
  };
  
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Notification preferences updated",
      description: "Your notification settings have been saved.",
      variant: "default"
    });
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10 animated-element">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 vibrant-gradient-2 bg-clip-text text-transparent">
              Team Settings
            </h1>
            <p className="text-lg text-muted-foreground">
              Customize your team profile and preferences
            </p>
          </div>
          
          <Tabs defaultValue="team-info" className="max-w-4xl mx-auto animated-element">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="team-info">Team Info</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="team-info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                  <CardDescription>
                    Update your team name, abbreviation, and description
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveTeamInfo} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="team-name">Team Name</Label>
                        <Input 
                          id="team-name" 
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="bg-background"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team-abbr">Team Abbreviation</Label>
                        <Input 
                          id="team-abbr" 
                          value={teamAbbreviation}
                          onChange={(e) => setTeamAbbreviation(e.target.value)}
                          maxLength={4}
                          className="bg-background"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Maximum 4 characters</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="team-description">Team Description</Label>
                      <Textarea 
                        id="team-description" 
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        className="min-h-32 bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Team Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          <img src="https://images.unsplash.com/photo-1617777938240-9a1d8e3ba07c?q=80&w=400&auto=format&fit=crop" alt="Team Logo" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <Button type="button" variant="outline" className="mb-2 bg-background">
                            Upload New Logo
                          </Button>
                          <p className="text-xs text-muted-foreground">Recommended size: 400x400 pixels</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" className="btn-vibrant-orange">
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>League Information</CardTitle>
                  <CardDescription>
                    Details about your fantasy league
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1">League Name</h3>
                        <p className="text-muted-foreground">CitrusSports Pro League</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">League ID</h3>
                        <p className="text-muted-foreground">CSP-2025-19487</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">League Type</h3>
                        <p className="text-muted-foreground">Head-to-Head Points</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Season</h3>
                        <p className="text-muted-foreground">2025</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Teams</h3>
                        <p className="text-muted-foreground">9 teams</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Commissioner</h3>
                        <p className="text-muted-foreground">Alex Johnson</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                      <Button variant="outline" className="bg-background">
                        View League Rules
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme & Appearance</CardTitle>
                  <CardDescription>
                    Customize how your team dashboard looks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Team Colors</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <ColorOption 
                          name="Citrus Green" 
                          color="bg-primary" 
                          isSelected={true}
                        />
                        <ColorOption 
                          name="Vibrant Orange" 
                          color="bg-[hsl(var(--vibrant-orange))]"
                          isSelected={false}
                        />
                        <ColorOption 
                          name="Vibrant Purple" 
                          color="bg-[hsl(var(--vibrant-purple))]"
                          isSelected={false}
                        />
                        <ColorOption 
                          name="Vibrant Magenta" 
                          color="bg-[hsl(var(--vibrant-magenta))]"
                          isSelected={false}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium mb-3">Display Options</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dark-mode">Dark Mode</Label>
                          <p className="text-sm text-muted-foreground">Switch between light and dark theme</p>
                        </div>
                        <Switch id="dark-mode" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="compact-view">Compact View</Label>
                          <p className="text-sm text-muted-foreground">Display more information in less space</p>
                        </div>
                        <Switch id="compact-view" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="animations">Animations</Label>
                          <p className="text-sm text-muted-foreground">Enable animation effects throughout the site</p>
                        </div>
                        <Switch id="animations" defaultChecked />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button className="btn-vibrant-orange">
                        Save Appearance Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Control how and when you receive updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveNotifications} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Email Notifications</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch 
                          id="email-notifications" 
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                      
                      {emailNotifications && (
                        <div className="pl-6 space-y-3 border-l-2 border-muted">
                          <NotificationOption 
                            id="email-matchups"
                            label="Matchup Reminders"
                            description="Receive reminders before your weekly matchup"
                            defaultChecked={true}
                          />
                          
                          <NotificationOption 
                            id="email-injuries"
                            label="Injury Updates"
                            description="Get notified when your players are injured"
                            defaultChecked={true}
                          />
                          
                          <NotificationOption 
                            id="email-transactions"
                            label="League Transactions"
                            description="Updates about trades, adds, and drops in your league"
                            defaultChecked={false}
                          />
                          
                          <NotificationOption 
                            id="email-news"
                            label="Fantasy News"
                            description="General fantasy news and tips"
                            defaultChecked={false}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Push Notifications</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push-notifications">Enable Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive updates on your device</p>
                        </div>
                        <Switch 
                          id="push-notifications" 
                          checked={pushNotifications}
                          onCheckedChange={setPushNotifications}
                        />
                      </div>
                      
                      {pushNotifications && (
                        <div className="pl-6 space-y-3 border-l-2 border-muted">
                          <NotificationOption 
                            id="push-scoring"
                            label="Live Scoring Updates"
                            description="Get real-time updates during games"
                            defaultChecked={true}
                          />
                          
                          <NotificationOption 
                            id="push-injuries"
                            label="Breaking Injury News"
                            description="Immediate alerts for injuries to your players"
                            defaultChecked={true}
                          />
                          
                          <NotificationOption 
                            id="push-transactions"
                            label="Transaction Alerts"
                            description="Be notified of league transactions"
                            defaultChecked={false}
                          />
                          
                          <NotificationOption 
                            id="push-messages"
                            label="League Messages"
                            description="Notifications for new league messages"
                            defaultChecked={true}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-border flex justify-end">
                      <Button type="submit" className="btn-vibrant-orange">
                        Save Notification Settings
                      </Button>
                    </div>
                  </form>
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

const ColorOption = ({ name, color, isSelected }: { name: string; color: string; isSelected: boolean }) => (
  <div className={`p-3 rounded-md border ${isSelected ? 'border-primary' : 'border-transparent hover:border-border'} cursor-pointer`}>
    <div className={`w-full h-12 rounded-md ${color} mb-2`}></div>
    <p className="text-sm font-medium">{name}</p>
    {isSelected && (
      <div className="flex items-center text-xs text-primary mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Selected
      </div>
    )}
  </div>
);

const NotificationOption = ({ id, label, description, defaultChecked }: { id: string; label: string; description: string; defaultChecked: boolean }) => (
  <div className="flex items-center justify-between">
    <div>
      <Label htmlFor={id} className="font-normal">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch id={id} defaultChecked={defaultChecked} />
  </div>
);

export default TeamSettings;
