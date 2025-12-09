import { supabase } from '@/integrations/supabase/client';
import { League, Team, LeagueService } from './LeagueService';
import { DraftService } from './DraftService';
import { PlayerService, Player } from './PlayerService';
import { MatchupPlayer } from '@/components/matchup/types';
import { getFirstWeekStartDate, getWeekStartDate, getWeekEndDate, getAvailableWeeks } from '@/utils/weekCalculator';
import { HockeyPlayer } from '@/components/roster/HockeyPlayerCard';
import { ScheduleService, NHLGame, GameInfo } from './ScheduleService';

// Roster cache for performance optimization
interface RosterCacheEntry {
  roster: HockeyPlayer[];
  timestamp: number;
}

const ROSTER_CACHE_TTL = 2 * 60 * 1000; // 2 minutes in milliseconds
const rosterCache = new Map<string, RosterCacheEntry>();

// Helper to generate cache key
const getRosterCacheKey = (teamId: string, leagueId: string): string => {
  return `${leagueId}:${teamId}`;
};

export interface Matchup {
  id: string;
  league_id: string;
  week_number: number;
  team1_id: string;
  team2_id: string | null;
  team1_score: number;
  team2_score: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  week_start_date: string;
  week_end_date: string;
  created_at: string;
  updated_at: string;
}

export const MatchupService = {
  /**
   * Generate round-robin matchups for all available weeks in a league
   */
  async generateMatchupsForLeague(
    leagueId: string,
    teams: Team[],
    firstWeekStart: Date
  ): Promise<{ error: any }> {
    try {
      // Get available weeks (excluding last 3 for playoffs)
      const currentYear = new Date().getFullYear();
      const availableWeeks = getAvailableWeeks(firstWeekStart, currentYear);

      if (teams.length < 2) {
        return { error: new Error('Need at least 2 teams to generate matchups') };
      }

      // Generate matchups for each week
      for (const weekNumber of availableWeeks) {
        const weekStart = getWeekStartDate(weekNumber, firstWeekStart);
        const weekEnd = getWeekEndDate(weekNumber, firstWeekStart);

        // Round-robin pairing: pair teams sequentially
        // For odd number of teams, one team gets a bye (team2_id = null)
        const teamPairs: Array<{ team1: Team; team2: Team | null }> = [];
        
        if (teams.length % 2 === 0) {
          // Even number of teams - pair them up
          for (let i = 0; i < teams.length; i += 2) {
            teamPairs.push({
              team1: teams[i],
              team2: teams[i + 1]
            });
          }
        } else {
          // Odd number of teams - last team gets a bye
          for (let i = 0; i < teams.length - 1; i += 2) {
            teamPairs.push({
              team1: teams[i],
              team2: teams[i + 1]
            });
          }
          // Last team gets a bye
          teamPairs.push({
            team1: teams[teams.length - 1],
            team2: null
          });
        }

        // Rotate teams each week for variety (simple rotation)
        // For week 1, use original order. For week 2+, rotate
        if (weekNumber > 1) {
          const rotation = (weekNumber - 1) % teams.length;
          const rotatedTeams = [...teams.slice(rotation), ...teams.slice(0, rotation)];
          
          // Re-pair rotated teams
          teamPairs.length = 0;
          if (rotatedTeams.length % 2 === 0) {
            for (let i = 0; i < rotatedTeams.length; i += 2) {
              teamPairs.push({
                team1: rotatedTeams[i],
                team2: rotatedTeams[i + 1]
              });
            }
          } else {
            for (let i = 0; i < rotatedTeams.length - 1; i += 2) {
              teamPairs.push({
                team1: rotatedTeams[i],
                team2: rotatedTeams[i + 1]
              });
            }
            teamPairs.push({
              team1: rotatedTeams[rotatedTeams.length - 1],
              team2: null
            });
          }
        }

        // Insert matchups for this week
        for (const pair of teamPairs) {
          // Check if matchup already exists
          const { data: existing } = await supabase
            .from('matchups')
            .select('id')
            .eq('league_id', leagueId)
            .eq('week_number', weekNumber)
            .eq('team1_id', pair.team1.id)
            .maybeSingle();

          if (!existing) {
            const { error } = await supabase
              .from('matchups')
              .insert({
                league_id: leagueId,
                week_number: weekNumber,
                team1_id: pair.team1.id,
                team2_id: pair.team2?.id || null,
                week_start_date: weekStart.toISOString().split('T')[0],
                week_end_date: weekEnd.toISOString().split('T')[0],
                status: 'scheduled'
              });

            if (error) {
              console.error(`Error creating matchup for week ${weekNumber}:`, error);
            }
          }
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error generating matchups:', error);
      return { error };
    }
  },

  /**
   * Get matchup for a specific week
   */
  async getMatchup(
    leagueId: string,
    weekNumber: number
  ): Promise<{ matchup: Matchup | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('matchups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('week_number', weekNumber)
        .maybeSingle();

      if (error) throw error;
      return { matchup: data || null, error: null };
    } catch (error) {
      return { matchup: null, error };
    }
  },

  /**
   * Get matchup where user's team is involved
   */
  async getUserMatchup(
    leagueId: string,
    userId: string,
    weekNumber: number
  ): Promise<{ matchup: Matchup | null; error: any }> {
    try {
      // First, get user's team
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)
        .eq('owner_id', userId)
        .maybeSingle();

      if (teamError) throw teamError;
      if (!userTeam) return { matchup: null, error: null };

      // Find matchup where user's team is team1 or team2
      const { data, error } = await supabase
        .from('matchups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('week_number', weekNumber)
        .or(`team1_id.eq.${userTeam.id},team2_id.eq.${userTeam.id}`)
        .maybeSingle();

      if (error) throw error;
      return { matchup: data || null, error: null };
    } catch (error) {
      return { matchup: null, error };
    }
  },

  /**
   * Clear roster cache (call this when rosters change)
   * @param teamId - Optional: clear cache for specific team, or all teams if not provided
   * @param leagueId - Optional: clear cache for specific league
   */
  clearRosterCache(teamId?: string, leagueId?: string): void {
    if (teamId && leagueId) {
      // Clear specific team's cache
      const key = getRosterCacheKey(teamId, leagueId);
      rosterCache.delete(key);
    } else if (leagueId) {
      // Clear all teams in a league
      const keysToDelete: string[] = [];
      rosterCache.forEach((_, key) => {
        if (key.startsWith(`${leagueId}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => rosterCache.delete(key));
    } else {
      // Clear all caches
      rosterCache.clear();
    }
  },

  /**
   * Get roster data for a team from draft picks (optimized with caching and direct queries)
   */
  async getTeamRoster(
    teamId: string,
    leagueId: string,
    allPlayers: Player[]
  ): Promise<HockeyPlayer[]> {
    try {
      // Check cache first
      const cacheKey = getRosterCacheKey(teamId, leagueId);
      const now = Date.now();
      const cached = rosterCache.get(cacheKey);
      
      if (cached && (now - cached.timestamp) < ROSTER_CACHE_TTL) {
        return cached.roster;
      }

      // Optimized: Query draft picks directly for this team (not all league picks)
      // This matches the efficient pattern used in Roster.tsx
      const { data: teamDraftPicks, error: picksError } = await supabase
        .from('draft_picks')
        .select('*')
        .eq('league_id', leagueId)
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('pick_number', { ascending: true });
      
      if (picksError) {
        console.error('Error fetching draft picks for team:', picksError);
        // Fallback to old method if direct query fails
        const { picks: draftPicks } = await DraftService.getDraftPicks(leagueId);
        const teamPicks = draftPicks.filter(p => p.team_id === teamId);
        const playerIds = teamPicks.map(p => p.player_id);
        const teamPlayers = allPlayers.filter(p => playerIds.includes(p.id));
        
        const roster = teamPlayers.map((p) => this.transformToHockeyPlayer(p));
        
        // Cache the result
        rosterCache.set(cacheKey, { roster, timestamp: now });
        return roster;
      }
      
      // Map draft picks to players
      const playerIds = (teamDraftPicks || []).map(p => p.player_id);
      const teamPlayers = allPlayers.filter(p => playerIds.includes(p.id));

      // Transform to HockeyPlayer format
      const roster = teamPlayers.map((p) => this.transformToHockeyPlayer(p));
      
      // Cache the result
      rosterCache.set(cacheKey, { roster, timestamp: now });
      
      return roster;
    } catch (error) {
      console.error('Error getting team roster:', error);
      return [];
    }
  },

  /**
   * Helper to transform Player to HockeyPlayer format
   */
  transformToHockeyPlayer(p: Player): HockeyPlayer {
    return {
      id: p.id,
      name: p.full_name,
      position: p.position,
      number: parseInt(p.jersey_number || '0'),
      starter: false, // Will be determined by lineup
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
      nextGame: { opponent: 'vs OPP', isToday: false },
      projectedPoints: (p.points || 0) / 20
    };
  },

  /**
   * Transform HockeyPlayer to MatchupPlayer format with pre-fetched schedule data (optimized)
   */
  transformToMatchupPlayerWithGames(
    player: HockeyPlayer,
    isStarter: boolean,
    weekStart: Date,
    weekEnd: Date,
    timezone: string = 'America/Denver',
    games: NHLGame[]
  ): MatchupPlayer {
    const teamAbbrev = player.teamAbbreviation || player.team || '';
    
    try {
      
      // Calculate games remaining (scheduled or live games from today onwards)
      // Test mode controlled via VITE_TEST_MODE environment variable (defaults to false)
      const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true';
      const TEST_DATE = import.meta.env.VITE_TEST_DATE || '2025-12-08';
      const getTodayString = () => TEST_MODE ? TEST_DATE : new Date().toISOString().split('T')[0];
      const getTodayDate = () => {
        if (TEST_MODE) {
          const date = new Date(TEST_DATE + 'T00:00:00');
          date.setHours(0, 0, 0, 0);
          return date;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      };
      
      const today = getTodayDate();
      const gamesRemaining = games.filter(g => {
        const gameDate = new Date(g.game_date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate >= today && (g.status === 'scheduled' || g.status === 'live');
      }).length;

      // Check if team has a game today
      const todayStr = getTodayString();
      const todayGames = games.filter(g => g.game_date === todayStr);
      const hasGameToday = todayGames.length > 0;
      
      // Determine status based on today's games
      // Only show status for games that are actually today (December 8, 2025)
      // Remove "Yet to Play" - it's redundant with the TODAY badge
      let gameStatus: 'In Game' | 'Final' | null = null;
      if (hasGameToday && todayGames.length > 0) {
        const todayGame = todayGames[0];
        if (todayGame.status === 'live') {
          gameStatus = 'In Game';
        } else if (todayGame.status === 'final') {
          gameStatus = 'Final';
        }
        // Don't set status for 'scheduled' - just show the game info
      }
      
      // ONLY show game info for games that are actually TODAY (December 8, 2025)
      // Don't show future games - only show today's games
      let gameInfo: GameInfo | undefined = undefined;
      
      // Only set gameInfo if there's a game TODAY
      if (hasGameToday && todayGames.length > 0) {
        const todayGame = todayGames[0];
        gameInfo = ScheduleService.getGameInfo(todayGame, teamAbbrev, timezone);
      }

      // Only mark as "today" if there's actually a game scheduled for today (December 8, 2025)
      // hasGameToday is already correctly set based on todayStr comparison
      
      return {
        id: typeof player.id === 'string' ? parseInt(player.id) || 0 : player.id || 0,
        name: player.name,
        position: player.position,
        team: teamAbbrev,
        points: 0, // Matchup points start at 0 (will be calculated from week's games when available)
        gamesRemaining,
        status: gameStatus, // Will be null for scheduled games, 'In Game' or 'Final' for active/completed
        isStarter,
        stats: {
          goals: player.stats.goals || 0,
          assists: player.stats.assists || 0,
          sog: player.stats.shots || 0,
          blk: player.stats.blockedShots || 0,
          gamesPlayed: player.stats.gamesPlayed || 0
        },
        isToday: hasGameToday, // Only true if game_date === todayStr (December 8, 2025)
        gameInfo // Only set if there's a game (today's game or next game in week)
      };
    } catch (error) {
      console.error(`Error transforming player ${player.name} to matchup player:`, error);
      // Return basic player info if schedule lookup fails
      return {
        id: typeof player.id === 'string' ? parseInt(player.id) || 0 : player.id || 0,
        name: player.name,
        position: player.position,
        team: teamAbbrev,
        points: 0, // Matchup points start at 0
        gamesRemaining: 0,
        status: null,
        isStarter,
        stats: {
          goals: player.stats.goals || 0,
          assists: player.stats.assists || 0,
          sog: player.stats.shots || 0,
          blk: player.stats.blockedShots || 0,
          gamesPlayed: player.stats.gamesPlayed || 0
        },
        isToday: false,
        gameInfo: undefined
      };
    }
  },

  /**
   * Transform HockeyPlayer to MatchupPlayer format with real schedule data
   * (Legacy method - now calls transformToMatchupPlayerWithGames after fetching games)
   */
  async transformToMatchupPlayer(
    player: HockeyPlayer,
    isStarter: boolean,
    weekStart: Date,
    weekEnd: Date,
    timezone: string = 'America/Denver'
  ): Promise<MatchupPlayer> {
    const teamAbbrev = player.teamAbbreviation || player.team || '';
    
    try {
      // Get games for this player's team in the matchup week
      const { games, error: gamesError } = await ScheduleService.getGamesForTeamInWeek(teamAbbrev, weekStart, weekEnd);
      
      if (gamesError) {
        console.warn(`Error fetching games for ${teamAbbrev}:`, gamesError);
      }
      
      return this.transformToMatchupPlayerWithGames(player, isStarter, weekStart, weekEnd, timezone, games || []);
    } catch (error) {
      console.error(`Error transforming player ${player.name} to matchup player:`, error);
      return this.transformToMatchupPlayerWithGames(player, isStarter, weekStart, weekEnd, timezone, []);
    }
  },

  /**
   * Get matchup rosters for both teams with real schedule data
   */
  async getMatchupRosters(
    matchup: Matchup,
    allPlayers: Player[],
    timezone: string = 'America/Denver'
  ): Promise<{ 
    team1Roster: MatchupPlayer[]; 
    team2Roster: MatchupPlayer[]; 
    team1SlotAssignments: Record<string, string>;
    team2SlotAssignments: Record<string, string>;
    error: any 
  }> {
    try {
      // Validate: Ensure team1_id !== team2_id (prevent duplicate teams)
      if (matchup.team2_id && matchup.team1_id === matchup.team2_id) {
        const error = new Error('Invalid matchup: team1 and team2 cannot be the same team');
        console.error('Matchup validation error:', error);
        return {
          team1Roster: [],
          team2Roster: [],
          team1SlotAssignments: {},
          team2SlotAssignments: {},
          error
        };
      }

      // Get week date range
      const weekStart = new Date(matchup.week_start_date);
      const weekEnd = new Date(matchup.week_end_date);

      // Parallelize: Get rosters and lineups for both teams simultaneously
      const [team1Roster, team2Roster, team1LineupResult, team2LineupResult] = await Promise.all([
        this.getTeamRoster(matchup.team1_id, matchup.league_id, allPlayers),
        matchup.team2_id
          ? this.getTeamRoster(matchup.team2_id, matchup.league_id, allPlayers)
          : Promise.resolve([]),
        LeagueService.getLineup(matchup.team1_id, matchup.league_id),
        matchup.team2_id
          ? LeagueService.getLineup(matchup.team2_id, matchup.league_id)
          : Promise.resolve(null)
      ]);

      let team1Lineup = team1LineupResult;
      let team2Lineup = team2LineupResult;

      // If lineup doesn't exist, try to initialize it first
      if (!team1Lineup || !team1Lineup.starters || team1Lineup.starters.length === 0) {
        console.warn(`Team ${matchup.team1_id} has no saved lineup. Attempting to initialize...`);
        const { lineup: initializedLineup, error: initError } = await LeagueService.initializeTeamLineup(
          matchup.team1_id,
          matchup.league_id,
          allPlayers
        );
        
        if (initError || !initializedLineup) {
          const error = new Error(`Team ${matchup.team1_id} has no lineup and initialization failed. Please ensure rosters are initialized after draft completion.`);
          console.error('Lineup initialization failed:', error);
          return {
            team1Roster: [],
            team2Roster: [],
            team1SlotAssignments: {},
            team2SlotAssignments: {},
            error
          };
        }
        
        team1Lineup = initializedLineup;
        console.log(`Successfully initialized lineup for team ${matchup.team1_id}`);
      }

      if (matchup.team2_id) {
        if (!team2Lineup || !team2Lineup.starters || team2Lineup.starters.length === 0) {
          console.warn(`Team ${matchup.team2_id} has no saved lineup. Attempting to initialize...`);
          const { lineup: initializedLineup, error: initError } = await LeagueService.initializeTeamLineup(
            matchup.team2_id,
            matchup.league_id,
            allPlayers
          );
          
          if (initError || !initializedLineup) {
            const error = new Error(`Team ${matchup.team2_id} has no lineup and initialization failed. Please ensure rosters are initialized after draft completion.`);
            console.error('Lineup initialization failed:', error);
            return {
              team1Roster: [],
              team2Roster: [],
              team1SlotAssignments: {},
              team2SlotAssignments: {},
              error
            };
          }
          
          team2Lineup = initializedLineup;
          console.log(`Successfully initialized lineup for team ${matchup.team2_id}`);
        }
      }

      // Use saved lineups (strict - no auto-assignment fallback)
      const team1Starters = new Set((team1Lineup.starters || []).map(id => String(id)));
      const team1SlotAssignments = team1Lineup.slotAssignments || {};
      
      const team2Starters = matchup.team2_id && team2Lineup
        ? new Set((team2Lineup.starters || []).map(id => String(id)))
        : new Set();
      const team2SlotAssignments = matchup.team2_id && team2Lineup
        ? (team2Lineup.slotAssignments || {})
        : {};

      // Batch schedule queries: Get all unique teams from both rosters
      const allTeams = Array.from(new Set([
        ...team1Roster.map(p => p.teamAbbreviation || p.team || ''),
        ...team2Roster.map(p => p.teamAbbreviation || p.team || '')
      ].filter(team => team !== '')));

      // Fetch all games for all teams in one batch query
      const { gamesByTeam } = await ScheduleService.getGamesForTeams(allTeams, weekStart, weekEnd);

      // Transform players with pre-fetched schedule data
      const team1MatchupPlayers = await Promise.all(
        team1Roster.map(p =>
          this.transformToMatchupPlayerWithGames(
            p,
            team1Starters.has(String(p.id)),
            weekStart,
            weekEnd,
            timezone,
            gamesByTeam.get(p.teamAbbreviation || p.team || '') || []
          )
        )
      );

      const team2MatchupPlayers = await Promise.all(
        team2Roster.map(p =>
          this.transformToMatchupPlayerWithGames(
            p,
            team2Starters.has(String(p.id)),
            weekStart,
            weekEnd,
            timezone,
            gamesByTeam.get(p.teamAbbreviation || p.team || '') || []
          )
        )
      );

      return {
        team1Roster: team1MatchupPlayers,
        team2Roster: team2MatchupPlayers,
        team1SlotAssignments,
        team2SlotAssignments,
        error: null
      };
    } catch (error) {
      console.error('Error getting matchup rosters:', error);
      return {
        team1Roster: [],
        team2Roster: [],
        team1SlotAssignments: {},
        team2SlotAssignments: {},
        error
      };
    }
  },

  /**
   * Calculate team score from roster (using season totals for now)
   */
  calculateTeamScore(roster: MatchupPlayer[]): number {
    return roster.reduce((sum, player) => sum + player.points, 0);
  },

  /**
   * Get team record (wins/losses) from completed matchups
   */
  async getTeamRecord(teamId: string, leagueId: string): Promise<{ wins: number; losses: number }> {
    try {
      const { data: matchups, error } = await supabase
        .from('matchups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('status', 'completed')
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`);

      if (error) throw error;

      let wins = 0;
      let losses = 0;

      (matchups || []).forEach(matchup => {
        const isTeam1 = matchup.team1_id === teamId;
        const myScore = isTeam1 ? matchup.team1_score : matchup.team2_score;
        const oppScore = isTeam1 ? matchup.team2_score : matchup.team1_score;

        if (myScore > oppScore) {
          wins++;
        } else if (oppScore > myScore) {
          losses++;
        }
        // Ties are not counted (or could be counted as 0.5 wins/losses)
      });

      return { wins, losses };
    } catch (error) {
      console.error('Error getting team record:', error);
      return { wins: 0, losses: 0 };
    }
  },

  /**
   * Get matchup history between two teams
   */
  async getMatchupHistory(
    leagueId: string,
    team1Id: string,
    team2Id: string | null
  ): Promise<{ 
    matchups: Array<{ 
      week: number; 
      team1Id: string; 
      team2Id: string | null; 
      team1Score: number; 
      team2Score: number; 
      weekStart: Date 
    }>; 
    error: any 
  }> {
    try {
      if (!team2Id) {
        return { matchups: [], error: null };
      }

      // Query for matchups where team1 is team1Id and team2 is team2Id, OR vice versa
      // Use two separate queries and combine results
      const { data: data1, error: error1 } = await supabase
        .from('matchups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('status', 'completed')
        .eq('team1_id', team1Id)
        .eq('team2_id', team2Id);

      if (error1) throw error1;

      const { data: data2, error: error2 } = await supabase
        .from('matchups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('status', 'completed')
        .eq('team1_id', team2Id)
        .eq('team2_id', team1Id);

      if (error2) throw error2;

      // Combine and deduplicate results
      const allMatchups = [...(data1 || []), ...(data2 || [])];
      const uniqueMatchups = allMatchups.filter((m, index, self) => 
        index === self.findIndex(t => t.id === m.id)
      );

      // Sort by week number descending
      const data = uniqueMatchups.sort((a, b) => b.week_number - a.week_number);
      const error = null;

      if (error) throw error;

      const matchups = (data || []).map(m => ({
        week: m.week_number,
        team1Id: m.team1_id,
        team2Id: m.team2_id,
        team1Score: parseFloat(m.team1_score) || 0,
        team2Score: parseFloat(m.team2_score) || 0,
        weekStart: new Date(m.week_start_date)
      }));

      return { matchups, error: null };
    } catch (error) {
      console.error('Error getting matchup history:', error);
      return { matchups: [], error };
    }
  }
};
