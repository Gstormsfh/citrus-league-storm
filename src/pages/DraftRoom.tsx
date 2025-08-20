import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DraftBoard } from '@/components/draft/DraftBoard';
import { PlayerPool } from '@/components/draft/PlayerPool';
import { TeamRosters } from '@/components/draft/TeamRosters';
import { DraftTimer } from '@/components/draft/DraftTimer';
import { DraftControls } from '@/components/draft/DraftControls';
import { DraftHistory } from '@/components/draft/DraftHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, Trophy, History, Settings } from 'lucide-react';

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

const DraftRoom = () => {
  const [currentPick, setCurrentPick] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(90); // 90 seconds per pick
  const [isDraftActive, setIsDraftActive] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [draftHistory, setDraftHistory] = useState<DraftPick[]>([]);

  // Mock teams data
  const teams: Team[] = [
    { id: '1', name: 'Ice Kings', owner: 'John Doe', color: '#3B82F6', picks: [] },
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
    if (!isDraftActive || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-draft when time expires
          handleAutoDraft();
          return 90; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isDraftActive, currentPick]);

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
    const totalPicks = teams.length * 16; // 16 rounds
    
    if (nextPick > totalPicks) {
      setIsDraftActive(false);
    } else {
      setCurrentPick(nextPick);
      if (nextPick > teams.length * currentRound) {
        setCurrentRound(currentRound + 1);
      }
      setTimeRemaining(90);
    }
  };

  const handleAutoDraft = () => {
    // Auto-draft logic would go here
    console.log('Auto-drafting for', currentTeam.name);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Draft Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">NHL Fantasy Draft Room</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>8 Teams</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span>16 Rounds</span>
                  </div>
                  <Badge variant={isDraftActive ? "default" : "secondary"}>
                    {isDraftActive ? "Draft Active" : "Draft Complete"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <DraftTimer 
                  timeRemaining={timeRemaining}
                  isActive={isDraftActive}
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
            
            {isDraftActive && (
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
            )}
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
                    isDraftActive={isDraftActive}
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
              <DraftControls 
                isDraftActive={isDraftActive}
                onToggleDraft={() => setIsDraftActive(!isDraftActive)}
              />
              
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
                    {isDraftActive && (
                      <Button 
                        onClick={() => handlePlayerDraft(selectedPlayer)}
                        className="w-full"
                        disabled={draftHistory.some(p => p.playerId === selectedPlayer.id)}
                      >
                        Draft Player
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DraftRoom;