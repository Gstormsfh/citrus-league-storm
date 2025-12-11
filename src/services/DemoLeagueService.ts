/**
 * DemoLeagueService - Creates and manages the read-only demo league
 * 
 * DEMO LEAGUE PILLARS:
 * 1. Complete Isolation - No owner_id, excluded from user queries
 * 2. Fully Read-Only - All write operations blocked
 * 3. Shared Experience - Same league for all guests
 * 4. Static Data - Matchups pre-populated, never updated
 */

import { supabase } from '@/integrations/supabase/client';
import { LeagueService, LEAGUE_TEAMS_DATA } from './LeagueService';
import { PlayerService, Player } from './PlayerService';
import { DraftService } from './DraftService';
import { MatchupService } from './MatchupService';

export const DEMO_LEAGUE_ID = '00000000-0000-0000-0000-000000000001';

export const DemoLeagueService = {
  /**
   * Force reinitialize demo league (useful for debugging)
   * This will delete existing draft picks and recreate everything
   */
  async forceReinitialize(): Promise<{ success: boolean; error: any }> {
    try {
      console.log('[DemoLeagueService] FORCE REINITIALIZING demo league...');
      
      // Delete existing draft picks
      const { error: deletePicksError } = await supabase
        .from('draft_picks')
        .delete()
        .eq('league_id', DEMO_LEAGUE_ID);
      
      if (deletePicksError) {
        console.warn('[DemoLeagueService] Error deleting draft picks:', deletePicksError);
      }
      
      // Delete existing lineups
      const { error: deleteLineupsError } = await supabase
        .from('team_lineups')
        .delete()
        .eq('league_id', DEMO_LEAGUE_ID);
      
      if (deleteLineupsError) {
        console.warn('[DemoLeagueService] Error deleting lineups:', deleteLineupsError);
      }
      
      // Delete existing teams
      const { error: deleteTeamsError } = await supabase
        .from('teams')
        .delete()
        .eq('league_id', DEMO_LEAGUE_ID);
      
      if (deleteTeamsError) {
        console.warn('[DemoLeagueService] Error deleting teams:', deleteTeamsError);
      }
      
      // Delete league
      const { error: deleteLeagueError } = await supabase
        .from('leagues')
        .delete()
        .eq('id', DEMO_LEAGUE_ID);
      
      if (deleteLeagueError) {
        console.warn('[DemoLeagueService] Error deleting league:', deleteLeagueError);
      }
      
      console.log('[DemoLeagueService] Deleted existing demo league, now reinitializing...');
      
      // Reinitialize
      return await this.initializeDemoLeague();
    } catch (error) {
      console.error('[DemoLeagueService] Error in forceReinitialize:', error);
      return { success: false, error };
    }
  },

  /**
   * Check if demo league exists in database
   */
  async demoLeagueExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('id')
        .eq('id', DEMO_LEAGUE_ID)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[DemoLeagueService] Error checking demo league:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('[DemoLeagueService] Error checking demo league:', error);
      return false;
    }
  },

  /**
   * Initialize demo league (idempotent - safe to call multiple times)
   */
  async initializeDemoLeague(): Promise<{ success: boolean; error: any }> {
    try {
      // Check if demo league already exists
      const exists = await this.demoLeagueExists();
      
      // Check if rosters are populated (check for draft picks)
      let rostersPopulated = false;
      if (exists) {
        const { count: draftPicksCount } = await supabase
          .from('draft_picks')
          .select('*', { count: 'exact', head: true })
          .eq('league_id', DEMO_LEAGUE_ID)
          .is('deleted_at', null);
        
        rostersPopulated = (draftPicksCount || 0) > 0;
      }
      
      if (exists && rostersPopulated) {
        console.log('[DemoLeagueService] Demo league already exists with rosters, skipping initialization');
        return { success: true, error: null };
      }

      let teams = [];
      
      if (!exists) {
        console.log('[DemoLeagueService] Creating demo league...');

        // 1. Create the league
        const { data: league, error: leagueError } = await supabase
          .from('leagues')
          .insert({
            id: DEMO_LEAGUE_ID,
            name: 'Demo League',
            commissioner_id: null, // No owner - system league
            roster_size: 21,
            draft_rounds: 21,
            draft_status: 'completed',
            settings: {},
          })
          .select()
          .single();

        if (leagueError) {
          console.error('[DemoLeagueService] Error creating league:', leagueError);
          return { success: false, error: leagueError };
        }

        console.log('[DemoLeagueService] League created:', league.id);

        // 2. Create 10 teams (no owner_id - completely isolated)
        for (const teamData of LEAGUE_TEAMS_DATA) {
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({
              id: `${DEMO_LEAGUE_ID}-team-${teamData.id}`,
              league_id: DEMO_LEAGUE_ID,
              owner_id: null, // No user ownership - pillar of isolation
              team_name: teamData.name,
            })
            .select()
            .single();

          if (teamError) {
            console.error(`[DemoLeagueService] Error creating team ${teamData.name}:`, teamError);
            continue;
          }

          teams.push(team);
        }

        console.log(`[DemoLeagueService] Created ${teams.length} teams`);
      } else {
        // League exists but rosters not populated - get existing teams
        console.log('[DemoLeagueService] Demo league exists but rosters not populated, getting existing teams...');
        const { data: existingTeams } = await supabase
          .from('teams')
          .select('*')
          .eq('league_id', DEMO_LEAGUE_ID);
        teams = existingTeams || [];
        console.log(`[DemoLeagueService] Found ${teams.length} existing teams`);
      }
      
      if (teams.length === 0) {
        console.error('[DemoLeagueService] No teams available for roster population');
        return { success: false, error: new Error('No teams available') };
      }

      // 3. Populate rosters via draft simulation
      const allPlayers = await PlayerService.getAllPlayers();
      await this.populateDemoRosters(DEMO_LEAGUE_ID, teams, allPlayers);

      // 4. Initialize default lineups for all teams
      await this.initializeDemoLineups(DEMO_LEAGUE_ID, teams, allPlayers);

      // 5. Create static matchups
      await this.createDemoMatchups(DEMO_LEAGUE_ID, teams);

      console.log('[DemoLeagueService] Demo league initialization complete');
      return { success: true, error: null };
    } catch (error) {
      console.error('[DemoLeagueService] Error initializing demo league:', error);
      return { success: false, error };
    }
  },

  /**
   * Populate rosters via draft simulation - directly insert draft picks
   */
  async populateDemoRosters(
    leagueId: string,
    teams: any[],
    allPlayers: Player[]
  ): Promise<void> {
    try {
      console.log('[DemoLeagueService] Populating rosters via draft simulation...');

      // Sort players by points (best first)
      const sortedPlayers = [...allPlayers].sort((a, b) => (b.points || 0) - (a.points || 0));

      // Create draft session ID
      const sessionId = crypto.randomUUID();

      // Initialize draft order (serpentine) - create draft_order entries
      const draftOrderEntries = [];
      for (let round = 1; round <= 21; round++) {
        const isForward = round % 2 === 1;
        const teamOrder = isForward ? teams : [...teams].reverse();
        const teamIds = teamOrder.map(t => t.id);
        
        draftOrderEntries.push({
          league_id: leagueId,
          round_number: round,
          team_order: teamIds,
          draft_session_id: sessionId,
        });
      }

      // Insert draft order
      const { error: orderError } = await supabase
        .from('draft_order')
        .insert(draftOrderEntries);

      if (orderError) {
        console.warn('[DemoLeagueService] Error creating draft order:', orderError);
      }

      // Directly insert draft picks (bypass DraftService to avoid guards)
      const draftPicks = [];
      let playerIndex = 0;
      const usedPlayerIds = new Set<string>(); // Track used players to avoid duplicates

      // Simulate draft: 10 teams * 21 rounds = 210 picks
      for (let round = 1; round <= 21; round++) {
        const isForward = round % 2 === 1;
        const teamOrder = isForward ? teams : [...teams].reverse();

        for (let pickInRound = 0; pickInRound < teamOrder.length; pickInRound++) {
          const team = teamOrder[pickInRound];
          const pickNumber = (round - 1) * teams.length + pickInRound + 1;

          // Get next available player (skip if already used)
          while (playerIndex < sortedPlayers.length) {
            const player = sortedPlayers[playerIndex];
            playerIndex++;
            
            // Skip if player already used
            if (usedPlayerIds.has(player.id)) {
              continue;
            }
            
            usedPlayerIds.add(player.id);

            draftPicks.push({
              league_id: leagueId,
              team_id: team.id,
              player_id: player.id,
              round_number: round,
              pick_number: pickNumber,
              draft_session_id: sessionId,
              picked_at: new Date().toISOString(),
            });
            break;
          }
        }
      }
      
      console.log(`[DemoLeagueService] Generated ${draftPicks.length} draft picks for ${teams.length} teams`);
      
      if (draftPicks.length === 0) {
        throw new Error('No draft picks generated! Check that teams and players are available.');
      }

      // Batch insert all draft picks (in chunks to avoid size limits)
      console.log(`[DemoLeagueService] Inserting ${draftPicks.length} draft picks in chunks...`);
      
      // Insert in chunks of 50 to avoid potential size limits
      const chunkSize = 50;
      let totalInserted = 0;
      for (let i = 0; i < draftPicks.length; i += chunkSize) {
        const chunk = draftPicks.slice(i, i + chunkSize);
        const { data: insertedData, error: picksError } = await supabase
          .from('draft_picks')
          .insert(chunk)
          .select('id');

        if (picksError) {
          console.error(`[DemoLeagueService] Error inserting draft picks chunk ${i + 1}-${i + chunk.length}:`, picksError);
          console.error('[DemoLeagueService] Sample chunk data:', chunk.slice(0, 2));
          throw picksError;
        }
        totalInserted += insertedData?.length || 0;
        console.log(`[DemoLeagueService] Inserted chunk ${Math.floor(i / chunkSize) + 1}: ${insertedData?.length || 0} picks (${totalInserted}/${draftPicks.length} total)`);
      }

      console.log(`[DemoLeagueService] Successfully inserted ${totalInserted} draft picks`);
      
      // Verify insertion
      const { count: verifyCount, error: verifyError } = await supabase
        .from('draft_picks')
        .select('*', { count: 'exact', head: true })
        .eq('league_id', leagueId)
        .is('deleted_at', null);
      
      if (verifyError) {
        console.error('[DemoLeagueService] Error verifying picks:', verifyError);
      } else {
        console.log(`[DemoLeagueService] Verified: ${verifyCount} total draft picks in database`);
        
        // Check picks for first team
        if (teams.length > 0) {
          const { count: teamPicksCount } = await supabase
            .from('draft_picks')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', leagueId)
            .eq('team_id', teams[0].id)
            .is('deleted_at', null);
          console.log(`[DemoLeagueService] Team ${teams[0].team_name} has ${teamPicksCount} picks`);
        }
      }
    } catch (error) {
      console.error('[DemoLeagueService] Error populating rosters:', error);
      throw error;
    }
  },

  /**
   * Initialize default lineups for all demo teams
   */
  async initializeDemoLineups(
    leagueId: string,
    teams: any[],
    allPlayers: Player[]
  ): Promise<void> {
    try {
      console.log('[DemoLeagueService] Initializing default lineups...');

      for (const team of teams) {
        // Get team roster using MatchupService (uses draft picks from database)
        const roster = await MatchupService.getTeamRoster(team.id, leagueId, allPlayers);
        
        // Convert HockeyPlayer[] to Player[] for lineup logic
        const playerRoster: Player[] = roster.map(hp => {
          const player = allPlayers.find(p => p.id === hp.id);
          if (!player) {
            // Create minimal Player object from HockeyPlayer
            return {
              id: hp.id,
              full_name: hp.name,
              position: hp.position,
              team: hp.team || '',
              points: hp.points || 0,
            } as Player;
          }
          return player;
        }).filter((p): p is Player => p !== undefined);

        if (playerRoster.length === 0) continue;

        // Create default lineup (same logic as initializeDefaultLineups)
        const starters: string[] = [];
        const bench: string[] = [];
        const ir: string[] = [];
        const slotAssignments: Record<string, string> = {};

        const slotsNeeded = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'G': 2, 'UTIL': 1 };
        const slotsFilled = { 'C': 0, 'LW': 0, 'RW': 0, 'D': 0, 'G': 0, 'UTIL': 0 };

        const getFantasyPosition = (pos: string): string => {
          if (pos === 'G') return 'G';
          if (['C'].includes(pos)) return 'C';
          if (['LW', 'L'].includes(pos)) return 'LW';
          if (['RW', 'R'].includes(pos)) return 'RW';
          if (['D', 'LD', 'RD'].includes(pos)) return 'D';
          return 'UTIL';
        };

        const sortedPlayers = [...playerRoster].sort((a, b) => (b.points || 0) - (a.points || 0));

        sortedPlayers.forEach(p => {
          const playerId = String(p.id);
          const statusLower = p.status?.toLowerCase() || '';
          
          if (statusLower === 'injured' || statusLower === 'suspended' || statusLower === 'ir') {
            if (ir.length < 3) {
              ir.push(playerId);
              slotAssignments[playerId] = `ir-slot-${ir.length}`;
            } else {
              bench.push(playerId);
            }
            return;
          }

          const pos = getFantasyPosition(p.position);
          let assigned = false;

          if (pos !== 'UTIL' && slotsFilled[pos] < slotsNeeded[pos]) {
            slotsFilled[pos]++;
            assigned = true;
            slotAssignments[playerId] = `slot-${pos}-${slotsFilled[pos]}`;
          } else if (pos !== 'G' && slotsFilled['UTIL'] < slotsNeeded['UTIL']) {
            slotsFilled['UTIL']++;
            assigned = true;
            slotAssignments[playerId] = 'slot-UTIL';
          }

          if (assigned) {
            starters.push(playerId);
          } else {
            bench.push(playerId);
          }
        });

        // Save lineup (one-time initialization)
        if (starters.length >= 10 && bench.length > 0) {
          await LeagueService.saveLineup(team.id, leagueId, {
            starters,
            bench,
            ir,
            slotAssignments
          });
        }
      }

      console.log('[DemoLeagueService] Lineups initialized');
    } catch (error) {
      console.error('[DemoLeagueService] Error initializing lineups:', error);
      throw error;
    }
  },

  /**
   * Create static matchups for demo league
   */
  async createDemoMatchups(leagueId: string, teams: any[]): Promise<void> {
    try {
      console.log('[DemoLeagueService] Creating static matchups...');

      // Generate matchups for weeks 1-20
      for (let week = 1; week <= 20; week++) {
        const weekStart = new Date(2024, 0, 1 + (week - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Create round-robin matchups
        for (let i = 0; i < teams.length; i += 2) {
          if (i + 1 < teams.length) {
            const team1 = teams[i];
            const team2 = teams[i + 1];

            // Create matchup
            const { error: matchupError } = await supabase
              .from('matchups')
              .insert({
                league_id: leagueId,
                week_number: week,
                week_start_date: weekStart.toISOString(),
                week_end_date: weekEnd.toISOString(),
                team1_id: team1.id,
                team2_id: team2.id,
                team1_score: Math.floor(Math.random() * 200) + 1000, // Static scores
                team2_score: Math.floor(Math.random() * 200) + 1000,
                status: 'completed',
              });

            if (matchupError) {
              console.warn(`[DemoLeagueService] Error creating matchup week ${week}:`, matchupError);
            }
          }
        }
      }

      console.log('[DemoLeagueService] Matchups created');
    } catch (error) {
      console.error('[DemoLeagueService] Error creating matchups:', error);
      throw error;
    }
  },
};

// Expose for manual initialization (for debugging)
if (typeof window !== 'undefined') {
  (window as any).initDemoLeague = async () => {
    console.log('Manually initializing demo league...');
    const result = await DemoLeagueService.forceReinitialize();
    console.log('Result:', result);
    return result;
  };
  console.log('Demo league initialization available at: window.initDemoLeague()');
}

