import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRightLeft, Star } from 'lucide-react';
import { StartersGrid, BenchGrid, IRSlot } from '@/components/roster';
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';
import { useState, useEffect } from 'react';
import { PlayerService } from '@/services/PlayerService';
import { LeagueService } from '@/services/LeagueService';
import PlayerStatsModal from '@/components/PlayerStatsModal';

import { ErrorBoundary } from "@/components/ErrorBoundary";

// Helper for fantasy position (reused)
const getFantasyPosition = (position: string): 'C' | 'LW' | 'RW' | 'D' | 'G' | 'UTIL' => {
  const pos = position?.toUpperCase() || '';
  
  if (['C', 'CENTRE', 'CENTER'].includes(pos)) return 'C';
  if (['LW', 'LEFT WING', 'LEFTWING', 'L'].includes(pos)) return 'LW';
  if (['RW', 'RIGHT WING', 'RIGHTWING', 'R'].includes(pos)) return 'RW';
  if (['D', 'DEFENCE', 'DEFENSE'].includes(pos)) return 'D';
  if (['G', 'GOALIE'].includes(pos)) return 'G';
  
  return 'UTIL';
};

const OtherTeam = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<{
    starters: HockeyPlayer[];
    bench: HockeyPlayer[];
    ir: HockeyPlayer[];
    slotAssignments: Record<string, string>;
  }>({ starters: [], bench: [], ir: [], slotAssignments: {} });

  // Player Stats Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<HockeyPlayer | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);

  // Get team from LeagueService
  const teams = LeagueService.getAllTeams();
  const team = teams.find(t => t.id === Number(teamId));

  const handlePlayerClick = (player: HockeyPlayer) => {
    setSelectedPlayer(player);
    setIsPlayerDialogOpen(true);
  };

  useEffect(() => {
    const loadRoster = async () => {
      setLoading(true);
      try {
        // Get consistent roster for this team from LeagueService
        const allPlayers = await PlayerService.getAllPlayers();
        const teamPlayers = await LeagueService.getTeamRoster(Number(teamId), allPlayers);

        const transformedPlayers: HockeyPlayer[] = teamPlayers.map((p) => ({
          id: p.id,
          name: p.full_name,
          position: p.position,
          number: parseInt(p.jersey_number || '0'),
          starter: false,
          stats: {
            gamesPlayed: p.games_played || 0,
            goals: p.goals || 0,
            assists: p.assists || 0,
            points: p.points || 0,
            plusMinus: p.plus_minus || 0,
            shots: p.shots || 0,
            hits: p.hits || 0,
            blockedShots: p.blocks || 0,
            xGoals: p.xGoals || 0,
            corsi: p.corsi || 0,
            fenwick: p.fenwick || 0,
            wins: p.wins || 0,
            losses: p.losses || 0,
            otl: p.ot_losses || 0,
            gaa: p.goals_against_average || 0,
            savePct: p.save_percentage || 0,
            shutouts: 0
          },
          team: p.team,
          teamAbbreviation: p.team,
          status: p.status === 'injured' ? 'IR' : (p.status === 'active' ? null : 'WVR'),
          image: p.headshot_url || undefined,
          // Use deterministic value for initial assignment (hash player ID for consistency)
          nextGame: { opponent: 'vs OPP', isToday: (parseInt(String(p.id)) % 2 === 0) },
          projectedPoints: (p.points || 0) / 20
        }));

        // Sort players consistently by ID for deterministic auto-assignment
        transformedPlayers.sort((a, b) => {
          const idA = typeof a.id === 'string' ? parseInt(a.id) : a.id;
          const idB = typeof b.id === 'string' ? parseInt(b.id) : b.id;
          return idA - idB;
        });

        // Check for saved lineup first (for this team)
        const savedLineup = await LeagueService.getLineup(Number(teamId));
        
        if (savedLineup) {
          // Restore saved lineup for this team
          const playerMap = new Map(transformedPlayers.map(p => [String(p.id), p]));
          const savedPlayerIds = new Set([
            ...savedLineup.starters,
            ...savedLineup.bench,
            ...savedLineup.ir
          ]);
          
          // Helper to deduplicate IDs
          const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

          const starters = uniqueIds(savedLineup.starters)
            .map(id => {
              const player = playerMap.get(id);
              if (!player) return null;
              return { ...player, starter: true };
            })
            .filter((p): p is HockeyPlayer => !!p);
          
          const bench = uniqueIds(savedLineup.bench)
            .map(id => playerMap.get(id))
            .filter((p): p is HockeyPlayer => !!p);
          
          const ir = uniqueIds(savedLineup.ir)
            .map(id => playerMap.get(id))
            .filter((p): p is HockeyPlayer => !!p);
          
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
          // No saved lineup - auto-assign slots
          const starters: HockeyPlayer[] = [];
          const bench: HockeyPlayer[] = [];
          const ir: HockeyPlayer[] = [];
          const assignments: Record<string, string> = {};
          
          const slotsNeeded = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'G': 2, 'UTIL': 1 };
          const slotsFilled = { 'C': 0, 'LW': 0, 'RW': 0, 'D': 0, 'G': 0, 'UTIL': 0 };
          
          let irSlotIndex = 1;

          // Only use actual IR/SUSP status for IR placement (deterministic)
          // Don't use nextGame.isToday for initial auto-assignment
          transformedPlayers.forEach(p => {
            if (p.status === 'IR' || p.status === 'SUSP') {
              if (irSlotIndex <= 3) {
                ir.push(p);
                assignments[p.id] = `ir-slot-${irSlotIndex}`;
                irSlotIndex++;
              } else {
                bench.push(p);
              }
              return;
            }
            const pos = getFantasyPosition(p.position);
            let assigned = false;

            if (pos !== 'UTIL' && slotsFilled[pos] < slotsNeeded[pos]) {
              slotsFilled[pos]++;
              assigned = true;
              assignments[p.id] = `slot-${pos}-${slotsFilled[pos]}`;
            } else if (pos !== 'G' && slotsFilled['UTIL'] < slotsNeeded['UTIL']) {
              slotsFilled['UTIL']++;
              assigned = true;
              assignments[p.id] = `slot-UTIL`;
            }

            if (assigned) {
              starters.push({ ...p, starter: true });
            } else {
              bench.push(p);
            }
          });

          const initialRoster = { starters, bench, ir, slotAssignments: assignments };
          setRoster(initialRoster);
          
          // Save initial lineup for this team
          await LeagueService.saveLineup(Number(teamId), {
            starters: starters.map(p => p.id),
            bench: bench.map(p => p.id),
            ir: ir.map(p => p.id),
            slotAssignments: assignments
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadRoster();
    }
  }, [teamId]);

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <Button onClick={() => navigate('/standings')}>Back to Standings</Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-muted/50" 
          onClick={() => navigate('/standings')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Standings
        </Button>

        <div className="bg-card rounded-xl shadow-lg border p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/20 shadow-inner">
                {team.logo}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Star className="w-4 h-4 fill-muted-foreground/30" />
                  <span>Manager: <span className="font-medium text-foreground">{team.owner}</span></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="text-lg px-4 py-1.5 h-auto flex flex-col items-center justify-center gap-0.5 bg-background border shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Record</span>
                <span className="font-bold">{team.record.wins}-{team.record.losses}</span>
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-1.5 h-auto flex flex-col items-center justify-center gap-0.5 bg-background border shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Points</span>
                <span className="font-bold text-primary">{team.points.toLocaleString()}</span>
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-1.5 h-auto flex flex-col items-center justify-center gap-0.5 bg-background border shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Rank</span>
                <span className="font-bold">#{teams.findIndex(t => t.id === team.id) + 1}</span>
              </Badge>
            </div>

            <Button 
              size="lg" 
              className="w-full md:w-auto shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate(`/trade-analyzer?partner=${team.id}`)}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Propose Trade
            </Button>
          </div>
        </div>

        <div className="space-y-8 animate-fade-in">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading roster...</div>
          ) : (
            <>
              <StartersGrid 
                players={roster.starters} 
                slotAssignments={roster.slotAssignments}
                className="bg-card/50 p-6 rounded-xl border shadow-sm"
                onPlayerClick={handlePlayerClick}
              />
              <BenchGrid 
                players={roster.bench}
                className="bg-card/50 p-6 rounded-xl border shadow-sm"
                onPlayerClick={handlePlayerClick}
              />
              {roster.ir.length > 0 && (
                <IRSlot 
                  players={roster.ir}
                  slotAssignments={roster.slotAssignments}
                  onPlayerClick={handlePlayerClick}
                />
              )}
            </>
          )}
        </div>

        {/* Player Stats Modal */}
        <PlayerStatsModal
          player={selectedPlayer}
          isOpen={isPlayerDialogOpen}
          onClose={() => setIsPlayerDialogOpen(false)}
        />
      </main>
      <Footer />
    </div>
    </ErrorBoundary>
  );
};

export default OtherTeam;

