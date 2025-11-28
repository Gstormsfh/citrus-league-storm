import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wand2, Trophy, Activity, ArrowUpRight, Users, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayerStatsModal from '@/components/PlayerStatsModal';
import { StartersGrid, BenchGrid, IRSlot } from '@/components/roster';
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';
import { useToast } from '@/hooks/use-toast';
import HockeyPlayerCard from '@/components/roster/HockeyPlayerCard';
import { PlayerService } from '@/services/PlayerService';
import { LeagueService } from '@/services/LeagueService';

// Helper function to transform position to fantasy slot
const getFantasyPosition = (position: string): 'C' | 'LW' | 'RW' | 'D' | 'G' | 'UTIL' => {
  if (position === 'Centre' || position === 'C') return 'C';
  if (position === 'Left Wing' || position === 'LW') return 'LW';
  if (position === 'Right Wing' || position === 'RW') return 'RW';
  if (position === 'Defence' || position === 'D') return 'D';
  if (position === 'Goalie' || position === 'G') return 'G';
  return 'UTIL';
};

// Helper function to get team abbreviation
const getTeamAbbreviation = (team: string): string => {
  const abbreviations: Record<string, string> = {
    'Anaheim Ducks': 'ANA', 'Arizona Coyotes': 'ARI', 'Boston Bruins': 'BOS', 'Buffalo Sabres': 'BUF',
    'Calgary Flames': 'CGY', 'Carolina Hurricanes': 'CAR', 'Chicago Blackhawks': 'CHI', 'Colorado Avalanche': 'COL',
    'Columbus Blue Jackets': 'CBJ', 'Dallas Stars': 'DAL', 'Detroit Red Wings': 'DET', 'Edmonton Oilers': 'EDM',
    'Florida Panthers': 'FLA', 'Los Angeles Kings': 'LAK', 'Minnesota Wild': 'MIN', 'Montreal Canadiens': 'MTL',
    'Nashville Predators': 'NSH', 'New Jersey Devils': 'NJD', 'New York Islanders': 'NYI', 'New York Rangers': 'NYR',
    'Ottawa Senators': 'OTT', 'Philadelphia Flyers': 'PHI', 'Pittsburgh Penguins': 'PIT', 'San Jose Sharks': 'SJS',
    'Seattle Kraken': 'SEA', 'St. Louis Blues': 'STL', 'Tampa Bay Lightning': 'TBL', 'Toronto Maple Leafs': 'TOR',
    'Utah Hockey Club': 'UTA', 'Vancouver Canucks': 'VAN', 'Vegas Golden Knights': 'VGK', 'Washington Capitals': 'WSH',
    'Winnipeg Jets': 'WPG'
  };
  // If team is already an abbreviation (3 letters), return it. Otherwise lookup or truncate.
  if (team.length === 3) return team;
  return abbreviations[team] || team.split(' ').slice(-1)[0].substring(0, 3).toUpperCase();
};

// Sample team stats for analytics section
const teamStats = {
  record: "3-1-0",
  rank: "3rd",
  totalPoints: 1245.5,
  avgPoints: 311.4,
  highScore: 342.8,
  waiverMoves: 4,
  trends: [
    { stat: "Fantasy Pts", direction: "up", value: "+5.2%" },
    { stat: "Goalie Stats", direction: "down", value: "-1.5%" },
    { stat: "Power Play", direction: "up", value: "+8.4%" },
    { stat: "Peripherals", direction: "up", value: "+2.1%" },
    { stat: "Consistency", direction: "down", value: "-0.5%" }
  ]
};

// Position slot configuration
const POSITION_SLOTS = {
  'C': { maxPlayers: 2, label: 'Center' },
  'LW': { maxPlayers: 2, label: 'Left Wing' },
  'RW': { maxPlayers: 2, label: 'Right Wing' },
  'D': { maxPlayers: 4, label: 'Defense' },
  'G': { maxPlayers: 2, label: 'Goalie' },
  'UTIL': { maxPlayers: 1, label: 'Utility' },
} as const;

type PositionSlot = keyof typeof POSITION_SLOTS;

interface RosterState {
  starters: HockeyPlayer[];
  bench: HockeyPlayer[];
  ir: HockeyPlayer[];
  slotAssignments: Record<string, string>; // Changed key to string to support UUIDs
}

const Roster = () => {
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<HockeyPlayer | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial empty roster state
  const [roster, setRoster] = useState<RosterState>({
    starters: [],
    bench: [],
    ir: [],
    slotAssignments: {}
  });

  // Calculate slots helper
  const calculateInitialSlotAssignments = (starters: HockeyPlayer[]) => {
    const assignments: Record<string, string> = {};
    const playersByPos: Record<string, HockeyPlayer[]> = {
      'C': [], 'LW': [], 'RW': [], 'D': [], 'G': [], 'UTIL': []
    };
    
    starters.forEach(p => {
      const pos = getFantasyPosition(p.position);
      if (pos !== 'UTIL') playersByPos[pos].push(p);
    });
    
    // Assign C, LW, RW to first 2 slots
    ['C', 'LW', 'RW'].forEach(pos => {
      playersByPos[pos].slice(0, 2).forEach((p, i) => {
        assignments[p.id] = `slot-${pos}-${i + 1}`;
      });
    });

    // Assign D to first 4 slots
    playersByPos['D'].slice(0, 4).forEach((p, i) => {
      assignments[p.id] = `slot-D-${i + 1}`;
    });

    // Assign G to first 2 slots
    playersByPos['G'].slice(0, 2).forEach((p, i) => {
      assignments[p.id] = `slot-G-${i + 1}`;
    });
    
    // Assign remaining non-goalie starters to UTIL if not already assigned
    const assignedIds = new Set(Object.keys(assignments));
    const unassigned = starters.filter(p => !assignedIds.has(String(p.id)));
    const utilPlayer = unassigned.find(p => getFantasyPosition(p.position) !== 'G');
    if (utilPlayer) {
        assignments[utilPlayer.id] = 'slot-UTIL';
    }
    
    return assignments;
  };

  // Fetch and adapt players
  useEffect(() => {
    const loadRoster = async () => {
      setLoading(true);
      try {
        // Get consistent roster for "My Team" (ID: 3)
        const allPlayers = await PlayerService.getAllPlayers();
        const dbPlayers = await LeagueService.getMyTeam(allPlayers);
        
        // Transform DB players to HockeyPlayer format
        const transformedPlayers: HockeyPlayer[] = dbPlayers.map((p) => ({
          id: p.id,
          name: p.full_name,
          position: p.position,
          number: parseInt(p.jersey_number || '0'),
          starter: false, // Will determine below
          stats: {
            goals: p.goals || 0,
            assists: p.assists || 0,
            points: p.points || 0,
            plusMinus: p.plus_minus || 0,
            shots: p.shots || 0,
            hits: p.hits || 0,
            blockedShots: p.blocks || 0,
            wins: p.wins || 0,
            losses: p.losses || 0,
            otl: p.ot_losses || 0,
            gaa: p.goals_against_average || 0,
            savePct: p.save_percentage || 0,
            shutouts: 0 // Not in DB yet
          },
          team: p.team,
          teamAbbreviation: p.team, // DB has 'EDM' etc
          status: p.status === 'injured' ? 'IR' : (p.status === 'active' ? null : 'WVR'),
          image: p.headshot_url || undefined,
          // Mock game data since we don't have schedule API yet
          nextGame: { opponent: 'vs OPP', isToday: Math.random() > 0.5 },
          projectedPoints: (p.points || 0) / 20 // Rough projection
        }));

        // Organize into slots (Simulation of a drafted team)
        const starters: HockeyPlayer[] = [];
        const bench: HockeyPlayer[] = [];
        const ir: HockeyPlayer[] = [];

        // Simple draft logic to fill slots
        const slotsNeeded = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'G': 2, 'UTIL': 1 };
        const slotsFilled = { 'C': 0, 'LW': 0, 'RW': 0, 'D': 0, 'G': 0, 'UTIL': 0 };

        transformedPlayers.forEach(p => {
          if (p.status === 'IR' || p.status === 'SUSP') {
            ir.push(p);
            return;
          }

          const pos = getFantasyPosition(p.position);
          
          if (pos !== 'UTIL' && slotsFilled[pos] < slotsNeeded[pos]) {
            starters.push({ ...p, starter: true });
            slotsFilled[pos]++;
          } else if (pos !== 'G' && slotsFilled['UTIL'] < slotsNeeded['UTIL']) {
            starters.push({ ...p, starter: true });
            slotsFilled['UTIL']++;
          } else {
            bench.push(p);
          }
        });

        const slotAssignments = calculateInitialSlotAssignments(starters);
        setRoster({ starters, bench, ir, slotAssignments });
      } catch (e) {
        console.error("Failed to load roster", e);
        toast({ title: "Error", description: "Could not load roster.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [toast]);

  const handleAutoLineup = () => {
    setRoster((prev) => {
      // 1. Gather all active players (exclude IR)
      const allActivePlayers = [...prev.starters, ...prev.bench];
      
      // 2. Helper to sort players: Games Today > Projected Points > Name
      const sortBestPlayers = (players: HockeyPlayer[]) => {
        return [...players].sort((a, b) => {
          if (a.nextGame?.isToday !== b.nextGame?.isToday) {
            return a.nextGame?.isToday ? -1 : 1;
          }
          return (b.projectedPoints || 0) - (a.projectedPoints || 0);
        });
      };

      // 3. Group by fantasy position
      const grouped: Record<string, HockeyPlayer[]> = {
        'C': [], 'LW': [], 'RW': [], 'D': [], 'G': []
      };

      allActivePlayers.forEach(p => {
        const pos = getFantasyPosition(p.position);
        if (pos !== 'UTIL' && grouped[pos]) {
          grouped[pos].push(p);
        }
      });

      // 4. Sort each group
      Object.keys(grouped).forEach(key => {
        grouped[key] = sortBestPlayers(grouped[key]);
      });

      // 5. Assign Slots
      const newAssignments: Record<string, string> = {};
      const newStarters: HockeyPlayer[] = [];
      const newBench: HockeyPlayer[] = [];
      const assignedIds = new Set<string | number>();

      // Helper to assign players to a list of slot IDs
      const assignToSlots = (players: HockeyPlayer[], slotPrefix: string, count: number) => {
        for (let i = 0; i < count; i++) {
          if (players.length > i) {
            const p = players[i];
            const slotId = `${slotPrefix}-${i + 1}`;
            newAssignments[p.id] = slotId;
            newStarters.push({ ...p, starter: true });
            assignedIds.add(p.id);
          }
        }
      };

      // Assign Primary Slots
      assignToSlots(grouped['C'], 'slot-C', 2);
      assignToSlots(grouped['LW'], 'slot-LW', 2);
      assignToSlots(grouped['RW'], 'slot-RW', 2);
      assignToSlots(grouped['D'], 'slot-D', 4);
      assignToSlots(grouped['G'], 'slot-G', 2);

      // 6. Handle UTIL Slot (Best remaining non-goalie)
      const remainingPlayers = allActivePlayers.filter(p => !assignedIds.has(p.id));
      const utilCandidates = remainingPlayers.filter(p => getFantasyPosition(p.position) !== 'G');
      const bestUtil = sortBestPlayers(utilCandidates)[0];

      if (bestUtil) {
        newAssignments[bestUtil.id] = 'slot-UTIL';
        newStarters.push({ ...bestUtil, starter: true });
        assignedIds.add(bestUtil.id);
      }

      // 7. Remaining go to Bench
      const remainingAfterUtil = allActivePlayers.filter(p => !assignedIds.has(p.id));
      remainingAfterUtil.forEach(p => {
        newBench.push({ ...p, starter: false });
      });

      return {
        ...prev,
        starters: newStarters,
        bench: newBench,
        slotAssignments: newAssignments
      };
    });

    toast({
      title: "Lineup Optimized",
      description: "Best players set based on today's games and projections.",
    });
  };

  // Get active player being dragged
  const activePlayer = useMemo(() => {
    if (!activeId) return null;
    return [...roster.starters, ...roster.bench, ...roster.ir].find(p => p.id === activeId) || null;
  }, [activeId, roster]);

  const handlePlayerClick = (player: HockeyPlayer) => {
    setSelectedPlayer(player);
    setIsPlayerDialogOpen(true);
  };

  // Position validation
  const isPositionValid = (player: HockeyPlayer, targetSlot: string): boolean => {
    const playerFantasyPos = getFantasyPosition(player.position);
    
    if (targetSlot === 'bench-grid') return true;
    
    if (targetSlot === 'ir-slot') {
      return player.status === 'IR' || player.status === 'SUSP' || player.status === 'GTD';
    }
    
    let slotPosition: PositionSlot | null = null;
    
    if (targetSlot === 'slot-UTIL') {
      slotPosition = 'UTIL';
    } else if (targetSlot.startsWith('slot-')) {
       const parts = targetSlot.split('-');
       if (parts.length >= 2) {
         slotPosition = parts[1] as PositionSlot;
       }
    }
    
    if (!slotPosition) return false;
    
    if (slotPosition === 'UTIL') {
      return playerFantasyPos !== 'G';
    }
    
    if (playerFantasyPos === 'G') {
      return slotPosition === 'G';
    }
    
    if (slotPosition === 'G') {
      return false;
    }
    
    return playerFantasyPos === slotPosition;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string | number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const playerId = active.id as string | number;
    const targetId = over.id as string; 

    const allPlayers = [...roster.starters, ...roster.bench, ...roster.ir];
    const player = allPlayers.find(p => p.id === playerId);
    
    if (!player) return;

    // Identify if dropping onto a player or an empty slot
    const droppedOnPlayer = allPlayers.find(p => p.id === targetId); 
    
    let finalTargetSlotId = targetId;

    if (droppedOnPlayer) {
       // If dropped on a player, find their slot
       if (roster.bench.some(p => p.id === droppedOnPlayer.id)) finalTargetSlotId = 'bench-grid';
       else if (roster.ir.some(p => p.id === droppedOnPlayer.id)) finalTargetSlotId = 'ir-slot';
       else finalTargetSlotId = roster.slotAssignments[droppedOnPlayer.id] || 'slot-UTIL';
    }

    const isCurrentlyStarter = roster.starters.some(p => p.id === playerId);
    
    // Check if we are just dropping in the same place
    if (isCurrentlyStarter && roster.slotAssignments[player.id] === finalTargetSlotId) return;
    if (!isCurrentlyStarter && finalTargetSlotId === 'bench-grid' && roster.bench.some(p => p.id === playerId)) return;

    if (!isPositionValid(player, finalTargetSlotId)) {
        toast({ title: "Invalid Position", description: "Player cannot play in this position.", variant: "destructive" });
        return;
    }

    setRoster(prev => {
        const newStarters = [...prev.starters];
        const newBench = [...prev.bench];
        const newIR = [...prev.ir];
        const newAssignments = { ...prev.slotAssignments };

        // Remove player from old location
        const removeFromCurrent = (pId: string | number) => {
            const sIdx = newStarters.findIndex(p => p.id === pId);
            if (sIdx >= 0) { 
                newStarters.splice(sIdx, 1); 
                delete newAssignments[pId]; 
                return { loc: 'starter' }; 
            }
            const bIdx = newBench.findIndex(p => p.id === pId);
            if (bIdx >= 0) { 
                newBench.splice(bIdx, 1); 
                return { loc: 'bench' }; 
            }
            const iIdx = newIR.findIndex(p => p.id === pId);
            if (iIdx >= 0) { 
                newIR.splice(iIdx, 1); 
                return { loc: 'ir' }; 
            }
            return null;
        };

        // 1. Remove Active Player
        const sourceInfo = removeFromCurrent(player.id);
        
        // 2. Check if target slot is occupied
        let occupantId: string | number | undefined;
        if (finalTargetSlotId.startsWith('slot-')) {
            const foundId = Object.keys(newAssignments).find(id => newAssignments[id] === finalTargetSlotId);
            if (foundId) {
              // Try to cast back to number if possible to match original ID type, though string is safe for keys
              // Since ID can be string or number, simple retrieval is safest
              occupantId = foundId; 
            }
        }

        // 3. If occupied, remove the occupant (Swap)
        let occupantSourceInfo = null;
        if (occupantId) {
            occupantSourceInfo = removeFromCurrent(occupantId);
        }

        // 4. Place Active Player into Target Slot
        const p = { ...player };
        if (finalTargetSlotId === 'bench-grid') {
            p.starter = false; p.status = (p.status === 'IR' || p.status === 'SUSP') ? p.status : null; newBench.push(p);
        } else if (finalTargetSlotId === 'ir-slot') {
            p.starter = false; if(p.status !== 'IR' && p.status !== 'SUSP') p.status='IR'; newIR.push(p);
        } else {
            p.starter = true; p.status = (p.status === 'IR' || p.status === 'SUSP') ? p.status : null; newStarters.push(p);
            newAssignments[p.id] = finalTargetSlotId; 
        }

        // 5. If we swapped, put the occupant where the active player came from
        if (occupantId && occupantSourceInfo) {
            // Find the original object reference from closure or re-find in 'allPlayers' isn't quite right because we need the object.
            // But we removed it from newStarters/Bench/IR. We can find it in 'allPlayers' which is unchanged.
            const occupant = allPlayers.find(x => String(x.id) === String(occupantId))!;
            const p2 = { ...occupant };
            
            // Determine where to put the swapped player
            let swapBackTarget = 'bench-grid';
            
            // Logic: try to put them back where source came from
            if (sourceInfo?.loc === 'bench') swapBackTarget = 'bench-grid';
            else if (sourceInfo?.loc === 'ir') swapBackTarget = 'ir-slot';
            else if (sourceInfo?.loc === 'starter') {
               // We don't have the original slot assignment easily available since we deleted it from newAssignments
               // But we can look at 'prev.slotAssignments'
               const originalSlot = prev.slotAssignments[player.id];
               if (originalSlot) swapBackTarget = originalSlot;
            }

            if (!isPositionValid(p2, swapBackTarget)) {
                swapBackTarget = 'bench-grid';
            }

            if (swapBackTarget === 'bench-grid') {
                p2.starter = false; newBench.push(p2);
            } else if (swapBackTarget === 'ir-slot') {
                p2.starter = false; if(p2.status!=='IR') p2.status='IR'; newIR.push(p2);
            } else {
                p2.starter = true; newStarters.push(p2);
                newAssignments[p2.id] = swapBackTarget;
            }
        }

        return { starters: newStarters, bench: newBench, ir: newIR, slotAssignments: newAssignments };
    });
    
    toast({ title: "Lineup Updated", description: "Player moved successfully." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Fantasy Team Header */}
          <div className="bg-card rounded-lg shadow-md border p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  HC
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Hockey Champions</h1>
                  <div className="text-muted-foreground text-sm">Manager: John Smith</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Record</div>
                  <div className="font-bold">{teamStats.record}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Rank</div>
                  <div className="font-bold">{teamStats.rank}</div>
                </div>
                <div className="text-center px-4 py-2">
                  <div className="text-sm text-muted-foreground">Total Pts</div>
                  <div className="font-bold">{teamStats.totalPoints}</div>
                </div>
              </div>

              <div>
                <Button onClick={handleAutoLineup} variant="outline" className="flex gap-2">
                  <Wand2 className="w-4 h-4" />
                  Auto Lineup
                </Button>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="bg-card rounded-lg shadow-md border">
              <TabsList className="w-full p-0 bg-transparent border-b rounded-none gap-0">
                <TabsTrigger 
                  value="roster" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Roster
                </TabsTrigger>
                <TabsTrigger 
                  value="stats" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Team Stats
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Trends & Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roster" className="m-0 p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                    <p>Loading your roster...</p>
                  </div>
                ) : (
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-8">
                      <StartersGrid 
                        players={roster.starters}
                        slotAssignments={roster.slotAssignments}
                        onPlayerClick={handlePlayerClick}
                      />
                      
                      <BenchGrid 
                        players={roster.bench}
                        onPlayerClick={handlePlayerClick}
                      />
                      
                      <IRSlot 
                        players={roster.ir}
                        onPlayerClick={handlePlayerClick}
                      />
                    </div>

                    <DragOverlay>
                      {activePlayer ? (
                        <div className="opacity-90 rotate-3">
                          <HockeyPlayerCard 
                            player={activePlayer}
                            draggable={false}
                          />
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}
              </TabsContent>

              <TabsContent value="stats" className="m-0 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Season Points</span>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="text-2xl font-bold">{teamStats.totalPoints}</div>
                      <p className="text-xs text-muted-foreground mt-1">Rank: {teamStats.rank}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Avg. Weekly</span>
                        <Activity className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold">{teamStats.avgPoints}</div>
                      <p className="text-xs text-muted-foreground mt-1">pts / week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Highest Score</span>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold">{teamStats.highScore}</div>
                      <p className="text-xs text-muted-foreground mt-1">Week 2</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Moves Made</span>
                        <Users className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold">{teamStats.waiverMoves}</div>
                      <p className="text-xs text-muted-foreground mt-1">Waiver/Trades</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="m-0 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Category Trends</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamStats.trends.map((trend, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{trend.stat}</span>
                              <div className="flex items-center">
                                {trend.direction === 'up' ? (
                                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={`text-sm ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                  {trend.value}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Enhanced Player Stats Modal */}
        <PlayerStatsModal
          player={selectedPlayer}
          isOpen={isPlayerDialogOpen}
          onClose={() => setIsPlayerDialogOpen(false)}
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default Roster;
