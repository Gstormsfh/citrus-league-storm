import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Settings, 
  Users, 
  Clock, 
  Trophy, 
  Crown,
  UserPlus,
  Copy,
  Check,
  Hourglass
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  owner: string;
  color: string;
  picks: any[];
}

interface DraftSettings {
  rounds: number;
  pickTimeLimit: number;
  draftOrder: 'standard' | 'serpentine';
  scoringFormat: 'standard' | 'points' | 'categories';
}

interface DraftLobbyProps {
  teams: Team[];
  onStartDraft: (settings: DraftSettings) => void;
  isCommissioner: boolean;
}

export const DraftLobby = ({ teams, onStartDraft, isCommissioner }: DraftLobbyProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<DraftSettings>({
    rounds: 16,
    pickTimeLimit: 90,
    draftOrder: 'serpentine',
    scoringFormat: 'standard'
  });

  const draftCode = "DRAFT-2024-NHL";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(draftCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Draft code copied!",
      description: "Share this code with other managers to join the draft.",
    });
  };

  const handleStartDraft = () => {
    if (teams.length < 4) {
      toast({
        title: "Not enough teams",
        description: "You need at least 4 teams to start the draft.",
        variant: "destructive"
      });
      return;
    }
    onStartDraft(settings);
  };

  return (
    <div className="space-y-6">
      {/* Draft Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">NHL Fantasy Draft Lobby</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isCommissioner 
            ? "Configure your draft settings and wait for all managers to join before starting the draft."
            : "Waiting for the league commissioner to start the draft. Review the settings below."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draft Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Draft Settings
                {!isCommissioner && <Badge variant="secondary" className="ml-2">Read Only</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rounds">Number of Rounds</Label>
                  <Select 
                    value={settings.rounds.toString()} 
                    onValueChange={(value) => setSettings({...settings, rounds: parseInt(value)})}
                    disabled={!isCommissioner}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 Rounds</SelectItem>
                      <SelectItem value="16">16 Rounds</SelectItem>
                      <SelectItem value="20">20 Rounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timer">Pick Time Limit</Label>
                  <Select 
                    value={settings.pickTimeLimit.toString()} 
                    onValueChange={(value) => setSettings({...settings, pickTimeLimit: parseInt(value)})}
                    disabled={!isCommissioner}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="90">90 seconds</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="180">3 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Draft Order</Label>
                  <Select 
                    value={settings.draftOrder} 
                    onValueChange={(value: 'standard' | 'serpentine') => setSettings({...settings, draftOrder: value})}
                    disabled={!isCommissioner}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (1-8, 1-8, 1-8...)</SelectItem>
                      <SelectItem value="serpentine">Serpentine (1-8, 8-1, 1-8...)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scoring">Scoring Format</Label>
                  <Select 
                    value={settings.scoringFormat} 
                    onValueChange={(value: 'standard' | 'points' | 'categories') => setSettings({...settings, scoringFormat: value})}
                    disabled={!isCommissioner}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="points">Points Only</SelectItem>
                      <SelectItem value="categories">Categories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Draft Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{teams.length}</div>
                  <div className="text-sm text-muted-foreground">Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{settings.rounds}</div>
                  <div className="text-sm text-muted-foreground">Rounds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{settings.pickTimeLimit}s</div>
                  <div className="text-sm text-muted-foreground">Per Pick</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{teams.length * settings.rounds}</div>
                  <div className="text-sm text-muted-foreground">Total Picks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Draft Participants ({teams.length}/12)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teams.map((team, index) => (
                  <div key={team.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: team.color }}
                      />
                      {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">{team.owner}</div>
                    </div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 12 - teams.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <div className="text-muted-foreground">Waiting for manager...</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Join Draft */}
          <Card>
            <CardHeader>
              <CardTitle>Invite Managers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Draft Code</Label>
                <div className="flex gap-2">
                  <Input value={draftCode} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Share this code with other managers so they can join your draft.
              </div>
            </CardContent>
          </Card>

          {/* Start Draft or Waiting Status */}
          {isCommissioner ? (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Draft?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Teams joined:</span>
                    <span className="font-medium">{teams.length}/12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Minimum required:</span>
                    <span className="font-medium">4</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleStartDraft}
                  className="w-full"
                  disabled={teams.length < 4}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Draft
                </Button>
                
                {teams.length < 4 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Need at least 4 teams to start
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Hourglass className="h-5 w-5" />
                    Waiting to Start
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The commissioner will start the draft once all teams have joined.
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="w-2 h-2 bg-primary rounded-full delay-75"></div>
                      <div className="w-2 h-2 bg-primary rounded-full delay-150"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Not in this league?</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/create-league')}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Create New League
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Draft Info */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Estimated time: {Math.ceil((teams.length * settings.rounds * settings.pickTimeLimit) / 60)} minutes
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {settings.draftOrder === 'serpentine' ? 'Serpentine' : 'Standard'} draft order
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
