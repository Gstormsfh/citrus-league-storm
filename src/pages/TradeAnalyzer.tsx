import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  ArrowLeftRight, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  UserPlus, 
  UserMinus,
  Scale
} from 'lucide-react';

// Mock Types
interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  avatar?: string;
  stats: {
    goals: number;
    assists: number;
    points: number;
    avgPoints: number;
  };
  value: number; // Hidden trade value metric
  trend: 'up' | 'down' | 'neutral';
}

interface Team {
  id: string;
  name: string;
  manager: string;
  record: string;
  avatar?: string;
  logo?: string;
  roster: Player[];
}

// Mock Data
const MY_TEAM_ROSTER: Player[] = [
  { id: 1, name: 'Connor McDavid', position: 'C', team: 'EDM', value: 98, stats: { goals: 32, assists: 100, points: 132, avgPoints: 4.5 }, trend: 'up', avatar: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?auto=format&fit=crop&w=100&h=100' },
  { id: 2, name: 'Leon Draisaitl', position: 'C', team: 'EDM', value: 92, stats: { goals: 52, assists: 76, points: 128, avgPoints: 3.9 }, trend: 'neutral', avatar: 'https://images.unsplash.com/photo-1580064003896-8eba6fc5435f?auto=format&fit=crop&w=100&h=100' },
  { id: 3, name: 'Evan Bouchard', position: 'D', team: 'EDM', value: 85, stats: { goals: 18, assists: 64, points: 82, avgPoints: 2.8 }, trend: 'up' },
  { id: 4, name: 'Stuart Skinner', position: 'G', team: 'EDM', value: 78, stats: { goals: 0, assists: 2, points: 2, avgPoints: 3.1 }, trend: 'down' },
  { id: 5, name: 'Zach Hyman', position: 'LW', team: 'EDM', value: 84, stats: { goals: 54, assists: 23, points: 77, avgPoints: 3.2 }, trend: 'up' },
  { id: 101, name: 'Ryan Nugent-Hopkins', position: 'LW', team: 'EDM', value: 79, stats: { goals: 18, assists: 49, points: 67, avgPoints: 2.4 }, trend: 'neutral' },
  { id: 102, name: 'Mattias Ekholm', position: 'D', team: 'EDM', value: 76, stats: { goals: 11, assists: 34, points: 45, avgPoints: 2.1 }, trend: 'up' },
];

const OPPONENT_TEAMS: Team[] = [
  {
    id: 't2',
    name: 'Touchdown Titans',
    manager: 'Alex Johnson',
    record: '9-1-0',
    avatar: 'TT',
    logo: 'https://images.unsplash.com/photo-1606131731446-5568d87113aa?q=80&w=400&auto=format&fit=crop',
    roster: [
      { id: 6, name: 'Auston Matthews', position: 'C', team: 'TOR', value: 97, stats: { goals: 69, assists: 38, points: 107, avgPoints: 4.8 }, trend: 'up', avatar: 'https://images.unsplash.com/photo-1580064003896-8eba6fc5435f?auto=format&fit=crop&w=100&h=100' },
      { id: 7, name: 'Mitch Marner', position: 'RW', team: 'TOR', value: 89, stats: { goals: 26, assists: 59, points: 85, avgPoints: 3.5 }, trend: 'neutral' },
      { id: 8, name: 'William Nylander', position: 'RW', team: 'TOR', value: 88, stats: { goals: 40, assists: 58, points: 98, avgPoints: 3.6 }, trend: 'up' },
      { id: 9, name: 'Morgan Rielly', position: 'D', team: 'TOR', value: 82, stats: { goals: 7, assists: 51, points: 58, avgPoints: 2.4 }, trend: 'down' },
      { id: 10, name: 'John Tavares', position: 'C', team: 'TOR', value: 80, stats: { goals: 29, assists: 36, points: 65, avgPoints: 2.8 }, trend: 'down' },
    ]
  },
  {
    id: 't3',
    name: 'Scoring Sharks',
    manager: 'Samantha Lee',
    record: '8-2-0',
    avatar: 'SS',
    logo: 'https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?q=80&w=400&auto=format&fit=crop',
    roster: [
      { id: 11, name: 'Nathan MacKinnon', position: 'C', team: 'COL', value: 99, stats: { goals: 51, assists: 89, points: 140, avgPoints: 5.1 }, trend: 'up' },
      { id: 12, name: 'Cale Makar', position: 'D', team: 'COL', value: 96, stats: { goals: 21, assists: 69, points: 90, avgPoints: 4.2 }, trend: 'up' },
      { id: 13, name: 'Mikko Rantanen', position: 'RW', team: 'COL', value: 91, stats: { goals: 42, assists: 62, points: 104, avgPoints: 3.9 }, trend: 'neutral' },
      { id: 14, name: 'Devon Toews', position: 'D', team: 'COL', value: 78, stats: { goals: 12, assists: 38, points: 50, avgPoints: 2.2 }, trend: 'neutral' },
    ]
  },
  {
    id: 't4',
    name: 'Blitz Brigade',
    manager: 'Taylor Kim',
    record: '5-5-0',
    avatar: 'BB',
    logo: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?q=80&w=400&auto=format&fit=crop',
    roster: [
      { id: 15, name: 'Quinn Hughes', position: 'D', team: 'VAN', value: 94, stats: { goals: 17, assists: 75, points: 92, avgPoints: 3.8 }, trend: 'up' },
      { id: 16, name: 'Elias Pettersson', position: 'C', team: 'VAN', value: 88, stats: { goals: 34, assists: 55, points: 89, avgPoints: 3.4 }, trend: 'down' },
      { id: 17, name: 'J.T. Miller', position: 'C', team: 'VAN', value: 90, stats: { goals: 37, assists: 66, points: 103, avgPoints: 3.7 }, trend: 'up' },
      { id: 18, name: 'Thatcher Demko', position: 'G', team: 'VAN', value: 86, stats: { goals: 0, assists: 1, points: 1, avgPoints: 4.5 }, trend: 'neutral' },
    ]
  }
];

const TradeAnalyzer = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [mySelectedPlayers, setMySelectedPlayers] = useState<number[]>([]);
  const [theirSelectedPlayers, setTheirSelectedPlayers] = useState<number[]>([]);
  const [searchMyTeam, setSearchMyTeam] = useState("");
  const [searchTheirTeam, setSearchTheirTeam] = useState("");

  const selectedPartnerTeam = useMemo(() => 
    OPPONENT_TEAMS.find(t => t.id === selectedTeamId), 
    [selectedTeamId]
  );

  const toggleMyPlayer = (id: number) => {
    setMySelectedPlayers(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleTheirPlayer = (id: number) => {
    setTheirSelectedPlayers(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getPlayerById = (id: number, roster: Player[]) => roster.find(p => p.id === id);

  const myAssets = mySelectedPlayers
    .map(id => getPlayerById(id, MY_TEAM_ROSTER))
    .filter((p): p is Player => !!p);

  const theirAssets = selectedPartnerTeam 
    ? theirSelectedPlayers
        .map(id => getPlayerById(id, selectedPartnerTeam.roster))
        .filter((p): p is Player => !!p)
    : [];

  const myTotalValue = myAssets.reduce((sum, p) => sum + p.value, 0);
  const theirTotalValue = theirAssets.reduce((sum, p) => sum + p.value, 0);
  const valueDiff = theirTotalValue - myTotalValue;
  const isFair = Math.abs(valueDiff) < 10;
  
  const filteredMyTeam = MY_TEAM_ROSTER.filter(p => 
    !mySelectedPlayers.includes(p.id) && 
    p.name.toLowerCase().includes(searchMyTeam.toLowerCase())
  );

  const filteredTheirTeam = selectedPartnerTeam?.roster.filter(p => 
    !theirSelectedPlayers.includes(p.id) &&
    p.name.toLowerCase().includes(searchTheirTeam.toLowerCase())
  ) || [];

  const getTradeOpinion = () => {
    if (myAssets.length === 0 && theirAssets.length === 0) return "Select players to analyze trade.";
    
    // Positional Analysis
    const myPositions = myAssets.reduce((acc, p) => ({ ...acc, [p.position]: (acc[p.position] || 0) + 1 }), {} as Record<string, number>);
    const theirPositions = theirAssets.reduce((acc, p) => ({ ...acc, [p.position]: (acc[p.position] || 0) + 1 }), {} as Record<string, number>);
    
    const gainingForwards = (theirPositions['C'] || 0) + (theirPositions['LW'] || 0) + (theirPositions['RW'] || 0);
    const losingForwards = (myPositions['C'] || 0) + (myPositions['LW'] || 0) + (myPositions['RW'] || 0);
    const gainingDefense = (theirPositions['D'] || 0);
    const losingDefense = (myPositions['D'] || 0);

    // Stat Impact
    const myGoals = myAssets.reduce((sum, p) => sum + p.stats.goals, 0);
    const theirGoals = theirAssets.reduce((sum, p) => sum + p.stats.goals, 0);
    const goalsDiff = theirGoals - myGoals;

    let narrative = "This trade offers an interesting shift in your team's composition. ";

    if (gainingDefense > losingDefense && losingForwards > gainingForwards) {
        narrative += "You are bolstering your defensive core at the expense of some offensive firepower. This could stabilize your weekly floor but might lower your scoring ceiling. ";
    } else if (gainingForwards > losingForwards && losingDefense > gainingDefense) {
        narrative += "You are adding significant offensive depth, but be careful not to leave your defense too thin. Ensure you have waiver wire options to fill the gap. ";
    } else if (gainingForwards === losingForwards && gainingDefense === losingDefense) {
        narrative += "This is a direct positional swap. You're betting on better performance from the incoming players. ";
    }

    if (goalsDiff > 5) {
        narrative += "You're gaining significant goal-scoring upside here. ";
    } else if (goalsDiff < -5) {
        narrative += "Note that you are trading away a primary goal scorer. ";
    }

    if (isFair) {
        narrative += "Overall, the value exchange is quite balanced, making this a fair proposal for both sides.";
    } else if (valueDiff > 15) {
        narrative += "From a pure value perspective, you are coming out ahead, acquiring more proven assets.";
    } else if (valueDiff < -15) {
        narrative += "You are giving up more established value. Make sure you believe in the upside of the players you are receiving.";
    } else {
        narrative += "The value is relatively close, so this comes down to team needs and personal preference.";
    }

    return narrative;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Trade Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Architect the perfect deal with AI-powered analysis.
            </p>
          </div>
          
          <div className="w-full md:w-72">
             <Select value={selectedTeamId} onValueChange={(val) => {
               setSelectedTeamId(val);
               setTheirSelectedPlayers([]);
             }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Trading Partner" />
              </SelectTrigger>
              <SelectContent>
                {OPPONENT_TEAMS.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      {team.logo ? (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={team.logo} />
                          <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <Badge variant="outline" className="w-8 justify-center">{team.avatar || team.name.substring(0,2)}</Badge>
                      )}
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-240px)] min-h-[600px]">
          {/* Left Column: My Team */}
          <Card className="lg:col-span-3 flex flex-col h-full border-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge className="bg-primary">You</Badge> My Team
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search players..." 
                  className="pl-8" 
                  value={searchMyTeam}
                  onChange={(e) => setSearchMyTeam(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-4 pb-4">
                <div className="space-y-2">
                  {filteredMyTeam.map(player => (
                    <div 
                      key={player.id} 
                      onClick={() => toggleMyPlayer(player.id)}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.position} • Avg {player.stats.avgPoints}</div>
                        </div>
                      </div>
                      <UserPlus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  {filteredMyTeam.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground text-sm">No players found</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Middle Column: Trade Deck */}
          <div className="lg:col-span-6 flex flex-col gap-6 h-full overflow-y-auto">
            {/* Trade Area */}
            <Card className="flex-1 border-primary/20 shadow-md flex flex-col">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" /> Trade Proposal
                  </CardTitle>
                  {selectedPartnerTeam && (
                    <Badge variant={isFair ? "secondary" : "outline"} className="text-xs">
                      {Math.abs(valueDiff) < 5 ? "Balanced Deal" : "Trade Impact Analysis"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-6 grid md:grid-cols-2 gap-8 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 bg-background border rounded-full items-center justify-center shadow-sm">
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Receiving */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> You Receive
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">Val: {theirTotalValue}</span>
                  </div>
                  <div className="min-h-[120px] space-y-2">
                    {theirAssets.length === 0 ? (
                      <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm p-8">
                        Select players from {selectedPartnerTeam ? selectedPartnerTeam.name : 'opponent'}
                      </div>
                    ) : (
                      theirAssets.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="h-5 px-1 text-[10px]">{p.position}</Badge>
                             <span className="text-sm font-medium">{p.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => toggleTheirPlayer(p.id)}>
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Giving */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-red-500 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" /> You Send
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">Val: {myTotalValue}</span>
                  </div>
                  <div className="min-h-[120px] space-y-2">
                    {myAssets.length === 0 ? (
                      <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm p-8">
                        Select players to trade away
                      </div>
                    ) : (
                      myAssets.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="h-5 px-1 text-[10px]">{p.position}</Badge>
                             <span className="text-sm font-medium">{p.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => toggleMyPlayer(p.id)}>
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Section */}
            <Card className="bg-slate-950 text-slate-50 border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-blue-400" /> Stormy's Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {getTradeOpinion()}
                  </p>
                  
                  {(myAssets.length > 0 || theirAssets.length > 0) && (
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                         <div className="text-xs text-slate-400 uppercase tracking-wider">Goals Diff</div>
                         <div className={`text-lg font-bold ${(theirAssets.reduce((s,p)=>s+p.stats.goals,0) - myAssets.reduce((s,p)=>s+p.stats.goals,0)) > 0 ? 'text-green-400' : 'text-slate-200'}`}>
                           {(theirAssets.reduce((s,p)=>s+p.stats.goals,0) - myAssets.reduce((s,p)=>s+p.stats.goals,0)) > 0 ? '+' : ''}
                           {theirAssets.reduce((s,p)=>s+p.stats.goals,0) - myAssets.reduce((s,p)=>s+p.stats.goals,0)}
                         </div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Avg Pts</div>
                        <div className="text-lg font-bold text-slate-200">
                            {((theirAssets.reduce((s,p)=>s+p.stats.avgPoints,0) / (theirAssets.length || 1)) - (myAssets.reduce((s,p)=>s+p.stats.avgPoints,0) / (myAssets.length || 1))).toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Structure</div>
                        <div className="text-lg font-bold text-blue-400">
                             {myAssets.length === theirAssets.length ? "Swap" : myAssets.length > theirAssets.length ? "Consolidate" : "Depth"}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-2" disabled={myAssets.length === 0 && theirAssets.length === 0}>
                    Submit Official Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Their Team */}
          <Card className={`lg:col-span-3 flex flex-col h-full border-primary/10 shadow-sm transition-opacity ${!selectedPartnerTeam ? 'opacity-60 pointer-events-none' : ''}`}>
            <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                {selectedPartnerTeam ? (
                   <>
                     {selectedPartnerTeam.logo ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedPartnerTeam.logo} />
                          <AvatarFallback>{selectedPartnerTeam.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                     ) : (
                        <Badge variant="secondary">{selectedPartnerTeam.avatar}</Badge> 
                     )}
                     <span className="truncate">{selectedPartnerTeam.name}</span>
                   </>
                ) : (
                  "Partner Team"
                )}
              </CardTitle>
               <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search their players..." 
                  className="pl-8"
                  value={searchTheirTeam}
                  onChange={(e) => setSearchTheirTeam(e.target.value)}
                  disabled={!selectedPartnerTeam}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
               {selectedPartnerTeam ? (
                  <ScrollArea className="h-full px-4 pb-4">
                    <div className="space-y-2">
                      {filteredTheirTeam.map(player => (
                        <div 
                          key={player.id} 
                          onClick={() => toggleTheirPlayer(player.id)}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback>{player.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{player.name}</div>
                              <div className="text-xs text-muted-foreground">{player.position} • Avg {player.stats.avgPoints}</div>
                            </div>
                          </div>
                          <UserPlus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                      {filteredTheirTeam.length === 0 && (
                        <div className="text-center p-4 text-muted-foreground text-sm">No players found</div>
                      )}
                    </div>
                  </ScrollArea>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                   <ArrowLeftRight className="h-12 w-12 mb-4 opacity-20" />
                   <p>Select a trading partner to view their roster</p>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TradeAnalyzer;
