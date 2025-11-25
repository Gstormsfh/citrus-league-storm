import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DraftLobby } from '@/components/draft/DraftLobby';
import { DraftBoard } from '@/components/draft/DraftBoard';
import { PlayerPool } from '@/components/draft/PlayerPool';
import { TeamRosters } from '@/components/draft/TeamRosters';
import { DraftTimer } from '@/components/draft/DraftTimer';
import { DraftControls } from '@/components/draft/DraftControls';
import { DraftHistory } from '@/components/draft/DraftHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, Clock, Trophy, History, Settings, CheckCircle } from 'lucide-react';

interface DraftPick {
  id: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  position: string;
  round: number;
  pick: number;
  timestamp: number;
}

interface Team {
  id: string;
  name: string;
  owner: string;
  color: string;
  picks: DraftPick[];
}

interface DraftSettings {
  rounds: number;
  pickTimeLimit: number;
  draftOrder: 'standard' | 'serpentine';
  scoringFormat: 'standard' | 'points' | 'categories';
}

enum DraftPhase {
  LOBBY = 'lobby',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

const DraftRoom = () => {
  const [draftPhase, setDraftPhase] = useState<DraftPhase>(DraftPhase.LOBBY);
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [draftHistory, setDraftHistory] = useState<DraftPick[]>([]);
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [draftSettings, setDraftSettings] = useState<DraftSettings>({
    rounds: 16,
    pickTimeLimit: 90,
    draftOrder: 'serpentine',
    scoringFormat: 'standard'
  });

  // Mock teams data with Citrus Crushers as the user's team
  const teams: Team[] = [
    { id: '1', name: 'Citrus Crushers', owner: 'You', color: '#7CB518', picks: [] },
    { id: '2', name: 'Puck Dynasty', owner: 'Jane Smith', color: '#EF4444', picks: [] },
    { id: '3', name: 'Frozen Assets', owner: 'Mike Johnson', color: '#10B981', picks: [] },
    { id: '4', name: 'Slapshot Legends', owner: 'Sarah Wilson', color: '#F59E0B', picks: [] },
    { id: '5', name: 'Power Play', owner: 'Tom Brown', color: '#8B5CF6', picks: [] },
    { id: '6', name: 'Hat Trick Heroes', owner: 'Lisa Davis', color: '#EC4899', picks: [] },
    { id: '7', name: 'Crease Crashers', owner: 'Chris Lee', color: '#06B6D4', picks: [] },
    { id: '8', name: 'Penalty Box', owner: 'Alex Chen', color: '#84CC16', picks: [] },
  ];

  const currentTeam = teams[(currentPick - 1) % teams.length];

  useEffect(() => {
    if (draftPhase !== DraftPhase.ACTIVE || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-draft when time expires
          handleAutoDraft();
          return draftSettings.pickTimeLimit; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, draftPhase, currentPick, draftSettings.pickTimeLimit]);

  const handlePlayerDraft = (player: any) => {
    const pick: DraftPick = {
      id: `${currentRound}-${currentPick}`,
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      round: currentRound,
      pick: currentPick,
      timestamp: Date.now(),
    };

    setDraftHistory((prev) => [...prev, pick]);
    
    // Move to next pick
    const nextPick = currentPick + 1;
    const totalPicks = teams.length * draftSettings.rounds;
    
    if (nextPick > totalPicks) {
      setDraftPhase(DraftPhase.COMPLETED);
    } else {
      setCurrentPick(nextPick);
      if (nextPick > teams.length * currentRound) {
        setCurrentRound(currentRound + 1);
      }
      setTimeRemaining(draftSettings.pickTimeLimit);
    }
  };

  const handleAutoDraft = () => {
    // Auto-draft logic would go here
    console.log('Auto-drafting for', currentTeam.name);
  };

  const handleStartDraft = (settings: DraftSettings) => {
    setDraftSettings(settings);
    setTimeRemaining(settings.pickTimeLimit);
    setDraftPhase(DraftPhase.ACTIVE);
  };

  const handleToggleDraft = () => {
    if (draftPhase === DraftPhase.ACTIVE) {
      setDraftPhase(DraftPhase.LOBBY);
    } else if (draftPhase === DraftPhase.LOBBY) {
      setDraftPhase(DraftPhase.ACTIVE);
    }
  };

  // Helper to simulate a completed draft for demo purposes
  const simulateDraftCompletion = () => {
    setDraftPhase(DraftPhase.COMPLETED);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      
      {/* Dev Tool Toggle */}
      <div className="fixed bottom-4 right-4 z-50 bg-card border shadow-lg p-3 rounded-lg flex flex-col gap-2">
         <div className="text-xs font-bold text-muted-foreground mb-1">Developer Tools</div>
         <div className="flex items-center space-x-2">
            <Switch id="commissioner-mode" checked={isCommissioner} onCheckedChange={setIsCommissioner} />
            <Label htmlFor="commissioner-mode">Commissioner Mode</Label>
         </div>
         <Button size="xs" variant="outline" onClick={simulateDraftCompletion}>Simulate Completed Draft</Button>
      </div>

      <main className="pt-20">
        
        {/* LOBBY PHASE */}
        {draftPhase === DraftPhase.LOBBY && (
          <div className="container mx-auto px-4 py-8">
            <DraftLobby 
              teams={teams} 
              onStartDraft={handleStartDraft} 
              isCommissioner={isCommissioner}
            />
          </div>
        )}

        {/* ACTIVE PHASE */}
        {draftPhase === DraftPhase.ACTIVE && (
          <>
            {/* Draft Header */}
            <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border-b">
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">NHL Fantasy Draft Room</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{teams.length} Teams</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        <span>{draftSettings.rounds} Rounds</span>
                      </div>
                      <Badge variant="default">Draft Active</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <DraftTimer 
                      timeRemaining={timeRemaining}
                      isActive={draftPhase === DraftPhase.ACTIVE}
                    />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        Round {currentRound}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pick {currentPick}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-primary">Now Drafting:</span>
                      <span className="ml-2 font-bold">{currentTeam.name}</span>
                      <span className="ml-2 text-muted-foreground">({currentTeam.owner})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: currentTeam.color }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={handleAutoDraft}
                      >
                        Auto Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Draft Content */}
            <div className="container mx-auto px-4 py-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Draft Area */}
                <div className="xl:col-span-3">
                  <Tabs defaultValue="players" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="players" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Players
                      </TabsTrigger>
                      <TabsTrigger value="board" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Board
                      </TabsTrigger>
                      <TabsTrigger value="teams" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Teams
                      </TabsTrigger>
                      <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        History
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="players" className="space-y-0">
                      <PlayerPool 
                        onPlayerSelect={setSelectedPlayer}
                        onPlayerDraft={handlePlayerDraft}
                        selectedPlayer={selectedPlayer}
                        draftedPlayers={draftHistory.map(p => p.playerId)}
                        isDraftActive={draftPhase === DraftPhase.ACTIVE}
                      />
                    </TabsContent>

                    <TabsContent value="board" className="space-y-0">
                      <DraftBoard 
                        teams={teams}
                        draftHistory={draftHistory}
                        currentPick={currentPick}
                        currentRound={currentRound}
                      />
                    </TabsContent>

                    <TabsContent value="teams" className="space-y-0">
                      <TeamRosters 
                        teams={teams}
                        draftHistory={draftHistory}
                      />
                    </TabsContent>

                    <TabsContent value="history" className="space-y-0">
                      <DraftHistory draftHistory={draftHistory} />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {isCommissioner && (
                     <DraftControls 
                       isDraftActive={draftPhase === DraftPhase.ACTIVE}
                       onToggleDraft={handleToggleDraft}
                     />
                  )}
                  
                  {selectedPlayer && (
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4">Selected Player</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{selectedPlayer.name}</span>
                          <Badge variant="outline">{selectedPlayer.position}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedPlayer.team} • {selectedPlayer.age} years old
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Goals</div>
                            <div className="font-medium">{selectedPlayer.goals}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Assists</div>
                            <div className="font-medium">{selectedPlayer.assists}</div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handlePlayerDraft(selectedPlayer)}
                          className="w-full"
                          disabled={draftHistory.some(p => p.playerId === selectedPlayer.id)}
                        >
                          Draft Player
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* COMPLETED PHASE - DRAFT SUMMARY */}
        {draftPhase === DraftPhase.COMPLETED && (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8" />
               </div>
               <h1 className="text-4xl font-bold mb-2">Draft Completed!</h1>
               <p className="text-muted-foreground max-w-2xl mx-auto">
                 The 2025 Season Draft is officially in the books. Check out your roster and league results below.
               </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
               <Card className="card-citrus border-none shadow-lg">
                  <CardHeader className="border-b bg-muted/20">
                     <CardTitle className="flex items-center justify-between">
                        <span>Your Roster (Citrus Crushers)</span>
                        <Button variant="outline" size="sm">Download Roster</Button>
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                     {/* Reuse TeamRosters but filter for user or show summary */}
                     <TeamRosters 
                        teams={teams.filter(t => t.id === '1')} // Just show user team
                        draftHistory={draftHistory}
                     />
                  </CardContent>
               </Card>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="card-citrus border-none shadow-md">
                     <CardHeader>
                        <CardTitle>Draft Board Results</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <DraftBoard 
                           teams={teams}
                           draftHistory={draftHistory}
                           currentPick={currentPick}
                           currentRound={currentRound}
                        />
                     </CardContent>
                  </Card>
                  
                  <Card className="card-citrus border-none shadow-md">
                     <CardHeader>
                        <CardTitle>Draft History</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <DraftHistory draftHistory={draftHistory} />
                     </CardContent>
                  </Card>
               </div>
            </div>
            
            {isCommissioner && (
               <div className="fixed bottom-4 left-4">
                  <Button variant="destructive" onClick={() => setDraftPhase(DraftPhase.LOBBY)}>Reset Draft (Commissioner Only)</Button>
               </div>
            )}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default DraftRoom;
