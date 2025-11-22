import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Settings, 
  Trophy, 
  Calendar, 
  Target, 
  TrendingUp, 
  Medal, 
  Users, 
  Edit3,
  Camera,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  CreditCard,
  History,
  Lock,
  Smartphone,
  Check,
  Crown
} from 'lucide-react';

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Active Tab State Management
  const [activeTab, setActiveTab] = useState('overview');
  
  // Animation observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Small delay to ensure DOM is updated after tab switch
    const timeoutId = setTimeout(() => {
      const animatedElements = document.querySelectorAll('.animated-element');
      animatedElements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [activeTab]);
  
  // User & Team Data
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    bio: 'Fantasy sports enthusiast with 8+ years of experience. Love analyzing player stats and finding hidden gems.',
    teamName: 'Thunder Bolts',
    teamAbbr: 'TB',
    favoriteTeam: 'New York Rangers',
    teamDescription: 'A fierce competitor with a zesty strategy.'
  });

  // Password Management
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    autoLineup: false,
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    publicProfile: true
  });

  const userStats = {
    totalSeasons: 8,
    championships: 2,
    playoffAppearances: 6,
    overallRecord: '142-86',
    currentRank: 3,
    bestFinish: 1,
    totalPoints: 12847,
    avgPointsPerGame: 118.4
  };

  const achievements = [
    { title: 'League Champion', year: '2023', icon: Trophy, color: 'text-yellow-500' },
    { title: 'Playoff Streak', description: '5 consecutive years', icon: Target, color: 'text-blue-500' },
    { title: 'High Scorer', description: 'Most points in week 12', icon: TrendingUp, color: 'text-green-500' },
    { title: 'Draft Master', description: 'Best draft grade 2024', icon: Medal, color: 'text-purple-500' }
  ];

  const recentActivity = [
    { action: 'Won matchup vs Storm Riders', points: '124.3 - 98.7', date: '3 days ago' },
    { action: 'Picked up Tyler Lockett from waivers', date: '5 days ago' },
    { action: 'Traded Mike Evans for Josh Jacobs', date: '1 week ago' },
    { action: 'Won matchup vs Lightning Bolts', points: '132.1 - 119.8', date: '1 week ago' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    toast({
      title: "Preference updated",
      description: "Your settings have been saved automatically.",
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
      variant: "default"
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
      variant: "default"
    });
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4 animated-element">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop" alt="John Smith" />
                      <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">JS</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{formData.firstName} {formData.lastName}</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4" />
                      {formData.teamName} • League Member since 2016
                    </p>
                        <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                        <Trophy className="h-3 w-3 mr-1" />
                        2x Stanley Cup
                      </Badge>
                      <Badge variant="outline">Premium Member</Badge>
                    </div>
                  </div>
                </div>
                
                <TabsList className="animated-element w-full lg:w-auto grid grid-cols-4 lg:flex">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                  <TabsTrigger value="achievements">Trophies</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="animated-element">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                          </CardTitle>
                          <CardDescription>Your basic profile details</CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            {isEditing ? (
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1">{formData.firstName}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            {isEditing ? (
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1">{formData.lastName}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {isEditing ? (
                              <Input 
                                value={formData.email} 
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span>{formData.email}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {isEditing ? (
                              <Input 
                                value={formData.phone} 
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span>{formData.phone}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {isEditing ? (
                              <Input 
                                value={formData.location} 
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="h-8"
                              />
                            ) : (
                              <span>{formData.location}</span>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          {isEditing ? (
                            <Textarea
                              id="bio"
                              value={formData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              className="w-full min-h-[80px] mt-1"
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">{formData.bio}</p>
                          )}
                        </div>

                        {isEditing && (
                          <div className="flex gap-2 pt-4">
                            <Button onClick={handleSave}>Save Changes</Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="animated-element">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{activity.action}</p>
                                {activity.points && (
                                  <p className="text-sm text-primary font-medium">{activity.points}</p>
                                )}
                                <p className="text-xs text-muted-foreground">{activity.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats Sidebar */}
                  <div className="space-y-6">
                    <Card className="animated-element">
                      <CardHeader>
                        <CardTitle className="text-lg">Season Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-lg bg-primary/5">
                            <div className="text-2xl font-bold text-primary">{userStats.currentRank}</div>
                            <div className="text-xs text-muted-foreground">Current Rank</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-green-500/5">
                            <div className="text-2xl font-bold text-green-600">{userStats.championships}</div>
                            <div className="text-xs text-muted-foreground">Championships</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Seasons</span>
                            <span className="font-medium">{userStats.totalSeasons}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Playoff Apps</span>
                            <span className="font-medium">{userStats.playoffAppearances}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Overall Record</span>
                            <span className="font-medium">{userStats.overallRecord}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="animated-element">
                      <CardHeader>
                        <CardTitle className="text-lg">Team Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Fantasy Team</Label>
                          <p className="font-medium">{formData.teamName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Favorite NHL Team</Label>
                          <p className="font-medium">{formData.favoriteTeam}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="animated-element">
                    <CardContent className="p-6 text-center">
                      <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <div className="text-2xl font-bold">{userStats.championships}</div>
                      <div className="text-sm text-muted-foreground">Championships</div>
                    </CardContent>
                  </Card>
                  <Card className="animated-element">
                    <CardContent className="p-6 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{userStats.playoffAppearances}</div>
                      <div className="text-sm text-muted-foreground">Playoff Apps</div>
                    </CardContent>
                  </Card>
                  <Card className="animated-element">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </CardContent>
                  </Card>
                  <Card className="animated-element">
                    <CardContent className="p-6 text-center">
                      <Medal className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <div className="text-2xl font-bold">{userStats.bestFinish}</div>
                      <div className="text-sm text-muted-foreground">Best Finish</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="animated-element">
                  <CardHeader>
                    <CardTitle>Performance History</CardTitle>
                    <CardDescription>Your finish position over the years</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { year: '2024', finish: 3, playoffs: true, points: 1642 },
                        { year: '2023', finish: 1, playoffs: true, points: 1789 },
                        { year: '2022', finish: 2, playoffs: true, points: 1701 },
                        { year: '2021', finish: 5, playoffs: true, points: 1534 },
                        { year: '2020', finish: 8, playoffs: false, points: 1423 }
                      ].map((season) => (
                        <div key={season.year} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-4">
                            <div className="text-lg font-bold w-12">{season.year}</div>
                            <div className="flex items-center gap-2">
                              {season.finish === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                              {season.playoffs && <Badge variant="outline" className="text-xs">Playoffs</Badge>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">#{season.finish}</div>
                            <div className="text-sm text-muted-foreground">{season.points} pts</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <Card key={index} className="animated-element hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg bg-accent/10`}>
                            <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{achievement.title}</h3>
                            {achievement.description && (
                              <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                            )}
                            {achievement.year && (
                              <Badge variant="secondary" className="text-xs">{achievement.year}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Account Settings */}
                  <Card className="animated-element lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Account Settings
                      </CardTitle>
                      <CardDescription>Manage your account details and login</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Personal Information</h3>
                          <div className="space-y-2">
                            <Label htmlFor="account-email">Email Address</Label>
                            <Input 
                              id="account-email" 
                              value={formData.email} 
                              onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="account-name">Display Name</Label>
                            <Input 
                              id="account-name" 
                              value={`${formData.firstName} ${formData.lastName}`} 
                              readOnly
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">To change your name, please visit the Overview tab.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Security</h3>
                          <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="current-password">Current Password</Label>
                              <Input 
                                id="current-password" 
                                type="password" 
                                value={passwords.current}
                                onChange={(e) => setPasswords(p => ({...p, current: e.target.value}))}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input 
                                  id="new-password" 
                                  type="password"
                                  value={passwords.new}
                                  onChange={(e) => setPasswords(p => ({...p, new: e.target.value}))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm</Label>
                                <Input 
                                  id="confirm-password" 
                                  type="password"
                                  value={passwords.confirm}
                                  onChange={(e) => setPasswords(p => ({...p, confirm: e.target.value}))}
                                />
                              </div>
                            </div>
                            <Button type="submit" variant="outline" size="sm" className="w-full">
                              Update Password
                            </Button>
                          </form>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Settings */}
                  <Card className="animated-element">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Team Settings
                      </CardTitle>
                      <CardDescription>Customize your team identity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="team-name">Team Name</Label>
                        <Input 
                          id="team-name" 
                          value={formData.teamName} 
                          onChange={(e) => handleInputChange('teamName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team-abbr">Abbreviation (3-4 chars)</Label>
                        <Input 
                          id="team-abbr" 
                          value={formData.teamAbbr} 
                          maxLength={4}
                          onChange={(e) => handleInputChange('teamAbbr', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team-desc">Team Slogan/Bio</Label>
                        <Textarea 
                          id="team-desc" 
                          value={formData.teamDescription} 
                          onChange={(e) => handleInputChange('teamDescription', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button onClick={() => toast({ title: "Team settings saved" })}>Save Team Details</Button>
                    </CardContent>
                  </Card>

                  {/* Game Preferences */}
                  <Card className="animated-element">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Game Preferences
                      </CardTitle>
                      <CardDescription>Manage automation and gameplay</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Auto-Set Lineups</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically optimize lineup based on projections
                          </p>
                        </div>
                        <Switch
                          checked={preferences.autoLineup}
                          onCheckedChange={(c) => handlePreferenceChange('autoLineup', c)}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive weekly summaries and alerts
                          </p>
                        </div>
                        <Switch
                          checked={preferences.emailNotifications}
                          onCheckedChange={(c) => handlePreferenceChange('emailNotifications', c)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Live scoring and injury alerts
                          </p>
                        </div>
                        <Switch
                          checked={preferences.pushNotifications}
                          onCheckedChange={(c) => handlePreferenceChange('pushNotifications', c)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subscription Plan */}
                  <Card className="animated-element lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Subscription Plan
                      </CardTitle>
                      <CardDescription>Manage your membership</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-primary/5 rounded-lg p-6 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Crown className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              Premium Plan
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Active</span>
                            </h3>
                            <p className="text-sm text-muted-foreground">Billed annually • Next billing date: Aug 15, 2026</p>
                          </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <Button variant="outline" className="flex-1 md:flex-none">Change Plan</Button>
                          <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 md:flex-none">Cancel</Button>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>Advanced Stats</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>Ad-free Experience</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>Priority Support</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>Trade Analyzer</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
