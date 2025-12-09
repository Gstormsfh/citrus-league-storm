import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

/**
 * PlayerService - SINGLE SOURCE OF TRUTH
 * 
 * ALL player data (names, stats, positions, teams) comes EXCLUSIVELY from staging files:
 * - staging_2025_skaters (for skaters)
 * - staging_2025_goalies (for goalies)
 * 
 * This service replaces the old roster upload system and ensures consistency across the app.
 * No other source should be used for player data.
 */

// Player interface based on Staging Table structure (NOT the old 'players' table)
export interface Player {
  id: string; // Using string ID to be consistent with app usage, but will store NHL ID
  full_name: string;
  position: string;
  team: string;
  jersey_number: string | null;
  status: string | null;
  headshot_url: string | null;
  last_updated: string | null;
  games_played: number;
  
  // Stats (from 'all' situation)
  goals: number;
  assists: number;
  points: number;
  plus_minus: number;
  shots: number;
  hits: number;
  blocks: number;
  
  // Advanced stats (new)
  xGoals: number;
  corsi: number;
  fenwick: number;
  
  // Goalie specific
  wins: number | null;
  losses: number | null;
  ot_losses: number | null;
  saves: number | null;
  goals_against_average: number | null;
  save_percentage: number | null;
  highDangerSavePct: number;
  goalsSavedAboveExpected: number;
}

// In-memory cache for player data
interface CacheEntry {
  data: Player[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
let playersCache: CacheEntry | null = null;

export const PlayerService = {
  /**
   * Clear the player cache (call this when player data is updated)
   */
  clearCache(): void {
    playersCache = null;
  },

  /**
   * Get all players from staging files (SINGLE SOURCE OF TRUTH)
   * Returns both skaters and goalies with all stats from staging_2025_skaters and staging_2025_goalies
   * Results are cached for 5 minutes to improve performance
   */
  async getAllPlayers(): Promise<Player[]> {
    // Check cache first
    const now = Date.now();
    if (playersCache && (now - playersCache.timestamp) < CACHE_TTL) {
      return playersCache.data;
    }

    try {
      // 1. Fetch Skaters from staging_2025_skaters (situation = 'all')
      // This is the ONLY source for skater data - names, stats, positions, teams all come from here
      const { data: skaters, error: skaterError } = await supabase
        .from('staging_2025_skaters')
        .select('*')
        .eq('situation', 'all');

      if (skaterError) throw skaterError;

      // 2. Fetch Goalies from staging_2025_goalies (situation = 'all')
      // This is the ONLY source for goalie data - names, stats, positions, teams all come from here
      const { data: goalies, error: goalieError } = await supabase
        .from('staging_2025_goalies')
        .select('*')
        .eq('situation', 'all');

      if (goalieError) throw goalieError;

      // 3. Map Skaters from staging_2025_skaters to Player Interface
      // ALL data comes from staging files - names, positions, teams, stats
      const mappedSkaters = (skaters || []).map((s: any) => {
          // Calculate Assists correctly (parse strings from staging data)
          const pri = typeof s.I_F_primaryAssists === 'string' ? parseFloat(s.I_F_primaryAssists) : (s.I_F_primaryAssists || 0);
          const sec = typeof s.I_F_secondaryAssists === 'string' ? parseFloat(s.I_F_secondaryAssists) : (s.I_F_secondaryAssists || 0);
          const totalAssists = pri + sec;

          // Safety check for ID
          if (!s.playerId) return null;

          return {
            id: s.playerId.toString(), // NHL ID from staging file
            full_name: s.name, // Player name from staging file
            position: s.position, // Position from staging file
            team: s.team, // Team abbreviation from staging file
            jersey_number: null, // Not available in staging files - would need separate source
            status: 'active', // Default to active since they have stats in staging
            headshot_url: `https://assets.nhle.com/mugs/nhl/20242025/${s.team}/${s.playerId}.png`, // Constructed from staging data
            last_updated: new Date().toISOString(),
            games_played: typeof s.games_played === 'string' ? parseInt(s.games_played) : (s.games_played || 0),
            
            // All stats from staging_2025_skaters table
            goals: typeof s.I_F_goals === 'string' ? parseFloat(s.I_F_goals) : (s.I_F_goals || 0),
            assists: totalAssists,
            points: typeof s.I_F_points === 'string' ? parseFloat(s.I_F_points) : (s.I_F_points || 0),
            plus_minus: 0, // Not in MoneyPuck 'all' situation
            shots: typeof s.I_F_shotsOnGoal === 'string' ? parseFloat(s.I_F_shotsOnGoal) : (s.I_F_shotsOnGoal || 0),
            hits: typeof s.I_F_hits === 'string' ? parseFloat(s.I_F_hits) : (s.I_F_hits || 0),
            blocks: typeof s.shotsBlockedByPlayer === 'string' ? parseFloat(s.shotsBlockedByPlayer) : (s.shotsBlockedByPlayer || 0),
            // Advanced stats from staging files
            xGoals: typeof s.I_F_xGoals === 'string' ? parseFloat(s.I_F_xGoals) : (s.I_F_xGoals || 0),
            corsi: typeof s.onIce_corsiPercentage === 'string' ? parseFloat(s.onIce_corsiPercentage) : (s.onIce_corsiPercentage || 0),
            fenwick: typeof s.onIce_fenwickPercentage === 'string' ? parseFloat(s.onIce_fenwickPercentage) : (s.onIce_fenwickPercentage || 0),
            highDangerSavePct: 0,
            goalsSavedAboveExpected: 0,
            
            wins: null,
            losses: null,
            ot_losses: null,
            saves: null,
            goals_against_average: null,
            save_percentage: null
          };
      });

      // 4. Map Goalies from staging_2025_goalies to Player Interface
      // ALL data comes from staging files - names, positions, teams, stats
      const mappedGoalies = (goalies || []).map((g: any) => {
          if (!g.playerId) return null;
          return {
            id: g.playerId.toString(), // NHL ID from staging file
            full_name: g.name, // Player name from staging file
            position: 'G', // Position from staging file
            team: g.team, // Team abbreviation from staging file
            jersey_number: null, // Not available in staging files
            status: 'active', // Default to active since they have stats in staging
            headshot_url: `https://assets.nhle.com/mugs/nhl/20242025/${g.team}/${g.playerId}.png`, // Constructed from staging data
            last_updated: new Date().toISOString(),
            games_played: typeof g.games_played === 'string' ? parseInt(g.games_played) : (g.games_played || 0),
            
            // Skater stats not applicable to goalies
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            xGoals: 0,
            corsi: 0,
            fenwick: 0,
            
            // Advanced goalie stats calculated from staging_2025_goalies data
            highDangerSavePct: parseFloat(g.highDangerShots) > 0
                ? (parseFloat(g.highDangerShots) - parseFloat(g.highDangerGoals)) / parseFloat(g.highDangerShots)
                : 0,
            goalsSavedAboveExpected: (parseFloat(g.xGoals) - parseFloat(g.goals)) || 0,
            
            // Goalie stats calculated from staging_2025_goalies data
            // Note: Wins/Losses not available in MoneyPuck staging files
            wins: 0, // Not in staging files
            losses: 0, // Not in staging files
            ot_losses: 0, // Not in staging files
            
            // Derived stats from staging file data
            saves: (parseFloat(g.ongoal) - parseFloat(g.goals)) || 0,
            goals_against_average: parseFloat(g.icetime) > 0 
                ? (parseFloat(g.goals) * 3600) / parseFloat(g.icetime) 
                : 0,
            save_percentage: parseFloat(g.ongoal) > 0 
                ? (parseFloat(g.ongoal) - parseFloat(g.goals)) / parseFloat(g.ongoal) 
                : 0,
          };
      });

      // 5. Combine and Deduplicate players from staging files
      // Filter out nulls from mapping
      const validSkaters = mappedSkaters.filter((p): p is Player => p !== null);
      const validGoalies = mappedGoalies.filter((p): p is Player => p !== null);
      
      const allPlayers = [...validSkaters, ...validGoalies];
      
      // Deduplicate by player ID (in case of any duplicates in staging)
      const uniquePlayers = new Map<string, Player>();
      allPlayers.forEach(p => {
        if (!uniquePlayers.has(p.id)) {
          uniquePlayers.set(p.id, p);
        } else {
            // If duplicate exists, keep the first one (shouldn't happen with proper staging data)
        }
      });

      // Return sorted by points (all data from staging files)
      const sortedPlayers = Array.from(uniquePlayers.values()).sort((a, b) => b.points - a.points);
      
      // Cache the results
      playersCache = {
        data: sortedPlayers,
        timestamp: Date.now()
      };
      
      return sortedPlayers;

    } catch (error) {
      console.error('Error fetching players from staging tables (staging_2025_skaters/staging_2025_goalies):', error);
      return [];
    }
  },

  /**
   * Get players by position - all data from staging files
   */
  async getPlayersByPosition(position: string) {
    const all = await this.getAllPlayers();
    return all.filter(p => p.position === position);
  },

  /**
   * Search players by name - all data from staging files
   */
  async searchPlayers(query: string) {
    const all = await this.getAllPlayers();
    const lowerQuery = query.toLowerCase();
    return all.filter(p => p.full_name.toLowerCase().includes(lowerQuery));
  }
};
