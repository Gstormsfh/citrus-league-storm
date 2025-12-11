import React, { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useLeague } from '@/contexts/LeagueContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LeagueCreationCTA } from '@/components/LeagueCreationCTA';
import { DemoDataService } from '@/services/DemoDataService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamCard } from "@/components/matchup/TeamCard";
import { ScoreCard } from "@/components/matchup/ScoreCard";
import { DailyPointsChart } from "@/components/matchup/DailyPointsChart";
import { MatchupHistory } from "@/components/matchup/MatchupHistory";
import { LiveUpdates } from "@/components/matchup/LiveUpdates";
import { Button } from "@/components/ui/button";
import { MatchupPlayer } from "@/components/matchup/types";
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';
import PlayerStatsModal from '@/components/PlayerStatsModal';
import { LeagueService, League, Team } from '@/services/LeagueService';
import { MatchupService, Matchup } from '@/services/MatchupService';
import { PlayerService } from '@/services/PlayerService';
import { getDraftCompletionDate, getFirstWeekStartDate, getCurrentWeekNumber, getAvailableWeeks, getWeekLabel } from '@/utils/weekCalculator';
import { Loader2 } from 'lucide-react';

const Matchup = () => {
  const { user, profile } = useAuth();
  const { userLeagueState } = useLeague();
  const [activeTab, setActiveTab] = useState("lineup");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<HockeyPlayer | null>(null);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);

  // Real data state
  const [league, setLeague] = useState<League | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [firstWeekStart, setFirstWeekStart] = useState<Date | null>(null);
  const [myTeam, setMyTeam] = useState<MatchupPlayer[]>([]);
  const [opponentTeamPlayers, setOpponentTeamPlayers] = useState<MatchupPlayer[]>([]);
  const [myTeamSlotAssignments, setMyTeamSlotAssignments] = useState<Record<string, string>>({});
  const [opponentTeamSlotAssignments, setOpponentTeamSlotAssignments] = useState<Record<string, string>>({});
  const [myTeamRecord, setMyTeamRecord] = useState<{ wins: number; losses: number }>({ wins: 0, losses: 0 });
  const [opponentTeamRecord, setOpponentTeamRecord] = useState<{ wins: number; losses: number }>({ wins: 0, losses: 0 });
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  const [myDailyPoints, setMyDailyPoints] = useState<number[]>([]);
  const [opponentDailyPoints, setOpponentDailyPoints] = useState<number[]>([]);

  // Demo data - shown to guests and logged-in users without leagues
  // Load from actual demo rosters instead of static data
  const [demoMyTeam, setDemoMyTeam] = useState<MatchupPlayer[]>([]);
  const [demoOpponentTeam, setDemoOpponentTeam] = useState<MatchupPlayer[]>([]);
  
  // Load demo matchup data from actual rosters
  useEffect(() => {
    if (userLeagueState === 'active-user') {
      setDemoMyTeam([]);
      setDemoOpponentTeam([]);
      setLoading(false);
      return;
    }
    
    const loadDemoMatchup = async () => {
      try {
        setLoading(true);
        console.log('[Matchup] Loading demo matchup data...');
        const matchupData = await DemoDataService.getDemoMatchupData();
        console.log('[Matchup] Demo matchup data loaded:', {
          myTeamCount: matchupData.myTeam.length,
          opponentTeamCount: matchupData.opponentTeam.length
        });
        setDemoMyTeam(matchupData.myTeam);
        setDemoOpponentTeam(matchupData.opponentTeam);
        setLoading(false);
      } catch (error) {
        console.error('[Matchup] Error loading demo matchup data:', error);
        // Fallback to static data if loading fails
        console.log('[Matchup] Falling back to static demo data');
        const staticMyTeam = DemoDataService.getDemoMyTeam();
        const staticOpponentTeam = DemoDataService.getDemoOpponentTeam();
        setDemoMyTeam(staticMyTeam);
        setDemoOpponentTeam(staticOpponentTeam);
        setLoading(false);
      }
    };
    
    loadDemoMatchup();
  }, [userLeagueState]);

  const toHockeyPlayer = (p: MatchupPlayer): HockeyPlayer => ({
    id: p.id.toString(),
    name: p.name,
    position: p.position,
    number: 0,
    starter: p.isStarter,
    stats: {
      goals: p.stats.goals,
      assists: p.stats.assists,
      points: p.points,
      plusMinus: 0,
      shots: p.stats.sog,
      gamesPlayed: p.stats.gamesPlayed || 0,
      hits: 0,
      blockedShots: p.stats.blk,
      wins: 0,
      losses: 0,
      otl: 0,
      gaa: 0,
      savePct: 0,
      shutouts: 0
    },
    team: p.team,
    teamAbbreviation: p.team,
    status: p.status === 'Yet to Play' ? null : (p.status === 'In Game' ? 'Active' : null),
    image: undefined,
    projectedPoints: 0
  });

  const handlePlayerClick = (player: MatchupPlayer) => {
    setSelectedPlayer(toHockeyPlayer(player));
    setIsPlayerDialogOpen(true);
  };

  const [updates] = useState<string[]>([
    "Connor McDavid scored a goal! +5 points.",
    "David Pastrnak with an assist! +3 points.",
    "Igor Shesterkin made a save! +0.2 points.",
    "Adam Fox with a power play assist! +4 points."
  ]);

  const getTeamPoints = (team: MatchupPlayer[]) => {
    return team.reduce((sum, player) => sum + player.points, 0).toFixed(1);
  };

  // Use real data if active user, otherwise demo data
  // CRITICAL: Ensure myTeam is always the user's team (left side)
  // and opponentTeamPlayers is always the opponent (right side)
  const displayMyTeam = userLeagueState === 'active-user' ? myTeam : demoMyTeam;
  const displayOpponentTeam = userLeagueState === 'active-user' ? opponentTeamPlayers : demoOpponentTeam;

  // DEBUG: Log team data for verification
  if (user && myTeam.length > 0 && opponentTeamPlayers.length > 0) {
    console.log('Display teams:', {
      myTeamName: userTeam?.team_name,
      myTeamPlayerCount: displayMyTeam.length,
      opponentTeamName: opponentTeam?.team_name,
      opponentTeamPlayerCount: displayOpponentTeam.length,
      myStartersCount: displayMyTeam.filter(p => p.isStarter).length,
      opponentStartersCount: displayOpponentTeam.filter(p => p.isStarter).length
    });
  }

  const myTeamPoints = getTeamPoints(displayMyTeam);
  const opponentTeamPoints = getTeamPoints(displayOpponentTeam);

  const myStarters = displayMyTeam.filter(p => p.isStarter);
  const myBench = displayMyTeam.filter(p => !p.isStarter);
  const opponentStarters = displayOpponentTeam.filter(p => p.isStarter);
  const opponentBench = displayOpponentTeam.filter(p => !p.isStarter);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Calculate daily points - only if matchup has started and has scores
  const hasMatchupData = currentMatchup && 
    (currentMatchup.status === 'in_progress' || currentMatchup.status === 'completed') &&
    (parseFloat(String(currentMatchup.team1_score)) > 0 || parseFloat(String(currentMatchup.team2_score)) > 0);
  
  // For demo/non-logged-in users, use empty arrays (will show empty state)
  const displayMyDailyPoints = user ? myDailyPoints : [];
  const displayOpponentDailyPoints = user ? opponentDailyPoints : [];


  // Load real matchup data for logged-in users with leagues
  useEffect(() => {
    if (!user || userLeagueState !== 'active-user') {
      setLoading(false);
      return;
    }

    const loadMatchupData = async () => {
      // Clear roster cache to ensure fresh data when navigating from roster page
      MatchupService.clearRosterCache();
      try {
        setLoading(true);
        setError(null);

        // Get user's leagues
        const { leagues: userLeagues, error: leaguesError } = await LeagueService.getUserLeagues(user.id);
        if (leaguesError) throw leaguesError;

        if (userLeagues.length === 0) {
          setError('You are not in any leagues');
          setLoading(false);
          return;
        }

        // Use first league (or allow selection later)
        const currentLeague = userLeagues[0];
        setLeague(currentLeague);

        // Check if draft is completed
        if (currentLeague.draft_status !== 'completed') {
          setError('Draft must be completed before viewing matchups');
          setLoading(false);
          return;
        }

        // Get user's team
        const { team: userTeamData } = await LeagueService.getUserTeam(currentLeague.id, user.id);
        if (!userTeamData) {
          setError('You do not have a team in this league');
          setLoading(false);
          return;
        }
        setUserTeam(userTeamData);

        // Calculate first week start date
        const draftCompletionDate = getDraftCompletionDate(currentLeague);
        if (!draftCompletionDate) {
          setError('Could not determine draft completion date');
          setLoading(false);
          return;
        }

        const firstWeek = getFirstWeekStartDate(draftCompletionDate);
        setFirstWeekStart(firstWeek);

        // Get available weeks
        const currentYear = new Date().getFullYear();
        const weeks = getAvailableWeeks(firstWeek, currentYear);
        setAvailableWeeks(weeks);

        // Get current week number
        const currentWeek = getCurrentWeekNumber(firstWeek);
        const weekToShow = weeks.includes(currentWeek) ? currentWeek : weeks[0] || 1;
        setSelectedWeek(weekToShow);

        // Generate matchups if they don't exist
        const { teams: leagueTeams } = await LeagueService.getLeagueTeams(currentLeague.id);
        await MatchupService.generateMatchupsForLeague(currentLeague.id, leagueTeams, firstWeek);

        // Load matchup for selected week (pass userTeamData to avoid race condition)
        await loadMatchupForWeek(currentLeague.id, user.id, weekToShow, firstWeek, userTeamData);

      } catch (err: any) {
        console.error('Error loading matchup data:', err);
        setError(err.message || 'Failed to load matchup data');
      } finally {
        setLoading(false);
      }
    };

    loadMatchupData();
  }, [user]);

  // Refresh matchup when page becomes visible (e.g., navigating back from roster page)
  useEffect(() => {
    if (!user || !league || !firstWeekStart || !userTeam) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible - refresh matchup to get latest lineup changes
        console.log('[Matchup] Page visible, refreshing matchup data...');
        MatchupService.clearRosterCache(userTeam.id, league.id);
        loadMatchupForWeek(league.id, user.id, selectedWeek, firstWeekStart, userTeam).catch(err => {
          console.error('Error refreshing matchup:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, league, firstWeekStart, userTeam, selectedWeek]);

  const loadMatchupForWeek = async (leagueId: string, userId: string, weekNumber: number, firstWeekStart: Date, userTeamData?: Team) => {
    try {
      // Use passed userTeamData or fall back to state
      const effectiveUserTeam = userTeamData || userTeam;
      
      // Get matchup for this week
      const { matchup, error: matchupError } = await MatchupService.getUserMatchup(leagueId, userId, weekNumber);
      if (matchupError) throw matchupError;

      if (!matchup) {
        setError(`No matchup found for week ${weekNumber}`);
        return;
      }

      // Store current matchup for daily points calculation
      setCurrentMatchup(matchup);

      // Validate: Ensure team1_id !== team2_id (prevent duplicate teams)
      if (matchup.team2_id && matchup.team1_id === matchup.team2_id) {
        setError(`Invalid matchup: Both teams are the same (${matchup.team1_id}). Please contact the commissioner to fix this matchup.`);
        return;
      }

      // Determine which team the user is (team1 or team2)
      const isTeam1 = matchup.team1_id === effectiveUserTeam?.id;
      const opponentTeamId = isTeam1 ? matchup.team2_id : matchup.team1_id;
      
      // Get opponent team object - this is the actual opponent, never swapped
      let opponentTeamObj: Team | null = null;
      if (opponentTeamId) {
        const { teams } = await LeagueService.getLeagueTeams(leagueId);
        opponentTeamObj = teams.find(t => t.id === opponentTeamId) || null;
      }
      
      // DEBUG: Log team identification
      console.log('Matchup team identification:', {
        userTeamId: effectiveUserTeam?.id,
        userTeamName: effectiveUserTeam?.team_name,
        matchupTeam1Id: matchup.team1_id,
        matchupTeam2Id: matchup.team2_id,
        isTeam1,
        opponentTeamId,
        opponentTeamName: opponentTeamObj?.team_name
      });
      
      // Validate: Ensure opponentTeam is different from userTeam
      if (opponentTeamObj && effectiveUserTeam && opponentTeamObj.id === effectiveUserTeam.id) {
        console.error('ERROR: Opponent team is the same as user team!', {
          userTeamId: effectiveUserTeam.id,
          userTeamName: effectiveUserTeam.team_name,
          opponentTeamId: opponentTeamObj.id,
          opponentTeamName: opponentTeamObj.team_name
        });
        setError('Invalid matchup: Opponent team cannot be the same as your team.');
        return;
      }
      
      // ALWAYS set opponentTeam to the actual opponent (not swapped)
      // userTeam is already set correctly (always the user's team, never swapped)
      setOpponentTeam(opponentTeamObj);

      // Load all players
      const allPlayers = await PlayerService.getAllPlayers();

      // Get rosters for both teams with slot assignments
      // Get user timezone from profile (default to Mountain Time)
      const userTimezone = profile?.timezone || 'America/Denver';
      const { 
        team1Roster, 
        team2Roster, 
        team1SlotAssignments, 
        team2SlotAssignments, 
        error: rostersError 
      } = await MatchupService.getMatchupRosters(matchup, allPlayers, userTimezone);
      
      if (rostersError) {
        // Provide helpful error message
        const errorMessage = rostersError.message || 'Failed to load matchup rosters';
        if (errorMessage.includes('no lineup')) {
          setError(`${errorMessage}. Rosters may need to be initialized. Please ensure the draft is completed and rosters are set up.`);
        } else {
          setError(errorMessage);
        }
        return;
      }

      // CRITICAL: ALWAYS ensure user's team data is in myTeam/myStarters/myBench (LEFT side)
      // and opponent's team data is in opponentTeamPlayers/opponentStarters/opponentBench (RIGHT side)
      // This ensures consistent display regardless of whether user is team1 or team2
      if (isTeam1) {
        // User is team1 - team1 data goes to myTeam (left), team2 data goes to opponent (right)
        setMyTeam(team1Roster);
        setOpponentTeamPlayers(team2Roster);
        setMyTeamSlotAssignments(team1SlotAssignments);
        setOpponentTeamSlotAssignments(team2SlotAssignments);
      } else {
        // User is team2 - swap rosters so user's team (team2) goes to myTeam (left)
        // and opponent (team1) goes to opponentTeamPlayers (right)
        setMyTeam(team2Roster);
        setOpponentTeamPlayers(team1Roster);
        setMyTeamSlotAssignments(team2SlotAssignments);
        setOpponentTeamSlotAssignments(team1SlotAssignments);
      }

      // Get team records from matchup history
      // Always fetch records for user's team and opponent team (correctly identified above)
      if (effectiveUserTeam) {
        const myRecord = await MatchupService.getTeamRecord(effectiveUserTeam.id, leagueId);
        setMyTeamRecord(myRecord);
      }
      if (opponentTeamObj) {
        const oppRecord = await MatchupService.getTeamRecord(opponentTeamObj.id, leagueId);
        setOpponentTeamRecord(oppRecord);
      } else {
        // Bye week - set default record
        setOpponentTeamRecord({ wins: 0, losses: 0 });
      }

      // Calculate daily points if matchup has data
      const matchupStatus = matchup.status;
      const team1Score = parseFloat(String(matchup.team1_score)) || 0;
      const team2Score = parseFloat(String(matchup.team2_score)) || 0;
      const hasScores = team1Score > 0 || team2Score > 0;
      const shouldCalculatePoints = (matchupStatus === 'in_progress' || matchupStatus === 'completed') && hasScores;

      if (shouldCalculatePoints) {
        // For now, distribute points evenly across the week
        // TODO: Implement actual daily calculation based on game schedules
        const myTotalPoints = isTeam1 ? team1Score : team2Score;
        const oppTotalPoints = isTeam1 ? team2Score : team1Score;
        
        // Simple distribution: divide by 7 days
        const myDaily = Array(7).fill(myTotalPoints / 7);
        const oppDaily = Array(7).fill(oppTotalPoints / 7);
        
        setMyDailyPoints(myDaily);
        setOpponentDailyPoints(oppDaily);
      } else {
        // No data yet - set empty arrays
        setMyDailyPoints([]);
        setOpponentDailyPoints([]);
      }

    } catch (err: any) {
      console.error('Error loading matchup for week:', err);
      setError(err.message || 'Failed to load matchup');
    }
  };

  // Handle week selection
  const handleWeekChange = async (weekNumber: number) => {
    if (!league || !user || !firstWeekStart) return;
    setSelectedWeek(weekNumber);
    // Clear cache before loading to ensure fresh lineup data
    if (userTeam) {
      MatchupService.clearRosterCache(userTeam.id, league.id);
    }
    await loadMatchupForWeek(league.id, user.id, weekNumber, firstWeekStart, userTeam);
  };
  
  // Refresh matchup data (useful after making lineup changes on roster page)
  const refreshMatchup = async () => {
    if (!league || !user || !firstWeekStart || !userTeam) return;
    // Clear all caches to force fresh data
    MatchupService.clearRosterCache();
    await loadMatchupForWeek(league.id, user.id, selectedWeek, firstWeekStart, userTeam);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative elements to match Home page */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--vibrant-yellow))] rounded-full opacity-10 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[hsl(var(--vibrant-green))] rounded-full opacity-10 blur-3xl -z-10"></div>

      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
             <div>
               <h1 className="text-4xl font-bold mb-2 citrus-gradient-text">Matchup</h1>
               {loading ? (
                 <p className="text-muted-foreground text-lg">Loading...</p>
               ) : error ? (
                 <p className="text-destructive text-lg">{error}</p>
               ) : userLeagueState === 'active-user' && firstWeekStart ? (
                 <p className="text-muted-foreground text-lg">
                   {getWeekLabel(selectedWeek, firstWeekStart)} • {userTeam?.team_name || 'My Team'} vs {opponentTeam?.team_name || 'Bye Week'}
                 </p>
               ) : (
                 <p className="text-muted-foreground text-lg">Week 12 • Citrus Crushers vs Thunder Titans</p>
               )}
             </div>
             {userLeagueState === 'active-user' && availableWeeks.length > 0 && (
               <div className="flex gap-2 flex-wrap">
                 {availableWeeks.map((week) => (
                   <Button
                     key={week}
                     variant={week === selectedWeek ? "default" : "outline"}
                     className={`rounded-full ${week === selectedWeek ? 'bg-primary hover:bg-primary/90 text-white shadow-md' : 'border-primary/20 hover:bg-primary/5 hover:text-primary'}`}
                     onClick={() => handleWeekChange(week)}
                   >
                     {firstWeekStart ? getWeekLabel(week, firstWeekStart).split(' • ')[0] : `Week ${week}`}
                   </Button>
                 ))}
               </div>
             )}
             {(userLeagueState === 'guest' || userLeagueState === 'logged-in-no-league') && (
               <div className="flex gap-2">
                 <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">Week 11</Button>
                 <Button className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md">Week 12</Button>
                 <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">Week 13</Button>
               </div>
             )}
          </div>
          
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">
                {userLeagueState === 'guest' || userLeagueState === 'logged-in-no-league' 
                  ? 'Loading demo matchup...' 
                  : 'Loading matchup...'}
              </p>
            </div>
          )}
          
          {!loading && error && userLeagueState === 'active-user' && (
            <div className="text-center py-20">
              <p className="text-destructive text-lg">{error}</p>
            </div>
          )}
          
          {userLeagueState === 'logged-in-no-league' && !loading && (
            <div className="py-12">
              <LeagueCreationCTA 
                title="Your Matchup Awaits"
                description="Create your league to start competing in weekly matchups, track your team's performance, and climb the standings."
              />
            </div>
          )}

          {!loading && (
            (userLeagueState === 'guest' && (demoMyTeam.length > 0 || demoOpponentTeam.length > 0)) ||
            (userLeagueState === 'active-user' && !error) ||
            (userLeagueState === 'logged-in-no-league' && (demoMyTeam.length > 0 || demoOpponentTeam.length > 0))
          ) && (
            <>
          
          <ScoreCard
            myTeamName={userLeagueState === 'active-user' ? (userTeam?.team_name || 'My Team') : 'Citrus Crushers'}
            myTeamRecord={userLeagueState === 'active-user' ? myTeamRecord : { wins: 7, losses: 3 }}
            opponentTeamName={userLeagueState === 'active-user' ? (opponentTeam?.team_name || 'Bye Week') : 'Thunder Titans'}
            opponentTeamRecord={userLeagueState === 'active-user' ? opponentTeamRecord : { wins: 9, losses: 1 }}
            myTeamPoints={myTeamPoints}
            opponentTeamPoints={opponentTeamPoints}
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="w-full justify-start border-b bg-transparent p-0 rounded-none h-auto gap-6">
              <TabsTrigger 
                value="lineup" 
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-muted-foreground data-[state=active]:border-fantasy-secondary data-[state=active]:text-fantasy-secondary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all hover:text-fantasy-secondary/80"
              >
                Lineup
              </TabsTrigger>
              <TabsTrigger 
                value="dailyPoints" 
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-muted-foreground data-[state=active]:border-fantasy-secondary data-[state=active]:text-fantasy-secondary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all hover:text-fantasy-secondary/80"
              >
                Daily Points
              </TabsTrigger>
              <TabsTrigger 
                value="matchupHistory" 
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-muted-foreground data-[state=active]:border-fantasy-secondary data-[state=active]:text-fantasy-secondary data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all hover:text-fantasy-secondary/80"
              >
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="lineup" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User's Team - Always on the LEFT - First in DOM order */}
                <div className="order-1 lg:order-1">
                {userLeagueState === 'logged-in-no-league' ? (
                  <LeagueCreationCTA 
                    title="Your Team Here"
                    description="Create your league to start building your roster and competing in matchups."
                    variant="compact"
                  />
                ) : (
                  <TeamCard
                    title={userLeagueState === 'active-user' ? (userTeam?.team_name || 'My Team') : 'Citrus Crushers'}
                    starters={myStarters}
                    bench={myBench}
                    slotAssignments={myTeamSlotAssignments}
                    gradientClass="border-t-4 border-fantasy-secondary"
                    onPlayerClick={handlePlayerClick}
                  />
                )}
                </div>
                {/* Opponent Team - Always on the RIGHT - Second in DOM order */}
                <div className="order-2 lg:order-2">
                {userLeagueState === 'logged-in-no-league' ? (
                  <LeagueCreationCTA 
                    title="Opponent Team"
                    description="Create your league to see your matchups and compete against other teams."
                    variant="compact"
                  />
                ) : (
                  <TeamCard
                    title={userLeagueState === 'active-user' ? (opponentTeam?.team_name || 'Bye Week') : 'Thunder Titans'}
                    starters={opponentStarters}
                    bench={opponentBench}
                    slotAssignments={opponentTeamSlotAssignments}
                    gradientClass="border-t-4 border-fantasy-primary"
                    onPlayerClick={handlePlayerClick}
                  />
                )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dailyPoints" className="mt-8">
              <DailyPointsChart
                dayLabels={dayLabels}
                myDailyPoints={displayMyDailyPoints}
                opponentDailyPoints={displayOpponentDailyPoints}
                hasData={hasMatchupData}
              />
            </TabsContent>
            
            <TabsContent value="matchupHistory" className="mt-8">
              <MatchupHistory
                leagueId={league?.id}
                userTeamId={userTeam?.id}
                opponentTeamId={opponentTeam?.id}
                userTeamName={userTeam?.team_name}
                opponentTeamName={opponentTeam?.team_name}
                firstWeekStart={firstWeekStart}
              />
            </TabsContent>
          </Tabs>
          
          <LiveUpdates updates={updates} />
            </>
          )}
        </div>
        
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

export default Matchup;
