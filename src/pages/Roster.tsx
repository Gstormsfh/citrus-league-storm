import { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wand2, Trophy, Activity, ArrowUpRight, Users, Loader2, Calendar, Target, Shield, Skull, Zap, BarChart3, PieChart } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayerStatsModal from '@/components/PlayerStatsModal';
import { StartersGrid, BenchGrid, IRSlot } from '@/components/roster';
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';
import { useToast } from '@/hooks/use-toast';
import HockeyPlayerCard from '@/components/roster/HockeyPlayerCard';
import { PlayerService } from '@/services/PlayerService';
import { LeagueService, Transaction } from '@/services/LeagueService';
import { CitrusPuckService } from '@/services/CitrusPuckService';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

  const teamStats = {
    record: "3-1-0",
    rank: "3rd",
    totalPoints: 1245.5,
    avgPoints: 311.4,
    highScore: 342.8,
    waiverMoves: 4,
  };

  // Analytics Helpers
  const calculateTeamCategoryStats = (starters: HockeyPlayer[]) => {
    // Breakdown by fantasy position
    const stats = {
      C: { goals: 0, assists: 0, shots: 0, hits: 0, blocks: 0, ppp: 0, shp: 0 },
      LW: { goals: 0, assists: 0, shots: 0, hits: 0, blocks: 0, ppp: 0, shp: 0 },
      RW: { goals: 0, assists: 0, shots: 0, hits: 0, blocks: 0, ppp: 0, shp: 0 },
      D: { goals: 0, assists: 0, shots: 0, hits: 0, blocks: 0, ppp: 0, shp: 0 },
      G: { wins: 0, losses: 0, saves: 0, gaa: 0, sv: 0, count: 0 } // Different stats for goalies
    };
    
    starters.forEach(p => {
      const pos = getFantasyPosition(p.position);
      if (pos === 'UTIL') return; // Skip UTIL for position breakdown or attribute to primary pos?
      // Assuming primary pos is what we want. If player is in UTIL slot, they still have a primary pos.
      // But getFantasyPosition returns 'UTIL' if it doesn't match C/LW/RW/D/G? No, it handles strings.
      // Wait, getFantasyPosition logic:
      // if (position === 'Centre' || position === 'C') return 'C';
      // ...
      // return 'UTIL'; 
      // If a player is a Center but in UTIL slot, we might want to count them as Center stats?
      // The current logic uses `p.position` which is the string from DB.
      
      // Let's refine getting the "Real" position for stats aggregation
      let realPos = 'UTIL';
      if (['C', 'Centre'].includes(p.position)) realPos = 'C';
      else if (['LW', 'Left Wing'].includes(p.position)) realPos = 'LW';
      else if (['RW', 'Right Wing'].includes(p.position)) realPos = 'RW';
      else if (['D', 'Defence'].includes(p.position)) realPos = 'D';
      else if (['G', 'Goalie'].includes(p.position)) realPos = 'G';
      
      if (realPos === 'G') {
        stats.G.wins += p.stats.wins || 0;
        stats.G.losses += p.stats.losses || 0;
        // Mock saves if not present (approx 25 per game * games played?)
        // We don't have saves in the interface stats used earlier, let's just stick to wins
        stats.G.count++;
      } else if (stats[realPos as keyof typeof stats]) {
        const target = stats[realPos as keyof typeof stats] as any;
        target.goals += p.stats.goals || 0;
        target.assists += p.stats.assists || 0;
        target.shots += p.stats.shots || 0;
        target.hits += p.stats.hits || 0;
        target.blocks += p.stats.blockedShots || 0;
        target.ppp += p.stats.powerPlayPoints || 0;
        target.shp += p.stats.shortHandedPoints || 0;
      }
    });

    return stats;
  };

  const calculateRadarData = (stats: any, position: string) => {
    // Baselines customized by position group (Per Player Season Avg * Num Slots)
    // Approx baselines for a "Good" starter
    const singlePlayerBaseline = {
      C: { G: 25, A: 45, S: 200, H: 80, B: 40, PPP: 15 },
      LW: { G: 25, A: 35, S: 200, H: 100, B: 40, PPP: 12 },
      RW: { G: 25, A: 35, S: 200, H: 100, B: 40, PPP: 12 },
      D: { G: 10, A: 35, S: 150, H: 120, B: 130, PPP: 10 },
    };

    const base = singlePlayerBaseline[position as keyof typeof singlePlayerBaseline] || singlePlayerBaseline.C;
    
    // We are looking at totals, so we should maybe normalize? 
    // Or just show raw accumulation vs a "Target" for that position group (e.g. 2 Centers)
    // Let's assume we are evaluating the "Group" strength.
    // If user has 3 centers (2 C slots + 1 Util), they should exceed the baseline for 2 slots.
    
    // Dynamic baseline based on roughly 2 players worth of stats for that position
    const factor = 2.5; // Baseline for "Strong" position group

    return [
      { subject: 'Goals', A: Math.min(100, (stats.goals / (base.G * factor)) * 100), fullMark: 100 },
      { subject: 'Assists', A: Math.min(100, (stats.assists / (base.A * factor)) * 100), fullMark: 100 },
      { subject: 'Shots', A: Math.min(100, (stats.shots / (base.S * factor)) * 100), fullMark: 100 },
      { subject: 'Hits', A: Math.min(100, (stats.hits / (base.H * factor)) * 100), fullMark: 100 },
      { subject: 'Blocks', A: Math.min(100, (stats.blocks / (base.B * factor)) * 100), fullMark: 100 },
      { subject: 'PPP', A: Math.min(100, (stats.ppp / (base.PPP * factor)) * 100), fullMark: 100 },
    ];
  };

  const getPositionStrength = (starters: HockeyPlayer[], pos: string) => {
    const players = starters.filter(p => getFantasyPosition(p.position) === pos);
    
    // Scale: 
    // Elite: > 1.2 PPG (approx 100 pt pace)
    // Strong: > 0.9 PPG (approx 74 pt pace)
    // Average: > 0.7 PPG (approx 57 pt pace)
    // Weak: < 0.7 PPG
    // Projected Points in data is roughly (season points / 20) -> which is basically PPG * 4
    // So if p.projectedPoints is 4.0 => 1.0 PPG approx.

    if (players.length === 0) return { score: 0, label: 'Critical Need', color: 'text-red-500', bg: 'bg-red-500/10' };
    
    const avgProj = players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0) / players.length;
    
    // Adjusted thresholds for 5-6 point scale
    if (avgProj >= 5.0) return { score: avgProj, label: 'Elite', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (avgProj >= 4.0) return { score: avgProj, label: 'Strong', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (avgProj >= 3.0) return { score: avgProj, label: 'Average', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { score: avgProj, label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500/10' };
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statView, setStatView] = useState<'currentWeek' | 'seasonToDate' | 'lastSeason' | 'restOfSeason'>('seasonToDate');
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  const [selectedPosMetric, setSelectedPosMetric] = useState<'C' | 'LW' | 'RW' | 'D'>('C');
  
  // Initial empty roster state
  const [roster, setRoster] = useState<RosterState>({
    starters: [],
    bench: [],
    ir: [],
    slotAssignments: {}
  });

  // Calculate positional stats
  const posStats = useMemo(() => calculateTeamCategoryStats(roster.starters), [roster.starters]);

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
        setTransactions(LeagueService.getTransactions());
        
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
          // Use deterministic value for initial assignment (hash player ID for consistency)
          nextGame: { opponent: 'vs OPP', isToday: (parseInt(String(p.id)) % 2 === 0) },
          projectedPoints: (p.points || 0) / 20 // Rough projection
        }));

        // Sort players consistently by ID for deterministic auto-assignment
        transformedPlayers.sort((a, b) => {
          const idA = typeof a.id === 'string' ? parseInt(a.id) : a.id;
          const idB = typeof b.id === 'string' ? parseInt(b.id) : b.id;
          return idA - idB;
        });

        // Check for saved lineup first
        const savedLineup = await LeagueService.getLineup(3); // Team ID 3
        
        if (savedLineup) {
          // Restore saved lineup
          const playerMap = new Map(transformedPlayers.map(p => [String(p.id), p]));
          const savedPlayerIds = new Set([
            ...savedLineup.starters,
            ...savedLineup.bench,
            ...savedLineup.ir
          ]);
          
          const starters = savedLineup.starters
            .map(id => {
              const player = playerMap.get(id);
              if (!player) return null;
              return { ...player, starter: true };
            })
            .filter((p): p is HockeyPlayer => p !== null);
          
          const bench = savedLineup.bench
            .map(id => playerMap.get(id))
            .filter((p): p is HockeyPlayer => p !== null);
          
          const ir = savedLineup.ir
            .map(id => playerMap.get(id))
            .filter((p): p is HockeyPlayer => p !== null);
          
          // Add any new players (not in saved lineup) to bench
          transformedPlayers.forEach(player => {
            if (!savedPlayerIds.has(String(player.id))) {
              bench.push(player);
            }
          });
          
          // Ensure all slot assignments are valid (player still exists)
          const validSlotAssignments: Record<string, string> = {};
          Object.entries(savedLineup.slotAssignments).forEach(([playerId, slotId]) => {
            if (playerMap.has(playerId)) {
              validSlotAssignments[playerId] = slotId;
            }
          });
          
          setRoster({ starters, bench, ir, slotAssignments: validSlotAssignments });
        } else {
          // No saved lineup - organize into slots (Simulation of a drafted team)
          const starters: HockeyPlayer[] = [];
          const bench: HockeyPlayer[] = [];
          const ir: HockeyPlayer[] = [];
          const irSlotAssignments: Record<string, string> = {};

          // Simple draft logic to fill slots
          const slotsNeeded = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'G': 2, 'UTIL': 1 };
          const slotsFilled = { 'C': 0, 'LW': 0, 'RW': 0, 'D': 0, 'G': 0, 'UTIL': 0 };

          // Track IR slot assignments
          let irSlotIndex = 1;
          
          // Only use actual IR/SUSP status for IR placement (deterministic)
          // Don't use nextGame.isToday for initial auto-assignment
          transformedPlayers.forEach(p => {
            if (p.status === 'IR' || p.status === 'SUSP') {
              if (irSlotIndex <= 3) {
                ir.push(p);
                // Assign to IR slot
                irSlotAssignments[p.id] = `ir-slot-${irSlotIndex}`;
                irSlotIndex++;
              } else {
                bench.push(p);
              }
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

          const starterSlotAssignments = calculateInitialSlotAssignments(starters);
          // Merge IR slot assignments with starter assignments
          const allSlotAssignments = { ...starterSlotAssignments, ...irSlotAssignments };
          const initialRoster = { starters, bench, ir, slotAssignments: allSlotAssignments };
          setRoster(initialRoster);
          
          // Save initial lineup
          await LeagueService.saveLineup(3, {
            starters: starters.map(p => p.id),
            bench: bench.map(p => p.id),
            ir: ir.map(p => p.id),
            slotAssignments: allSlotAssignments
          });
        }
      } catch (e) {
        console.error("Failed to load roster", e);
        toast({ title: "Error", description: "Could not load roster.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [toast]);

  // Load CitrusPuck Analytics
  useEffect(() => {
    // Only load if roster is loaded and not already loaded
    if (loading || analyticsLoaded || roster.starters.length === 0) return;

    const loadAnalytics = async () => {
        try {
            // Load 2024 and 2025 data
            const [data2024, data2025] = await Promise.all([
                CitrusPuckService.getAllAnalytics(2024),
                CitrusPuckService.getAllAnalytics(2025)
            ]);

            const enrichPlayer = (p: HockeyPlayer) => {
                // Helper to normalize names for comparison (remove accents, lowercase)
                const normalize = (str: string) => {
                    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                }

                // Try exact match by Name first (most reliable if IDs are mixed)
                const findByName = (map: Map<number, any>) => {
                    const targetName = normalize(p.name);
                    for (const val of map.values()) {
                        // Use loose comparison or normalization
                        if (val.name && normalize(val.name) === targetName) return val;
                    }
                    return undefined;
                };

                let d2024 = findByName(data2024);
                let d2025 = findByName(data2025);
                
                // If name match fails, try ID if numeric
                if (!d2024 && !d2025) {
                    const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    if (!isNaN(pId)) {
                        d2024 = data2024.get(pId);
                        d2025 = data2025.get(pId);
                    }
                }

                if (!d2025 && !d2024) return p;

                const projections = {
                    currentWeek: d2025 ? CitrusPuckService.projectCurrentWeek(d2025) : undefined,
                    restOfSeason: (d2025) ? CitrusPuckService.projectRestOfSeason(d2024 || null, d2025) : undefined
                };

                return {
                    ...p,
                    citrusPuckData: {
                        currentSeason: d2025,
                        lastSeason: d2024,
                        projections
                    }
                };
            };

            setRoster(prev => ({
                ...prev,
                starters: prev.starters.map(enrichPlayer),
                bench: prev.bench.map(enrichPlayer),
                ir: prev.ir.map(enrichPlayer)
            }));
            
            setAnalyticsLoaded(true);
            toast({ title: "CitrusPuck Loaded", description: "Advanced stats and projections ready." });
        } catch (e) {
            console.error("Failed to load analytics", e);
        }
    };
    
    loadAnalytics();
  }, [loading, analyticsLoaded, roster.starters.length, toast]); // Removed 'roster' full dependency to avoid loops

  // Update statView on players when it changes
  useEffect(() => {
    setRoster(prev => ({
        ...prev,
        starters: prev.starters.map(p => ({ ...p, statView })),
        bench: prev.bench.map(p => ({ ...p, statView })),
        ir: prev.ir.map(p => ({ ...p, statView }))
    }));
  }, [statView]);

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

      const updatedRoster = {
        ...prev,
        starters: newStarters,
        bench: newBench,
        slotAssignments: newAssignments
      };
      
      // Save lineup to localStorage
      LeagueService.saveLineup(3, {
        starters: newStarters.map(p => p.id),
        bench: newBench.map(p => p.id),
        ir: prev.ir.map(p => p.id),
        slotAssignments: newAssignments
      }).catch(err => console.error('Failed to save lineup:', err));
      
      return updatedRoster;
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
    
    if (targetSlot.startsWith('ir-slot-')) {
      // Only allow players with 'IR' or 'SUSP' status to move to IR slot (must already be injured)
      if (player.status !== 'IR' && player.status !== 'SUSP') {
        return false;
      }
      return true;
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

    // Check if dropping on an IR slot directly
    if (targetId.startsWith('ir-slot-')) {
      finalTargetSlotId = targetId;
    } else if (droppedOnPlayer) {
       // If dropped on a player, find their slot
       if (roster.bench.some(p => p.id === droppedOnPlayer.id)) finalTargetSlotId = 'bench-grid';
       else if (roster.ir.some(p => p.id === droppedOnPlayer.id)) {
         // Find which IR slot they're in
         finalTargetSlotId = roster.slotAssignments[droppedOnPlayer.id] || 'ir-slot-1';
       }
       else finalTargetSlotId = roster.slotAssignments[droppedOnPlayer.id] || 'slot-UTIL';
    }

    const isCurrentlyStarter = roster.starters.some(p => p.id === playerId);
    const isCurrentlyBench = roster.bench.some(p => p.id === playerId);
    const isDroppingOnBench = finalTargetSlotId === 'bench-grid';
    const isDroppingOnBenchPlayer = droppedOnPlayer && roster.bench.some(p => p.id === droppedOnPlayer.id);
    
    // Handle bench-to-bench reordering
    if (isCurrentlyBench && isDroppingOnBench && isDroppingOnBenchPlayer && droppedOnPlayer.id !== playerId) {
      setRoster(prev => {
        const benchIds = prev.bench.map(p => p.id);
        const oldIndex = benchIds.indexOf(playerId);
        const newIndex = benchIds.indexOf(droppedOnPlayer.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newBench = arrayMove(prev.bench, oldIndex, newIndex);
          const updatedRoster = { ...prev, bench: newBench };
          
          // Save lineup to localStorage
          LeagueService.saveLineup(3, {
            starters: prev.starters.map(p => p.id),
            bench: newBench.map(p => p.id),
            ir: prev.ir.map(p => p.id),
            slotAssignments: prev.slotAssignments
          }).catch(err => console.error('Failed to save lineup:', err));
          
          return updatedRoster;
        }
        
        return prev;
      });
      toast({ title: "Bench Reordered", description: "Player position updated." });
      return;
    }
    
    // Handle reordering when dropping on bench-grid directly (not on a player)
    if (isCurrentlyBench && isDroppingOnBench && !isDroppingOnBenchPlayer) {
      // Already in bench, no change needed
      return;
    }
    
    // Check if we are just dropping in the same place (but not reordering)
    if (isCurrentlyStarter && roster.slotAssignments[player.id] === finalTargetSlotId) return;
    if (isCurrentlyBench && isDroppingOnBench && !isDroppingOnBenchPlayer) return;

    if (!isPositionValid(player, finalTargetSlotId)) {
        if (finalTargetSlotId.startsWith('ir-slot-')) {
          toast({ title: "Invalid Move", description: "Only injured players (IR/SUSP status) can be placed in IR slots.", variant: "destructive" });
        } else {
          toast({ title: "Invalid Position", description: "Player cannot play in this position.", variant: "destructive" });
        }
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
                delete newAssignments[pId];
                return { loc: 'ir' }; 
            }
            return null;
        };

        // 1. Remove Active Player
        const sourceInfo = removeFromCurrent(player.id);
        
        // 2. Check if target slot is occupied
        let occupantId: string | number | undefined;
        if (finalTargetSlotId.startsWith('slot-') || finalTargetSlotId.startsWith('ir-slot-')) {
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
        } else if (finalTargetSlotId.startsWith('ir-slot-')) {
            p.starter = false; 
            // Don't change status - player must already be IR or SUSP to get here
            newIR.push(p);
            newAssignments[p.id] = finalTargetSlotId;
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
            else if (sourceInfo?.loc === 'ir') {
              // Find the original IR slot from previous assignments
              const originalSlot = prev.slotAssignments[player.id];
              if (originalSlot && originalSlot.startsWith('ir-slot-')) {
                swapBackTarget = originalSlot;
              } else {
                // Find first available IR slot
                const usedSlots = Object.values(newAssignments).filter(s => s.startsWith('ir-slot-'));
                if (usedSlots.length < 3) {
                  for (let i = 1; i <= 3; i++) {
                    if (!usedSlots.includes(`ir-slot-${i}`)) {
                      swapBackTarget = `ir-slot-${i}`;
                      break;
                    }
                  }
                } else {
                  swapBackTarget = 'bench-grid';
                }
              }
            }
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
            } else if (swapBackTarget.startsWith('ir-slot-')) {
                p2.starter = false; 
                // Don't change status - player must already be IR or SUSP to get here
                newIR.push(p2);
                newAssignments[p2.id] = swapBackTarget;
            } else {
                p2.starter = true; newStarters.push(p2);
                newAssignments[p2.id] = swapBackTarget;
            }
        }

        const updatedRoster = { starters: newStarters, bench: newBench, ir: newIR, slotAssignments: newAssignments };
        
        // Save lineup to localStorage
        LeagueService.saveLineup(3, {
          starters: newStarters.map(p => p.id),
          bench: newBench.map(p => p.id),
          ir: newIR.map(p => p.id),
          slotAssignments: newAssignments
        }).catch(err => console.error('Failed to save lineup:', err));
        
        return updatedRoster;
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
                <TabsTrigger 
                  value="transactions" 
                  className="flex-1 py-4 rounded-none data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  Transactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roster" className="m-0 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Lineup</h2>
                    <ToggleGroup type="single" value={statView} onValueChange={(v) => v && setStatView(v as any)} className="bg-muted/50 p-1 rounded-lg">
                        <ToggleGroupItem value="seasonToDate" size="sm" className="text-xs">Season</ToggleGroupItem>
                        <ToggleGroupItem value="currentWeek" size="sm" className="text-xs">This Week</ToggleGroupItem>
                        <ToggleGroupItem value="restOfSeason" size="sm" className="text-xs">Rest of Season</ToggleGroupItem>
                        <ToggleGroupItem value="lastSeason" size="sm" className="text-xs">Last Year</ToggleGroupItem>
                    </ToggleGroup>
                </div>

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
                        slotAssignments={roster.slotAssignments}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Radar Charts - Category Balance */}
                  <div className="lg:col-span-2">
                    <Card className="h-full">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                           <div className="flex items-center gap-2">
                             <Target className="h-5 w-5 text-primary" />
                             <div>
                               <h3 className="font-bold text-lg">Category Balance</h3>
                               <p className="text-sm text-muted-foreground">Positional Breakdown</p>
                             </div>
                           </div>
                           <Tabs value={selectedPosMetric} onValueChange={(v) => setSelectedPosMetric(v as any)} className="w-full sm:w-auto">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="C">C</TabsTrigger>
                                <TabsTrigger value="LW">LW</TabsTrigger>
                                <TabsTrigger value="RW">RW</TabsTrigger>
                                <TabsTrigger value="D">D</TabsTrigger>
                              </TabsList>
                           </Tabs>
                        </div>
                        
                        <div className="h-[300px] w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={calculateRadarData(posStats[selectedPosMetric], selectedPosMetric)}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar
                                name={selectedPosMetric}
                                dataKey="A"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fill="#3b82f6"
                                fillOpacity={0.3}
                              />
                              <Tooltip 
                                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                 itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                          <div className="absolute top-0 right-0 text-xs text-muted-foreground text-right hidden sm:block">
                             <div className="mb-1">Chart shows % of Elite Baseline</div>
                             <div>100% = Top Tier Production</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Power Rankings & Key Insights */}
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                         <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <h3 className="font-bold text-lg">Power Rankings</h3>
                         </div>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-muted/40 rounded">
                               <span className="text-sm font-medium">Offense</span>
                               <Badge className="bg-green-500 hover:bg-green-600">A-</Badge>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-muted/40 rounded">
                               <span className="text-sm font-medium">Defense</span>
                               <Badge className="bg-yellow-500 hover:bg-yellow-600">B</Badge>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-muted/40 rounded">
                               <span className="text-sm font-medium">Goalie</span>
                               <Badge className="bg-blue-500 hover:bg-blue-600">A</Badge>
                            </div>
                             <div className="flex justify-between items-center p-2 bg-muted/40 rounded">
                               <span className="text-sm font-medium">Depth</span>
                               <Badge className="bg-orange-500 hover:bg-orange-600">C+</Badge>
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Detailed Stat Breakdown Table */}
                <Card className="mt-6">
                   <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                         <BarChart3 className="h-5 w-5 text-gray-500" />
                         <h3 className="font-bold text-lg">Projected Season Totals</h3>
                      </div>
                      
                      <div className="space-y-6">
                        {['C', 'LW', 'RW', 'D'].map(pos => (
                          <div key={pos}>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">{pos === 'C' ? 'Centers' : (pos === 'D' ? 'Defensemen' : `${pos} Wingers`)}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                               {Object.entries(posStats[pos as 'C'|'LW'|'RW'|'D']).map(([key, value]) => (
                                  <div key={key} className="flex flex-col p-3 bg-muted/30 rounded-lg border text-center">
                                     <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">{key}</span>
                                     <span className="text-xl font-bold mt-1 text-foreground">{value}</span>
                                  </div>
                               ))}
                            </div>
                          </div>
                        ))}
                      </div>
                   </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="m-0 p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold mb-4">Transaction History</h3>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      No transactions found.
                    </div>
                  ) : (
                    <div className="rounded-md border">
                       <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
                          <div className="col-span-2">Date</div>
                          <div className="col-span-2">Type</div>
                          <div className="col-span-4">Player</div>
                          <div className="col-span-2">Team</div>
                          <div className="col-span-2 text-right">Status</div>
                       </div>
                       {transactions.map((tx) => (
                         <div key={tx.id} className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 border-b last:border-0 text-sm md:items-center hover:bg-muted/20 transition-colors relative">
                            {/* Mobile Top Row: Date & Status */}
                            <div className="flex md:hidden justify-between items-start mb-1">
                                <div className="text-muted-foreground text-xs">{tx.date}</div>
                                <div className="text-right">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    tx.status === 'processed' ? 'bg-green-100 text-green-700' : 
                                    (tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                  }`}>
                                    {tx.status}
                                  </span>
                                </div>
                            </div>

                            {/* Desktop: Date */}
                            <div className="hidden md:block col-span-2 text-muted-foreground">{tx.date}</div>
                            
                            {/* Type Badge */}
                            <div className="col-span-2 capitalize font-medium flex items-center">
                              <Badge variant={tx.type === 'claim' ? 'default' : (tx.type === 'drop' ? 'destructive' : 'secondary')} className="text-xs">
                                {tx.type}
                              </Badge>
                            </div>

                            {/* Player & Team (Mobile: Combined) */}
                            <div className="col-span-4 font-medium text-base md:text-sm flex items-center gap-2">
                                {tx.playerName}
                                <span className="md:hidden text-muted-foreground font-normal text-xs">• {tx.playerTeam}</span>
                            </div>

                            {/* Desktop: Team */}
                            <div className="hidden md:block col-span-2">{tx.playerTeam}</div>
                            
                            {/* Desktop: Status */}
                            <div className="hidden md:block col-span-2 text-right">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                tx.status === 'processed' ? 'bg-green-100 text-green-700' : 
                                (tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                              }`}>
                                {tx.status}
                              </span>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
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
