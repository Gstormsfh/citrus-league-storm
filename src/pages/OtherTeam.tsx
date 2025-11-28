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

// Mock teams data (should match Standings.tsx or be centralized)
const teams = [
  { id: 1, name: 'Touchdown Titans', owner: 'Alex Johnson', logo: 'TT', record: { wins: 9, losses: 1 }, points: 1432, streak: 'W4' },
  { id: 2, name: 'Scoring Sharks', owner: 'Samantha Lee', logo: 'SS', record: { wins: 8, losses: 2 }, points: 1378, streak: 'W2' },
  { id: 3, name: 'Citrus Crushers', owner: 'You', logo: 'CC', record: { wins: 7, losses: 3 }, points: 1247, streak: 'W1' },
  { id: 4, name: 'Field Generals', owner: 'Carlos Rodriguez', logo: 'FG', record: { wins: 6, losses: 4 }, points: 1189, streak: 'L1' },
  { id: 5, name: 'Blitz Brigade', owner: 'Taylor Kim', logo: 'BB', record: { wins: 5, losses: 5 }, points: 1145, streak: 'W3' },
  { id: 6, name: 'Goal Getters', owner: 'Jamie Zhang', logo: 'GG', record: { wins: 4, losses: 6 }, points: 1102, streak: 'L2' },
  { id: 7, name: 'Victory Vipers', owner: 'Morgan Williams', logo: 'VV', record: { wins: 3, losses: 7 }, points: 1067, streak: 'L4' },
  { id: 8, name: 'Hustle Heroes', owner: 'Jordan Patel', logo: 'HH', record: { wins: 2, losses: 8 }, points: 987, streak: 'L1' },
  { id: 9, name: 'Gridiron Gladiators', owner: 'Casey Thompson', logo: 'GG', record: { wins: 1, losses: 9 }, points: 896, streak: 'L6' },
];

// Helper for fantasy position (reused)
const getFantasyPosition = (position: string): 'C' | 'LW' | 'RW' | 'D' | 'G' | 'UTIL' => {
  if (position === 'Centre' || position === 'C') return 'C';
  if (position === 'Left Wing' || position === 'LW') return 'LW';
  if (position === 'Right Wing' || position === 'RW') return 'RW';
  if (position === 'Defence' || position === 'D') return 'D';
  if (position === 'Goalie' || position === 'G') return 'G';
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

  const team = teams.find(t => t.id === Number(teamId));

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
            shutouts: 0
          },
          team: p.team,
          teamAbbreviation: p.team,
          status: p.status === 'injured' ? 'IR' : null,
          image: p.headshot_url || undefined,
          nextGame: { opponent: 'vs OPP', isToday: Math.random() > 0.3 },
          projectedPoints: (p.points || 0) / 20
        }));

        // Auto-assign slots
        const starters: HockeyPlayer[] = [];
        const bench: HockeyPlayer[] = [];
        const ir: HockeyPlayer[] = [];
        const assignments: Record<string, string> = {};
        
        const slotsNeeded = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'G': 2, 'UTIL': 1 };
        const slotsFilled = { 'C': 0, 'LW': 0, 'RW': 0, 'D': 0, 'G': 0, 'UTIL': 0 };

        transformedPlayers.forEach(p => {
          if (p.status === 'IR') {
            ir.push(p);
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

        setRoster({ starters, bench, ir, slotAssignments: assignments });
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
              />
              <BenchGrid 
                players={roster.bench}
                className="bg-card/50 p-6 rounded-xl border shadow-sm"
              />
              {roster.ir.length > 0 && (
                <IRSlot players={roster.ir} />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OtherTeam;

