import { supabase } from '@/integrations/supabase/client';
import { League, Team, LeagueService } from './LeagueService';
import { DraftService } from './DraftService';
import { PlayerService, Player } from './PlayerService';
import { MatchupPlayer } from '@/components/matchup/types';
import { getFirstWeekStartDate, getWeekStartDate, getWeekEndDate, getAvailableWeeks, getScheduleLength } from '@/utils/weekCalculator';
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

export interface MatchupDataResponse {
  matchupId: string;
  matchup: Matchup; // Full matchup object
  currentWeek: number;
  scheduleLength: number; // Total regular season weeks
  isPlayoffWeek: boolean;
  userTeam: {
    id: string;
    name: string;
    roster: MatchupPlayer[];
    slotAssignments: Record<string, string>;
    record: { wins: number; losses: number };
    dailyPoints: number[];
  };
  opponentTeam: {
    id: string;
    name: string;
    roster: MatchupPlayer[];
    slotAssignments: Record<string, string>;
    record: { wins: number; losses: number };
    dailyPoints: number[];
  } | null; // null for bye weeks
  navigation: {
    previousWeek: number | null;
    nextWeek: number | null;
    previousMatchupId: string | null;
    nextMatchupId: string | null;
  };
}

export const MatchupService = {
  /**
   * Delete all matchups for a league (useful for regeneration)
   */
  async deleteAllMatchupsForLeague(leagueId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('matchups')
        .delete()
        .eq('league_id', leagueId);
      
      if (error) throw error;
      console.log(`[MatchupService] Deleted all matchups for league ${leagueId}`);
      return { error: null };
    } catch (error) {
      console.error('[MatchupService] Error deleting matchups:', error);
      return { error };
    }
  },

  /**
   * Generate round-robin matchups for all available weeks in a league
   */
  async generateMatchupsForLeague(
    leagueId: string,
    teams: Team[],
    firstWeekStart: Date,
    forceRegenerate: boolean = false
  ): Promise<{ error: any }> {
    try {
      // Get available weeks (includes all weeks through end of year, including playoffs)
      const currentYear = new Date().getFullYear();
      const availableWeeks = getAvailableWeeks(firstWeekStart, currentYear);
      console.log(`[MatchupService] Generating matchups for ${availableWeeks.length} weeks (weeks ${availableWeeks[0]} to ${availableWeeks[availableWeeks.length - 1]})`);

      if (teams.length < 2) {
        return { error: new Error('Need at least 2 teams to generate matchups') };
      }

      let matchupsCreated = 0;
      
      // Use proper round-robin tournament algorithm (circle method)
      // This ensures every team plays every other team exactly once
      const numTeams = teams.length;
      const numRounds = numTeams % 2 === 0 ? numTeams - 1 : numTeams; // For even teams, need n-1 rounds to play everyone
      
      // Shuffle teams to randomize schedule while maintaining fairness
      // This makes matchups less predictable while still ensuring every team plays every other team once
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      
      console.log(`[MatchupService] Generating world-class schedule for ${numTeams} teams over ${totalWeeks} weeks`);
      console.log(`[MatchupService] Base round-robin: ${numRounds} rounds (weeks 1-${numRounds})`);
      if (totalWeeks > numRounds) {
        const extraWeeks = totalWeeks - numRounds;
        console.log(`[MatchupService] Extended season: ${extraWeeks} additional weeks (weeks ${numRounds + 1}-${totalWeeks})`);
        console.log(`[MatchupService] Will enforce ±1 rule: each team plays some opponents once, others twice`);
      }
      console.log(`[MatchupService] Team mapping (shuffled for randomness):`, shuffledTeams.map((t, i) => ({ index: i, id: t.id, name: t.team_name || t.id })));
      
      // Track schedule state for constraint checking
      // schedule[weekNumber] = Map<teamId, opponentId>
      const schedule = new Map<number, Map<string, string>>();
      
      // Track opponent counts per team: opponentCounts[teamId][opponentId] = count
      const opponentCounts = new Map<string, Map<string, number>>();
      teams.forEach(team => {
        opponentCounts.set(team.id, new Map<string, number>());
      });
      
      // Track last matchup week for spacing optimization: lastMatchupWeek[teamId][opponentId] = weekNumber
      const lastMatchupWeek = new Map<string, Map<string, number>>();
      teams.forEach(team => {
        lastMatchupWeek.set(team.id, new Map<string, number>());
      });
      
      // If forceRegenerate is true, delete all existing matchups first
      if (forceRegenerate) {
        console.log('[MatchupService] Force regenerate requested, deleting all existing matchups...');
        await this.deleteAllMatchupsForLeague(leagueId);
      }
      
      // Check which weeks already have matchups to avoid regenerating
      // Only check a sample of weeks to speed up the query (check first, middle, and last weeks)
      const sampleWeeks = [
        availableWeeks[0],
        availableWeeks[Math.floor(availableWeeks.length / 2)],
        availableWeeks[availableWeeks.length - 1]
      ].filter(Boolean);
      
      const { data: existingMatchups } = await supabase
        .from('matchups')
        .select('week_number')
        .eq('league_id', leagueId)
        .in('week_number', sampleWeeks);
      
      const weeksWithMatchups = new Set(existingMatchups?.map(m => m.week_number) || []);
      
      // If sample weeks have matchups, assume most weeks do - only generate first numRounds weeks
      // If sample weeks don't have matchups, generate all weeks
      const shouldGenerateAll = weeksWithMatchups.size === 0;
      const weeksNeedingMatchups = shouldGenerateAll 
        ? availableWeeks.slice(0, numRounds) // Generate first cycle
        : availableWeeks.filter(w => !weeksWithMatchups.has(w)).slice(0, numRounds); // Only missing weeks in first cycle
      
      console.log(`[MatchupService] Sample check: ${weeksWithMatchups.size}/${sampleWeeks.length} sample weeks have matchups. Will generate ${weeksNeedingMatchups.length} weeks.`);
      
      // Verify that existing matchups cover all teams correctly
      // If the first numRounds weeks don't have matchups for all teams, we should regenerate
      let shouldRegenerate = false;
      if (weeksWithMatchups.size > 0 && !forceRegenerate) {
        const { data: firstRoundsMatchups } = await supabase
          .from('matchups')
          .select('week_number, team1_id, team2_id')
          .eq('league_id', leagueId)
          .in('week_number', availableWeeks.slice(0, Math.min(numRounds, availableWeeks.length)))
          .order('week_number', { ascending: true });
        
        if (firstRoundsMatchups && firstRoundsMatchups.length > 0) {
          // Check if all teams appear in matchups
          const teamsInMatchups = new Set<string>();
          firstRoundsMatchups.forEach(m => {
            if (m.team1_id) teamsInMatchups.add(m.team1_id);
            if (m.team2_id) teamsInMatchups.add(m.team2_id);
          });
          
          const allTeamIds = new Set(shuffledTeams.map(t => t.id));
          const missingTeams = Array.from(allTeamIds).filter(id => !teamsInMatchups.has(id));
          
          if (missingTeams.length > 0) {
            console.warn(`[MatchupService] Found ${missingTeams.length} teams missing from matchups:`, missingTeams);
            console.warn('[MatchupService] Regenerating matchups to fix schedule...');
            shouldRegenerate = true;
          } else {
            // Check if any team only faces the same opponent
            const teamOpponents = new Map<string, Set<string>>();
            shuffledTeams.forEach(t => teamOpponents.set(t.id, new Set()));
            
            firstRoundsMatchups.forEach(m => {
              if (m.team1_id && m.team2_id) {
                teamOpponents.get(m.team1_id)?.add(m.team2_id);
                teamOpponents.get(m.team2_id)?.add(m.team1_id);
              }
            });
            
            // Check if any team has fewer than numRounds-1 unique opponents (should be n-1 for n teams)
            let hasInsufficientOpponents = false;
            teamOpponents.forEach((opponents, teamId) => {
              if (opponents.size < numRounds - 1) {
                console.warn(`[MatchupService] Team ${teamId} only faces ${opponents.size} opponents (should be ${numRounds - 1})`);
                hasInsufficientOpponents = true;
              }
            });
            
            if (hasInsufficientOpponents) {
              console.warn('[MatchupService] Schedule appears incorrect, regenerating...');
              shouldRegenerate = true;
            }
          }
        }
      }
      
      if (shouldRegenerate) {
        console.log('[MatchupService] Deleting existing matchups to regenerate correct schedule...');
        await this.deleteAllMatchupsForLeague(leagueId);
        weeksWithMatchups.clear();
      }
      
      // Generate matchups only for weeks that need them
      // If forceRegenerate is true (e.g., existing league with no matchups), generate ALL available weeks
      // If regenerating due to incorrect schedule, generate first numRounds weeks (complete cycle)
      // Otherwise, only generate missing weeks (up to numRounds to complete cycle)
      const weeksToProcess = forceRegenerate
        ? availableWeeks // Generate ALL weeks for existing leagues that need it
        : shouldRegenerate
          ? availableWeeks.slice(0, numRounds) // Regenerate first cycle
          : weeksNeedingMatchups.length > 0
            ? weeksNeedingMatchups.slice(0, numRounds) // Only missing weeks, limit to first cycle
            : []; // Nothing to generate
      
      if (weeksToProcess.length === 0) {
        console.log('[MatchupService] No weeks need matchup generation - all matchups already exist');
        return { error: null };
      }
      
      const totalWeeks = weeksToProcess.length;
      console.log(`[MatchupService] Processing ${totalWeeks} weeks for matchup generation (weeks ${weeksToProcess[0]} to ${weeksToProcess[weeksToProcess.length - 1]})`);
      
      // Helper function to get valid opponents for a team in a given week
      const getValidOpponents = (
        teamId: string,
        weekNumber: number,
        allTeams: Team[]
      ): Team[] => {
        const valid: Team[] = [];
        const teamOpponentCounts = opponentCounts.get(teamId) || new Map();
        
        // Get last week's opponent (to avoid back-to-back)
        const lastWeekOpponent = weekNumber > 1 
          ? schedule.get(weekNumber - 1)?.get(teamId)
          : null;
        
        // Calculate target count for ±1 rule
        const gamesPerOpponent = Math.floor(totalWeeks / numRounds);
        const currentCounts = Array.from(teamOpponentCounts.values());
        const minCount = currentCounts.length > 0 
          ? Math.min(...currentCounts, gamesPerOpponent)
          : gamesPerOpponent;
        
        for (const opponent of allTeams) {
          if (opponent.id === teamId) continue; // Can't play yourself
          if (opponent.id === lastWeekOpponent) continue; // No back-to-back!
          
          const currentCount = teamOpponentCounts.get(opponent.id) || 0;
          // Prefer opponents with count <= minCount (maintain ±1 rule)
          if (currentCount <= minCount + 1) {
            valid.push(opponent);
          }
        }
        
        // If no valid opponents found (shouldn't happen), return all except self and last week
        if (valid.length === 0) {
          return allTeams.filter(t => t.id !== teamId && t.id !== lastWeekOpponent);
        }
        
        return valid;
      };
      
      // Helper function to find optimal opponent (maximizes spacing)
      const findOptimalOpponent = (
        teamId: string,
        validOpponents: Team[],
        weekNumber: number
      ): Team | null => {
        if (validOpponents.length === 0) return null;
        if (validOpponents.length === 1) return validOpponents[0];
        
        const teamLastMatchup = lastMatchupWeek.get(teamId) || new Map();
        const teamOpponentCounts = opponentCounts.get(teamId) || new Map();
        
        // Sort by: 1) spacing (maximize), 2) count (minimize for ±1 rule)
        const scored = validOpponents.map(opp => {
          const lastWeek = teamLastMatchup.get(opp.id) || 0;
          const spacing = lastWeek > 0 ? weekNumber - lastWeek : Infinity;
          const count = teamOpponentCounts.get(opp.id) || 0;
          return { opponent: opp, spacing, count };
        });
        
        // Sort: maximize spacing, then minimize count
        scored.sort((a, b) => {
          if (b.spacing !== a.spacing) return b.spacing - a.spacing;
          return a.count - b.count;
        });
        
        return scored[0].opponent;
      };
      
      // Generate matchups for each week using constraint-based algorithm
      for (const weekNumber of weeksToProcess) {
        const weekStart = getWeekStartDate(weekNumber, firstWeekStart);
        const weekEnd = getWeekEndDate(weekNumber, firstWeekStart);

        const teamPairs: Array<{ team1: Team; team2: Team | null }> = [];
        const weekSchedule = new Map<string, string>(); // Track this week's matchups
        
        // Weeks 1 to numRounds: Use base round-robin (circle method)
        if (weekNumber <= numRounds) {
          // Round-robin algorithm using circle method
          // Fix first team in place, rotate others around it
          const roundIndex = weekNumber - 1;
          console.log(`[MatchupService] Week ${weekNumber}: Base round-robin, roundIndex=${roundIndex}`);
          
          if (numTeams % 2 === 0) {
          // Even number of teams: Use circle method
          // Fix team 0, rotate teams 1..n-1 around it
          const fixedTeam = shuffledTeams[0];
          const rotatingTeams = shuffledTeams.slice(1); // Teams 1 through n-1
          
          // For the circle method, we rotate teams 1-9 clockwise
          // Round 0: no rotation
          // Round 1: rotate by 1
          // Round 2: rotate by 2
          // etc.
          const rotationOffset = roundIndex;
          const rotated = [
            ...rotatingTeams.slice(rotationOffset),
            ...rotatingTeams.slice(0, rotationOffset)
          ];
          
          console.log(`[MatchupService] Week ${weekNumber} rotation:`, {
            roundIndex,
            rotationOffset,
            fixedTeam: fixedTeam.team_name || fixedTeam.id,
            rotatingTeams: rotatingTeams.map(t => t.team_name || t.id),
            rotated: rotated.map(t => t.team_name || t.id)
          });
          
          // Pair fixed team with the last team in rotated array (opposite position)
          teamPairs.push({
            team1: fixedTeam,
            team2: rotated[rotated.length - 1]
          });
          
          // Pair remaining teams: first with last, second with second-to-last, etc.
          // For 9 rotating teams, we make 4 pairs (indices 0-3 paired with 7-4)
          const pairsToMake = Math.floor(rotated.length / 2);
          for (let i = 0; i < pairsToMake; i++) {
            const team1Index = i;
            const team2Index = rotated.length - 1 - i;
            teamPairs.push({
              team1: rotated[team1Index],
              team2: rotated[team2Index]
            });
          }
          
          console.log(`[MatchupService] Week ${weekNumber} generated pairs:`, teamPairs.map(p => ({
            team1: p.team1.team_name || p.team1.id,
            team2: p.team2?.team_name || p.team2?.id || 'BYE'
          })));
          
          // Store in schedule and update tracking
          teamPairs.forEach(pair => {
            if (pair.team2) {
              weekSchedule.set(pair.team1.id, pair.team2.id);
              weekSchedule.set(pair.team2.id, pair.team1.id);
              
              // Update opponent counts
              const team1Counts = opponentCounts.get(pair.team1.id)!;
              const team2Counts = opponentCounts.get(pair.team2.id)!;
              team1Counts.set(pair.team2.id, (team1Counts.get(pair.team2.id) || 0) + 1);
              team2Counts.set(pair.team1.id, (team2Counts.get(pair.team1.id) || 0) + 1);
              
              // Update last matchup week
              const team1Last = lastMatchupWeek.get(pair.team1.id)!;
              const team2Last = lastMatchupWeek.get(pair.team2.id)!;
              team1Last.set(pair.team2.id, weekNumber);
              team2Last.set(pair.team1.id, weekNumber);
            }
          });
          } else {
            // Odd number of teams: Add a "bye" (null team) - only for odd number of teams
            // Fix team 0, rotate teams 1..n-1, and include bye in rotation
            const fixedTeam = shuffledTeams[0];
            const rotatingTeams = shuffledTeams.slice(1); // Teams 1 through n-1
            
            // Rotate the rotating teams array
            const rotationOffset = roundIndex % numTeams;
            const rotated = [
              ...rotatingTeams.slice(rotationOffset),
              ...rotatingTeams.slice(0, rotationOffset)
            ];
            
            // Pair fixed team with last team (or bye)
            // When rotationOffset is 0, fixed team gets bye
            if (rotationOffset === 0) {
              // Fixed team gets bye this round
              teamPairs.push({
                team1: fixedTeam,
                team2: null
              });
            } else {
              teamPairs.push({
                team1: fixedTeam,
                team2: rotated[rotated.length - 1]
              });
            }
            
            // Pair remaining teams
            const pairsToMake = Math.floor(rotated.length / 2);
            for (let i = 0; i < pairsToMake; i++) {
              teamPairs.push({
                team1: rotated[i],
                team2: rotated[rotated.length - 1 - i]
              });
            }
            
            // Store in schedule and update tracking (skip bye weeks)
            teamPairs.forEach(pair => {
              if (pair.team2) {
                weekSchedule.set(pair.team1.id, pair.team2.id);
                weekSchedule.set(pair.team2.id, pair.team1.id);
                
                // Update opponent counts
                const team1Counts = opponentCounts.get(pair.team1.id)!;
                const team2Counts = opponentCounts.get(pair.team2.id)!;
                team1Counts.set(pair.team2.id, (team1Counts.get(pair.team2.id) || 0) + 1);
                team2Counts.set(pair.team1.id, (team2Counts.get(pair.team1.id) || 0) + 1);
                
                // Update last matchup week
                const team1Last = lastMatchupWeek.get(pair.team1.id)!;
                const team2Last = lastMatchupWeek.get(pair.team2.id)!;
                team1Last.set(pair.team2.id, weekNumber);
                team2Last.set(pair.team1.id, weekNumber);
              }
            });
          }
        
        // Store week schedule
        schedule.set(weekNumber, weekSchedule);
        
        // Weeks beyond numRounds: Use constraint-based scheduling
        } else {
          console.log(`[MatchupService] Week ${weekNumber}: Extended season - using constraint-based scheduling`);
          
          // Track which teams have been matched this week
          const matchedTeams = new Set<string>();
          
          // Process teams in random order to avoid bias
          const teamsToProcess = [...shuffledTeams].sort(() => Math.random() - 0.5);
          
          for (const team of teamsToProcess) {
            if (matchedTeams.has(team.id)) continue; // Already matched this week
            
            // Get valid opponents (no back-to-back, maintain ±1 rule)
            const validOpponents = getValidOpponents(team.id, weekNumber, shuffledTeams)
              .filter(opp => !matchedTeams.has(opp.id)); // Not already matched
            
            if (validOpponents.length === 0) {
              console.warn(`[MatchupService] Week ${weekNumber}: No valid opponents for ${team.team_name || team.id}`);
              continue;
            }
            
            // Find optimal opponent (maximizes spacing)
            const opponent = findOptimalOpponent(team.id, validOpponents, weekNumber);
            
            if (opponent) {
              teamPairs.push({
                team1: team,
                team2: opponent
              });
              
              matchedTeams.add(team.id);
              matchedTeams.add(opponent.id);
              
              // Update tracking
              weekSchedule.set(team.id, opponent.id);
              weekSchedule.set(opponent.id, team.id);
              
              // Update opponent counts
              const teamCounts = opponentCounts.get(team.id)!;
              const oppCounts = opponentCounts.get(opponent.id)!;
              teamCounts.set(opponent.id, (teamCounts.get(opponent.id) || 0) + 1);
              oppCounts.set(team.id, (oppCounts.get(team.id) || 0) + 1);
              
              // Update last matchup week
              const teamLast = lastMatchupWeek.get(team.id)!;
              const oppLast = lastMatchupWeek.get(opponent.id)!;
              teamLast.set(opponent.id, weekNumber);
              oppLast.set(team.id, weekNumber);
            }
          }
          
          // Store week schedule
          schedule.set(weekNumber, weekSchedule);
          
          console.log(`[MatchupService] Week ${weekNumber} extended pairs:`, teamPairs.map(p => ({
            team1: p.team1.team_name || p.team1.id,
            team2: p.team2?.team_name || p.team2?.id || 'BYE'
          })));
        }
        
        console.log(`[MatchupService] Week ${weekNumber} matchups:`, teamPairs.map(p => `${p.team1.team_name || p.team1.id} (${p.team1.id}) vs ${p.team2?.team_name || p.team2?.id || 'BYE'} (${p.team2?.id || 'null'})`).join(', '));
        console.log(`[MatchupService] Week ${weekNumber} matchup details:`, teamPairs.map(p => ({
          team1_id: p.team1.id,
          team1_name: p.team1.team_name || p.team1.id,
          team2_id: p.team2?.id || null,
          team2_name: p.team2?.team_name || p.team2?.id || 'BYE'
        })));

        // Insert matchups for this week
        for (const pair of teamPairs) {
          // Skip bye weeks (team2 is null) for even number of teams
          if (!pair.team2 && numTeams % 2 === 0) {
            console.warn(`[MatchupService] Skipping bye week for even number of teams in week ${weekNumber}`);
            continue;
          }
          
          // Check if matchup already exists (check both team1 and team2 to avoid duplicates)
          // Check if team1-team2 or team2-team1 matchup exists
          const { data: existing1 } = await supabase
            .from('matchups')
            .select('id')
            .eq('league_id', leagueId)
            .eq('week_number', weekNumber)
            .eq('team1_id', pair.team1.id)
            .eq('team2_id', pair.team2?.id || null)
            .maybeSingle();
          
          const { data: existing2 } = pair.team2 ? await supabase
            .from('matchups')
            .select('id')
            .eq('league_id', leagueId)
            .eq('week_number', weekNumber)
            .eq('team1_id', pair.team2.id)
            .eq('team2_id', pair.team1.id)
            .maybeSingle() : { data: null };
          
          const existing = existing1 || existing2;

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
              console.error(`Error creating matchup for week ${weekNumber} (${pair.team1.team_name || pair.team1.id} vs ${pair.team2?.team_name || pair.team2?.id || 'BYE'}):`, error);
            } else {
              matchupsCreated++;
            }
          } else {
            console.log(`[MatchupService] Matchup already exists for week ${weekNumber}: ${pair.team1.team_name || pair.team1.id} vs ${pair.team2?.team_name || pair.team2?.id || 'BYE'}`);
          }
        }
      }

      console.log(`[MatchupService] Generated ${matchupsCreated} new matchups across ${weeksToProcess.length} weeks`);
      
      // Verify world-class schedule constraints
      console.log('[MatchupService] Verifying world-class schedule constraints...');
      
      // Check for back-to-back matchups
      let backToBackViolations = 0;
      for (let i = 1; i < weeksToProcess.length; i++) {
        const prevWeek = weeksToProcess[i - 1];
        const currWeek = weeksToProcess[i];
        const prevSchedule = schedule.get(prevWeek);
        const currSchedule = schedule.get(currWeek);
        if (prevSchedule && currSchedule) {
          for (const [teamId, opponentId] of currSchedule.entries()) {
            const prevOpponent = prevSchedule.get(teamId);
            if (prevOpponent === opponentId) {
              backToBackViolations++;
              const team = teams.find(t => t.id === teamId);
              const opponent = teams.find(t => t.id === opponentId);
              console.warn(`[MatchupService] BACK-TO-BACK VIOLATION: ${team?.team_name || teamId} plays ${opponent?.team_name || opponentId} in weeks ${prevWeek} and ${currWeek}`);
            }
          }
        }
      }
      
      if (backToBackViolations > 0) {
        console.error(`[MatchupService] ❌ Found ${backToBackViolations} back-to-back matchup violations!`);
      } else {
        console.log('[MatchupService] ✓ No back-to-back matchups found - constraint satisfied');
      }
      
      // Verify ±1 rule
      let balanceViolations = 0;
      const balanceStats: Array<{ teamId: string; teamName: string; min: number; max: number; diff: number }> = [];
      
      for (const team of teams) {
        const counts = opponentCounts.get(team.id);
        if (counts) {
          const countValues = Array.from(counts.values());
          if (countValues.length > 0) {
            const min = Math.min(...countValues);
            const max = Math.max(...countValues);
            const diff = max - min;
            
            balanceStats.push({
              teamId: team.id,
              teamName: team.team_name || team.id,
              min,
              max,
              diff
            });
            
            if (diff > 1) {
              balanceViolations++;
              console.warn(`[MatchupService] ±1 RULE VIOLATION: ${team.team_name || team.id} has opponent counts ranging from ${min} to ${max} (diff: ${diff})`);
            }
          }
        }
      }
      
      if (balanceViolations > 0) {
        console.error(`[MatchupService] ❌ Found ${balanceViolations} teams violating ±1 rule!`);
      } else {
        console.log('[MatchupService] ✓ ±1 rule verified: All teams have balanced opponent counts (max difference: 1)');
      }
      
      // Log balance statistics
      console.log('[MatchupService] Balance Statistics:');
      balanceStats.forEach(stat => {
        console.log(`  ${stat.teamName}: min=${stat.min}, max=${stat.max}, diff=${stat.diff} ${stat.diff > 1 ? '❌' : '✓'}`);
      });
      
      if (backToBackViolations === 0 && balanceViolations === 0) {
        console.log('[MatchupService] ✅ World-class schedule constraints verified successfully!');
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
      console.log('[MatchupService.getUserMatchup] Querying for matchup:', {
        leagueId,
        userId,
        weekNumber,
        weekNumberType: typeof weekNumber
      });
      
      // First, get user's team
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('league_id', leagueId)
        .eq('owner_id', userId)
        .maybeSingle();

      if (teamError) throw teamError;
      if (!userTeam) {
        console.warn('[MatchupService.getUserMatchup] User team not found');
        return { matchup: null, error: null };
      }

      console.log('[MatchupService.getUserMatchup] User team ID:', userTeam.id);
      console.log('[MatchupService.getUserMatchup] Querying matchups table with:', {
        league_id: leagueId,
        week_number: weekNumber,
        week_number_type: typeof weekNumber,
        team_filter: `team1_id=${userTeam.id} OR team2_id=${userTeam.id}`
      });

      // Find matchup where user's team is team1 or team2
      // Use .limit(1) instead of .maybeSingle() to handle potential duplicates gracefully
      // Ensure week_number is treated as a number in the query
      const query = supabase
        .from('matchups')
        .select('*')
        .eq('league_id', leagueId)
        .eq('week_number', weekNumber)
        .or(`team1_id.eq.${userTeam.id},team2_id.eq.${userTeam.id}`)
        .limit(1);
      
      console.log('[MatchupService.getUserMatchup] Supabase query constructed, executing...');
      const { data: matchups, error } = await query;
      
      if (error) {
        console.error('[MatchupService.getUserMatchup] Database query error:', error);
        console.error('[MatchupService.getUserMatchup] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('[MatchupService.getUserMatchup] Query result:', {
        matchupsFound: matchups?.length || 0,
        matchups: matchups?.map(m => ({
          id: m.id,
          week_number: m.week_number,
          week_number_type: typeof m.week_number,
          team1_id: m.team1_id,
          team2_id: m.team2_id,
          league_id: m.league_id
        }))
      });
      
      // Additional verification: Check if week_number matches what we queried for
      if (matchups && matchups.length > 0) {
        const firstMatchup = matchups[0];
        if (firstMatchup.week_number !== weekNumber) {
          console.error('[MatchupService.getUserMatchup] WARNING: Week number mismatch!', {
            requested: weekNumber,
            received: firstMatchup.week_number,
            matchup_id: firstMatchup.id
          });
        } else {
          console.log('[MatchupService.getUserMatchup] Week number verification passed:', {
            requested: weekNumber,
            received: firstMatchup.week_number
          });
        }
      }
      
      // If multiple matchups found, log warning and use first one
      if (matchups && matchups.length > 1) {
        console.warn(`[MatchupService.getUserMatchup] Multiple matchups found for user team ${userTeam.id} in week ${weekNumber}. Using first one.`);
      }
      
      const data = matchups && matchups.length > 0 ? matchups[0] : null;

      if (data) {
        console.log('[MatchupService.getUserMatchup] Returning matchup:', {
          id: data.id,
          week_number: data.week_number,
          team1_id: data.team1_id,
          team2_id: data.team2_id,
          status: data.status
        });
      } else {
        console.warn('[MatchupService.getUserMatchup] No matchup found for week:', weekNumber);
      }
      
      return { matchup: data || null, error: null };
    } catch (error) {
      return { matchup: null, error };
    }
  },

  /**
   * Get unified matchup data with all necessary information for the matchup page
   * This is the primary API contract for matchup data
   */
  async getMatchupData(
    leagueId: string,
    userId: string,
    weekNumber: number,
    timezone: string = 'America/Denver'
  ): Promise<{ data: MatchupDataResponse | null; error: any }> {
    try {
      console.log('[MatchupService.getMatchupData] Received parameters:', {
        leagueId,
        userId,
        weekNumber,
        timezone
      });
      
      // Get league to determine first week start
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .maybeSingle();

      if (leagueError) throw leagueError;
      if (!league) {
        return { data: null, error: new Error('League not found') };
      }

      // Get first week start date
      const draftCompletionDate = league.updated_at ? new Date(league.updated_at) : new Date();
      const firstWeekStart = getFirstWeekStartDate(draftCompletionDate);
      const currentYear = new Date().getFullYear();
      const scheduleLength = getScheduleLength(firstWeekStart, currentYear);
      const isPlayoffWeek = weekNumber > scheduleLength;

      // Get user's team
      const { data: userTeam, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('league_id', leagueId)
        .eq('owner_id', userId)
        .maybeSingle();

      if (teamError) throw teamError;
      if (!userTeam) {
        return { data: null, error: new Error('User team not found') };
      }

      // Get matchup for this week
      console.log('[MatchupService.getMatchupData] Calling getUserMatchup with weekNumber:', weekNumber);
      const { matchup, error: matchupError } = await this.getUserMatchup(leagueId, userId, weekNumber);
      if (matchupError) throw matchupError;

      if (!matchup) {
        console.warn('[MatchupService.getMatchupData] No matchup found for week:', weekNumber);
        return { data: null, error: new Error(`No matchup found for week ${weekNumber}`) };
      }
      
      console.log('[MatchupService.getMatchupData] Found matchup:', {
        id: matchup.id,
        week_number: matchup.week_number,
        team1_id: matchup.team1_id,
        team2_id: matchup.team2_id
      });

      // Determine which team the user is (team1 or team2)
      const isTeam1 = matchup.team1_id === userTeam.id;
      const opponentTeamId = isTeam1 ? matchup.team2_id : matchup.team1_id;

      // Get opponent team object
      let opponentTeamObj: Team | null = null;
      if (opponentTeamId) {
        const { teams } = await LeagueService.getLeagueTeams(leagueId);
        opponentTeamObj = teams.find(t => t.id === opponentTeamId) || null;
      }

      // Optimized: Get roster player IDs first, then load only those players
      // This is much faster than loading all 1000+ players and filtering
      // Fallback to old method if optimized loading fails
      let rosterPlayers: Player[];
      try {
        const [team1PlayerIds, team2PlayerIds] = await Promise.all([
          this.getRosterPlayerIds(matchup.team1_id, matchup.league_id),
          matchup.team2_id 
            ? this.getRosterPlayerIds(matchup.team2_id, matchup.league_id)
            : Promise.resolve([])
        ]);
        
        // Combine and deduplicate player IDs
        const allRosterPlayerIds = [...new Set([...team1PlayerIds, ...team2PlayerIds])];
        
        if (allRosterPlayerIds.length === 0) {
          console.warn('[MatchupService] No roster player IDs found, falling back to loading all players');
          rosterPlayers = await PlayerService.getAllPlayers();
        } else {
          // Load only roster players (much faster than loading all players)
          rosterPlayers = await PlayerService.getPlayersByIds(allRosterPlayerIds);
          
          // If optimized loading returned fewer players than expected, fallback
          if (rosterPlayers.length < allRosterPlayerIds.length * 0.8) {
            console.warn('[MatchupService] Optimized loading returned fewer players than expected, falling back to loading all players');
            rosterPlayers = await PlayerService.getAllPlayers();
          }
        }
      } catch (error) {
        console.error('[MatchupService] Error in optimized roster loading, falling back to loading all players:', error);
        rosterPlayers = await PlayerService.getAllPlayers();
      }

      // Get rosters for both teams
      const {
        team1Roster,
        team2Roster,
        team1SlotAssignments,
        team2SlotAssignments,
        error: rostersError
      } = await this.getMatchupRosters(matchup, rosterPlayers, timezone);

      if (rostersError) {
        return { data: null, error: rostersError };
      }

      // Normalize slot assignments
      const normalizeSlotAssignments = (assignments: Record<string, string>): Record<string, string> => {
        const normalized: Record<string, string> = {};
        Object.entries(assignments).forEach(([playerId, slotId]) => {
          normalized[String(playerId)] = slotId;
        });
        return normalized;
      };

      // Assign rosters based on which team user is
      const userRoster = isTeam1 ? team1Roster : (team2Roster || []);
      const opponentRoster = isTeam1 ? (team2Roster || []) : team1Roster;
      const userSlotAssignments = normalizeSlotAssignments(isTeam1 ? team1SlotAssignments : team2SlotAssignments);
      const opponentSlotAssignments = normalizeSlotAssignments(isTeam1 ? team2SlotAssignments : team1SlotAssignments);

      // Get team records
      const userRecord = await this.getTeamRecord(userTeam.id, leagueId);
      const opponentRecord = opponentTeamObj ? await this.getTeamRecord(opponentTeamObj.id, leagueId) : { wins: 0, losses: 0 };

      // Calculate daily points
      const matchupStatus = matchup.status;
      const team1Score = parseFloat(String(matchup.team1_score)) || 0;
      const team2Score = parseFloat(String(matchup.team2_score)) || 0;
      const hasScores = team1Score > 0 || team2Score > 0;
      const shouldCalculatePoints = (matchupStatus === 'in_progress' || matchupStatus === 'completed') && hasScores;

      let userDailyPoints: number[] = [];
      let opponentDailyPoints: number[] = [];

      if (shouldCalculatePoints) {
        const userTotalPoints = isTeam1 ? team1Score : team2Score;
        const oppTotalPoints = isTeam1 ? team2Score : team1Score;
        
        // Simple distribution: divide by 7 days
        userDailyPoints = Array(7).fill(userTotalPoints / 7);
        opponentDailyPoints = Array(7).fill(oppTotalPoints / 7);
      }

      // Calculate navigation metadata
      const availableWeeks = getAvailableWeeks(firstWeekStart, currentYear);
      const currentWeekIndex = availableWeeks.indexOf(weekNumber);
      const previousWeek = currentWeekIndex > 0 ? availableWeeks[currentWeekIndex - 1] : null;
      const nextWeek = currentWeekIndex < availableWeeks.length - 1 ? availableWeeks[currentWeekIndex + 1] : null;

      // Get previous/next matchup IDs
      let previousMatchupId: string | null = null;
      let nextMatchupId: string | null = null;

      if (previousWeek) {
        const { matchup: prevMatchup } = await this.getUserMatchup(leagueId, userId, previousWeek);
        previousMatchupId = prevMatchup?.id || null;
      }

      if (nextWeek) {
        const { matchup: nextMatchup } = await this.getUserMatchup(leagueId, userId, nextWeek);
        nextMatchupId = nextMatchup?.id || null;
      }

      // Build response
      const response: MatchupDataResponse = {
        matchupId: matchup.id,
        matchup, // Include full matchup object
        currentWeek: weekNumber,
        scheduleLength,
        isPlayoffWeek,
        userTeam: {
          id: userTeam.id,
          name: userTeam.team_name,
          roster: userRoster,
          slotAssignments: userSlotAssignments,
          record: userRecord,
          dailyPoints: userDailyPoints
        },
        opponentTeam: opponentTeamObj ? {
          id: opponentTeamObj.id,
          name: opponentTeamObj.team_name,
          roster: opponentRoster,
          slotAssignments: opponentSlotAssignments,
          record: opponentRecord,
          dailyPoints: opponentDailyPoints
        } : null,
        navigation: {
          previousWeek,
          nextWeek,
          previousMatchupId,
          nextMatchupId
        }
      };

      return { data: response, error: null };
    } catch (error) {
      console.error('Error getting matchup data:', error);
      return { data: null, error };
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
   * Get roster player IDs for a team (optimized helper)
   */
  async getRosterPlayerIds(teamId: string, leagueId: string): Promise<string[]> {
    try {
      const { data: teamDraftPicks, error: picksError } = await supabase
        .from('draft_picks')
        .select('player_id')
        .eq('league_id', leagueId)
        .eq('team_id', teamId)
        .is('deleted_at', null);
      
      if (picksError) {
        console.error('Error fetching roster player IDs:', picksError);
        return [];
      }
      
      return (teamDraftPicks || []).map(p => p.player_id);
    } catch (error) {
      console.error('Error getting roster player IDs:', error);
      return [];
    }
  },

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
          gamesPlayed: player.stats.gamesPlayed || 0,
          xGoals: player.stats.xGoals || 0
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
          gamesPlayed: player.stats.gamesPlayed || 0,
          xGoals: player.stats.xGoals || 0
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
      // Note: Clear cache first to ensure we get fresh lineup data
      this.clearRosterCache(matchup.team1_id, matchup.league_id);
      if (matchup.team2_id) {
        this.clearRosterCache(matchup.team2_id, matchup.league_id);
      }
      
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
      
      // Helper function to organize roster into default lineup
      const getFantasyPosition = (position: string): 'C' | 'LW' | 'RW' | 'D' | 'G' | 'UTIL' => {
        const pos = position?.toUpperCase() || '';
        if (['C', 'CENTRE', 'CENTER'].includes(pos)) return 'C';
        if (['LW', 'LEFT WING', 'LEFTWING', 'L'].includes(pos)) return 'LW';
        if (['RW', 'RIGHT WING', 'RIGHTWING', 'R'].includes(pos)) return 'RW';
        if (['D', 'DEFENCE', 'DEFENSE'].includes(pos)) return 'D';
        if (pos.includes('D') && !pos.includes('DEFENSIVE') && pos !== 'FD' && !pos.includes('LD') && !pos.includes('RD')) return 'D';
        if (['G', 'GOALIE', 'GOALTENDER'].includes(pos)) return 'G';
        return 'UTIL';
      };

      const organizeRosterIntoLineup = (roster: HockeyPlayer[]) => {
        const slotsNeeded = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'G': 2, 'UTIL': 1 };
        const slotsFilled = { 'C': 0, 'LW': 0, 'RW': 0, 'D': 0, 'G': 0, 'UTIL': 0 };
        
        const starters: string[] = [];
        const bench: string[] = [];
        const ir: string[] = [];
        const slotAssignments: Record<string, string> = {};
        let irSlotIndex = 1;
        
        // Sort players by points (best players first)
        const sortedRoster = [...roster].sort((a, b) => (b.points || 0) - (a.points || 0));
        
        sortedRoster.forEach(p => {
          // Handle IR/SUSP players
          if (p.status === 'IR' || p.status === 'SUSP') {
            if (irSlotIndex <= 3) {
              ir.push(String(p.id));
              slotAssignments[String(p.id)] = `ir-slot-${irSlotIndex}`;
              irSlotIndex++;
            } else {
              bench.push(String(p.id));
            }
            return;
          }
          
          const pos = getFantasyPosition(p.position);
          let assigned = false;
          
          // Try to fill position-specific slot first
          if (pos !== 'UTIL' && slotsFilled[pos] < slotsNeeded[pos]) {
            slotsFilled[pos]++;
            assigned = true;
            slotAssignments[String(p.id)] = `slot-${pos}-${slotsFilled[pos]}`;
          } else if (pos !== 'G' && slotsFilled['UTIL'] < slotsNeeded['UTIL']) {
            // Fill UTIL slot if available
            slotsFilled['UTIL']++;
            assigned = true;
            slotAssignments[String(p.id)] = 'slot-UTIL';
          }
          
          if (assigned) {
            starters.push(String(p.id));
          } else {
            bench.push(String(p.id));
          }
        });
        
        return { starters, bench, ir, slotAssignments };
      };

      // Auto-initialize missing lineups for opponent teams
      // This ensures all teams have lineups for future week matchups
      if (!team1Lineup && team1Roster.length > 0) {
        console.log(`[MatchupService] Auto-initializing default lineup for Team1 (${matchup.team1_id})`);
        const defaultLineup = organizeRosterIntoLineup(team1Roster);
        team1Lineup = defaultLineup;
        // Save the default lineup to database
        await LeagueService.saveLineup(matchup.team1_id, matchup.league_id, defaultLineup);
        console.log(`[MatchupService] Saved default lineup for Team1: ${defaultLineup.starters.length} starters`);
      }

      if (matchup.team2_id && !team2Lineup && team2Roster.length > 0) {
        console.log(`[MatchupService] Auto-initializing default lineup for Team2 (${matchup.team2_id})`);
        const defaultLineup = organizeRosterIntoLineup(team2Roster);
        team2Lineup = defaultLineup;
        // Save the default lineup to database
        await LeagueService.saveLineup(matchup.team2_id, matchup.league_id, defaultLineup);
        console.log(`[MatchupService] Saved default lineup for Team2: ${defaultLineup.starters.length} starters`);
      }

      // Debug logging to help diagnose lineup sync issues
      if (team1Lineup) {
        console.log(`[MatchupService] Team1 lineup loaded: ${team1Lineup.starters.length} starters, ${team1Lineup.bench.length} bench, ${team1Lineup.ir.length} IR`);
        console.log(`[MatchupService] Team1 starter IDs:`, team1Lineup.starters);
      } else {
        const error = new Error(`Team ${matchup.team1_id} has no saved lineup and roster is empty.`);
        console.error('[MatchupService] No lineup found for team1:', error);
        return {
          team1Roster: [],
          team2Roster: [],
          team1SlotAssignments: {},
          team2SlotAssignments: {},
          error
        };
      }

      if (matchup.team2_id && !team2Lineup) {
        const error = new Error(`Opponent team ${matchup.team2_id} has no saved lineup and roster is empty.`);
        console.error('[MatchupService] No lineup found for team2:', error);
        return {
          team1Roster: [],
          team2Roster: [],
          team1SlotAssignments: {},
          team2SlotAssignments: {},
          error
        };
      }

      // Use saved lineups (strict - no auto-assignment fallback)
      const team1Starters = new Set((team1Lineup.starters || []).map(id => String(id)));
      
      // Normalize slot assignment keys to strings for consistency
      const rawTeam1SlotAssignments = team1Lineup.slotAssignments || {};
      const team1SlotAssignments: Record<string, string> = {};
      Object.entries(rawTeam1SlotAssignments).forEach(([playerId, slotId]) => {
        team1SlotAssignments[String(playerId)] = slotId;
      });
      
      const team2Starters = matchup.team2_id && team2Lineup
        ? new Set((team2Lineup.starters || []).map(id => String(id)))
        : new Set();
      
      const rawTeam2SlotAssignments = matchup.team2_id && team2Lineup
        ? (team2Lineup.slotAssignments || {})
        : {};
      const team2SlotAssignments: Record<string, string> = {};
      Object.entries(rawTeam2SlotAssignments).forEach(([playerId, slotId]) => {
        team2SlotAssignments[String(playerId)] = slotId;
      });

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
  },

  /**
   * Get playoff bracket data for a league
   */
  async getPlayoffBracket(leagueId: string): Promise<{
    rounds: Array<{
      roundNumber: number;
      roundName: string; // "Quarterfinals", "Semifinals", "Finals"
      matchups: Matchup[];
    }>;
    bracketSize: number; // 4, 6, or 8
    error: any;
  }> {
    try {
      // Get league to determine schedule length
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .maybeSingle();

      if (leagueError) throw leagueError;
      if (!league) {
        return { rounds: [], bracketSize: 0, error: new Error('League not found') };
      }

      // Get first week start date
      const draftCompletionDate = league.updated_at ? new Date(league.updated_at) : new Date();
      const firstWeekStart = getFirstWeekStartDate(draftCompletionDate);
      const currentYear = new Date().getFullYear();
      const scheduleLength = getScheduleLength(firstWeekStart, currentYear);

      // Get all teams to determine bracket size
      const { teams } = await LeagueService.getLeagueTeams(leagueId);
      const numTeams = teams.length;

      // Determine bracket size (typically top 4, 6, or 8 teams)
      let bracketSize = 0;
      if (numTeams >= 8) bracketSize = 8;
      else if (numTeams >= 6) bracketSize = 6;
      else if (numTeams >= 4) bracketSize = 4;

      if (bracketSize === 0) {
        return { rounds: [], bracketSize: 0, error: new Error('Not enough teams for playoffs') };
      }

      // Get all playoff matchups (weeks after scheduleLength)
      const { data: playoffMatchups, error: matchupsError } = await supabase
        .from('matchups')
        .select('*')
        .eq('league_id', leagueId)
        .gt('week_number', scheduleLength)
        .order('week_number', { ascending: true })
        .order('created_at', { ascending: true });

      if (matchupsError) throw matchupsError;

      // Organize matchups by round
      // Round 1 (Quarterfinals): First playoff week
      // Round 2 (Semifinals): Second playoff week (if bracket size >= 6)
      // Round 3 (Finals): Last playoff week
      const rounds: Array<{
        roundNumber: number;
        roundName: string;
        matchups: Matchup[];
      }> = [];

      if (!playoffMatchups || playoffMatchups.length === 0) {
        return { rounds: [], bracketSize, error: null };
      }

      // Group matchups by week number
      const matchupsByWeek = new Map<number, Matchup[]>();
      playoffMatchups.forEach((matchup: Matchup) => {
        const week = matchup.week_number;
        if (!matchupsByWeek.has(week)) {
          matchupsByWeek.set(week, []);
        }
        matchupsByWeek.get(week)!.push(matchup);
      });

      const playoffWeeks = Array.from(matchupsByWeek.keys()).sort((a, b) => a - b);

      // Determine round names based on bracket size
      let roundNumber = 1;
      for (const week of playoffWeeks) {
        let roundName = '';
        if (bracketSize === 8) {
          if (roundNumber === 1) roundName = 'Quarterfinals';
          else if (roundNumber === 2) roundName = 'Semifinals';
          else if (roundNumber === 3) roundName = 'Finals';
        } else if (bracketSize === 6) {
          if (roundNumber === 1) roundName = 'Quarterfinals';
          else if (roundNumber === 2) roundName = 'Semifinals';
          else if (roundNumber === 3) roundName = 'Finals';
        } else if (bracketSize === 4) {
          if (roundNumber === 1) roundName = 'Semifinals';
          else if (roundNumber === 2) roundName = 'Finals';
        }

        if (roundName) {
          rounds.push({
            roundNumber,
            roundName,
            matchups: matchupsByWeek.get(week) || []
          });
          roundNumber++;
        }
      }

      return { rounds, bracketSize, error: null };
    } catch (error) {
      console.error('Error getting playoff bracket:', error);
      return { rounds: [], bracketSize: 0, error };
    }
  }
};
