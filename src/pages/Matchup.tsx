import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
  const { user } = useAuth();
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

  // Demo data - shown to non-logged-in users (keep as is)
  const [demoMyTeam] = useState<MatchupPlayer[]>(user ? [] : [
    { id: 1, name: "Connor McDavid", position: "C", team: "EDM", points: 32.5, gamesRemaining: 2, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 2, sog: 4, blk: 0, gamesPlayed: 32 }, gameInfo: { opponent: "vs CGY", score: "EDM 4-2", period: "3rd 12:45" } },
    { id: 2, name: "Leon Draisaitl", position: "C", team: "EDM", points: 28.2, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 0, assists: 1, sog: 2, blk: 0, gamesPlayed: 32 }, gameInfo: { opponent: "vs CGY", score: "EDM 4-2", period: "3rd 12:45" } },
    { id: 3, name: "Auston Matthews", position: "C", team: "TOR", points: 25.7, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 2, assists: 0, sog: 6, blk: 1, gamesPlayed: 30 } },
    { id: 4, name: "Nathan MacKinnon", position: "C", team: "COL", points: 22.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 3, sog: 5, blk: 0, gamesPlayed: 31 } },
    { id: 5, name: "David Pastrnak", position: "RW", team: "BOS", points: 21.4, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 1, sog: 3, blk: 0, gamesPlayed: 33 }, gameInfo: { opponent: "@ FLA", score: "BOS 2-1", period: "2nd 4:20" } },
    { id: 6, name: "Mikko Rantanen", position: "RW", team: "COL", points: 18.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 2, sog: 2, blk: 1, gamesPlayed: 31 } },
    { id: 7, name: "Kirill Kaprizov", position: "LW", team: "MIN", points: 17.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 4, blk: 0, gamesPlayed: 29 } },
    { id: 8, name: "Alex Ovechkin", position: "LW", team: "WSH", points: 16.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 5, blk: 1, gamesPlayed: 28 } },
    { id: 9, name: "Cale Makar", position: "D", team: "COL", points: 15.7, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 2, sog: 2, blk: 2, gamesPlayed: 31 } },
    { id: 10, name: "Adam Fox", position: "D", team: "NYR", points: 13.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 30 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
    { id: 11, name: "Roman Josi", position: "D", team: "NSH", points: 11.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 3, blk: 2, gamesPlayed: 32 } },
    { id: 12, name: "Victor Hedman", position: "D", team: "TBL", points: 10.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 1, gamesPlayed: 33 } },
    { id: 13, name: "Andrei Vasilevskiy", position: "G", team: "TBL", points: 24.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 25 } },
    { id: 14, name: "Igor Shesterkin", position: "G", team: "NYR", points: 23.2, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 24 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
    { id: 15, name: "Matt Duchene", position: "C", team: "DAL", points: 8.5, gamesRemaining: 2, status: "Yet to Play", isStarter: false, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 29 }, gameInfo: { opponent: "@ STL", time: "8:00 PM" } },
    { id: 16, name: "Mitch Marner", position: "RW", team: "TOR", points: 14.8, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 2, sog: 3, blk: 1, gamesPlayed: 30 } },
    { id: 17, name: "Brady Tkachuk", position: "LW", team: "OTT", points: 12.3, gamesRemaining: 1, status: "Yet to Play", isStarter: false, isToday: false, stats: { goals: 1, assists: 0, sog: 5, blk: 4, gamesPlayed: 28 } },
    { id: 18, name: "Quinn Hughes", position: "D", team: "VAN", points: 9.7, gamesRemaining: 2, status: "Yet to Play", isStarter: false, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 0, gamesPlayed: 31 } },
    { id: 19, name: "Jacob Markstrom", position: "G", team: "CGY", points: 18.5, gamesRemaining: 0, status: "Final", isStarter: false, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0, gamesPlayed: 22 } },
  ]);

  const [demoOpponentTeam] = useState<MatchupPlayer[]>(user ? [] : [
    { id: 101, name: "Sidney Crosby", position: "C", team: "PIT", points: 29.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs PHI", time: "7:30 PM" } },
    { id: 102, name: "Nikita Kucherov", position: "RW", team: "TBL", points: 27.9, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 1, assists: 2, sog: 4, blk: 0 } },
    { id: 103, name: "Artemi Panarin", position: "LW", team: "NYR", points: 26.2, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "vs NJD", time: "7:00 PM" } },
    { id: 104, name: "Brad Marchand", position: "LW", team: "BOS", points: 22.1, gamesRemaining: 1, status: "In Game", isStarter: true, isToday: true, stats: { goals: 0, assists: 1, sog: 2, blk: 1 }, gameInfo: { opponent: "@ FLA", score: "BOS 2-1", period: "2nd 4:20" } },
    { id: 105, name: "Elias Pettersson", position: "C", team: "VAN", points: 20.8, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 1, assists: 1, sog: 3, blk: 1 } },
    { id: 106, name: "Jack Hughes", position: "C", team: "NJD", points: 19.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 1, sog: 5, blk: 0 } },
    { id: 107, name: "William Nylander", position: "RW", team: "TOR", points: 18.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 1, assists: 0, sog: 4, blk: 0 } },
    { id: 108, name: "Matthew Tkachuk", position: "RW", team: "FLA", points: 17.8, gamesRemaining: 2, status: "In Game", isStarter: true, isToday: true, stats: { goals: 1, assists: 0, sog: 3, blk: 2 }, gameInfo: { opponent: "vs BOS", score: "BOS 2-1", period: "2nd 4:20" } },
    { id: 109, name: "Brent Burns", position: "D", team: "CAR", points: 13.2, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 3, blk: 2 } },
    { id: 110, name: "Dougie Hamilton", position: "D", team: "NJD", points: 12.5, gamesRemaining: 0, status: "Final", isStarter: true, isToday: false, stats: { goals: 0, assists: 1, sog: 2, blk: 3 } },
    { id: 111, name: "Shea Theodore", position: "D", team: "VGK", points: 11.8, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "@ LAK", time: "10:00 PM" } },
    { id: 112, name: "Moritz Seider", position: "D", team: "DET", points: 9.9, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 1, blk: 4 } },
    { id: 113, name: "Connor Hellebuyck", position: "G", team: "WPG", points: 26.3, gamesRemaining: 2, status: "Yet to Play", isStarter: true, isToday: false, stats: { goals: 0, assists: 0, sog: 0, blk: 0 } },
    { id: 114, name: "Ilya Sorokin", position: "G", team: "NYI", points: 22.7, gamesRemaining: 1, status: "Yet to Play", isStarter: true, isToday: true, stats: { goals: 0, assists: 0, sog: 0, blk: 0 }, gameInfo: { opponent: "@ WAS", time: "7:00 PM" } },
  ]);

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

  // Use real data if logged in, otherwise demo data
  // CRITICAL: Ensure myTeam is always the user's team (left side)
  // and opponentTeamPlayers is always the opponent (right side)
  const displayMyTeam = user ? myTeam : demoMyTeam;
  const displayOpponentTeam = user ? opponentTeamPlayers : demoOpponentTeam;

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

  // Load real matchup data for logged-in users
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadMatchupData = async () => {
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
      const { 
        team1Roster, 
        team2Roster, 
        team1SlotAssignments, 
        team2SlotAssignments, 
        error: rostersError 
      } = await MatchupService.getMatchupRosters(matchup, allPlayers);
      
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
    await loadMatchupForWeek(league.id, user.id, weekNumber, firstWeekStart, userTeam);
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
               ) : user && firstWeekStart ? (
                 <p className="text-muted-foreground text-lg">
                   {getWeekLabel(selectedWeek, firstWeekStart)} • {userTeam?.team_name || 'My Team'} vs {opponentTeam?.team_name || 'Bye Week'}
                 </p>
               ) : (
                 <p className="text-muted-foreground text-lg">Week 12 • Citrus Crushers vs Thunder Titans</p>
               )}
             </div>
             {user && availableWeeks.length > 0 && (
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
             {!user && (
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
            </div>
          )}
          
          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-destructive text-lg">{error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <>
          
          <ScoreCard
            myTeamName={user ? (userTeam?.team_name || 'My Team') : 'Citrus Crushers'}
            myTeamRecord={user ? myTeamRecord : { wins: 7, losses: 3 }}
            opponentTeamName={user ? (opponentTeam?.team_name || 'Bye Week') : 'Thunder Titans'}
            opponentTeamRecord={user ? opponentTeamRecord : { wins: 9, losses: 1 }}
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
                  <TeamCard
                    title={user ? (userTeam?.team_name || 'My Team') : 'Citrus Crushers'}
                    starters={myStarters}
                    bench={myBench}
                    slotAssignments={myTeamSlotAssignments}
                    gradientClass="border-t-4 border-fantasy-secondary"
                    onPlayerClick={handlePlayerClick}
                  />
                </div>
                {/* Opponent Team - Always on the RIGHT - Second in DOM order */}
                <div className="order-2 lg:order-2">
                  <TeamCard
                    title={user ? (opponentTeam?.team_name || 'Bye Week') : 'Thunder Titans'}
                    starters={opponentStarters}
                    bench={opponentBench}
                    slotAssignments={opponentTeamSlotAssignments}
                    gradientClass="border-t-4 border-fantasy-primary"
                    onPlayerClick={handlePlayerClick}
                  />
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
