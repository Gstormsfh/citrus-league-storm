import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// We are now defining Player based on the Staging Table structure, not the old 'players' table
export interface Player {
  id: string; // Using string ID to be consistent with app usage, but will store NHL ID
  full_name: string;
  position: string;
  team: string;
  jersey_number: string | null;
  status: string | null;
  headshot_url: string | null;
  last_updated: string | null;
  
  // Stats (from 'all' situation)
  goals: number;
  assists: number;
  points: number;
  plus_minus: number;
  shots: number;
  hits: number;
  blocks: number;
  
  // Goalie specific
  wins: number | null;
  losses: number | null;
  ot_losses: number | null;
  saves: number | null;
  goals_against_average: number | null;
  save_percentage: number | null;
}

export const PlayerService = {
  async getAllPlayers(): Promise<Player[]> {
    try {
      // 1. Fetch Skaters (situation = 'all')
      // We select specific columns to map to our Player interface
      const { data: skaters, error: skaterError } = await supabase
        .from('staging_2025_skaters')
        .select('*')
        .eq('situation', 'all');

      if (skaterError) throw skaterError;

      // 2. Fetch Goalies (situation = 'all')
      const { data: goalies, error: goalieError } = await supabase
        .from('staging_2025_goalies')
        .select('*')
        .eq('situation', 'all');

      if (goalieError) throw goalieError;

      // 3. Map Skaters to Player Interface
      const mappedSkaters = (skaters || []).map((s: any) => {
          // Calculate Assists correctly (parse strings)
          const pri = typeof s.I_F_primaryAssists === 'string' ? parseFloat(s.I_F_primaryAssists) : (s.I_F_primaryAssists || 0);
          const sec = typeof s.I_F_secondaryAssists === 'string' ? parseFloat(s.I_F_secondaryAssists) : (s.I_F_secondaryAssists || 0);
          const totalAssists = pri + sec;

          // Safety check for ID
          if (!s.playerId) return null;

          return {
            id: s.playerId.toString(), // Use NHL ID as the unique ID
            full_name: s.name,
            position: s.position,
            team: s.team,
            jersey_number: null, // Staging table might not have jersey number? Checking types... CSV didn't show it explicitly in user prompt list
            status: 'active', // Default to active since they have stats
            headshot_url: `https://assets.nhle.com/mugs/nhl/20242025/${s.team}/${s.playerId}.png`, // Construct dynamic URL
            last_updated: new Date().toISOString(),
            
            goals: typeof s.I_F_goals === 'string' ? parseFloat(s.I_F_goals) : (s.I_F_goals || 0),
            assists: totalAssists,
            points: typeof s.I_F_points === 'string' ? parseFloat(s.I_F_points) : (s.I_F_points || 0),
            plus_minus: 0, // Not in MoneyPuck 'all' usually
            shots: typeof s.I_F_shotsOnGoal === 'string' ? parseFloat(s.I_F_shotsOnGoal) : (s.I_F_shotsOnGoal || 0),
            hits: typeof s.I_F_hits === 'string' ? parseFloat(s.I_F_hits) : (s.I_F_hits || 0),
            blocks: typeof s.shotsBlockedByPlayer === 'string' ? parseFloat(s.shotsBlockedByPlayer) : (s.shotsBlockedByPlayer || 0),
            
            wins: null,
            losses: null,
            ot_losses: null,
            saves: null,
            goals_against_average: null,
            save_percentage: null
          };
      });

      // 4. Map Goalies to Player Interface
      const mappedGoalies = (goalies || []).map((g: any) => {
          if (!g.playerId) return null;
          return {
            id: g.playerId.toString(),
            full_name: g.name,
            position: 'G', // Staging might say 'G' or 'Goalie'
            team: g.team,
            jersey_number: null,
            status: 'active',
            headshot_url: `https://assets.nhle.com/mugs/nhl/20242025/${g.team}/${g.playerId}.png`,
            last_updated: new Date().toISOString(),
            
            goals: 0,
            assists: 0,
            points: 0,
            plus_minus: 0,
            shots: 0,
            hits: 0,
            blocks: 0,
            
            // Goalie Stats (Check casing/existence in DB if needed, mapping commonly used keys)
            wins: typeof g.wins === 'string' ? parseFloat(g.wins) : (g.wins || 0), // Check if 'wins' exists in staging
            losses: typeof g.losses === 'string' ? parseFloat(g.losses) : (g.losses || 0),
            ot_losses: typeof g.otLosses === 'string' ? parseFloat(g.otLosses) : (g.otLosses || 0),
            saves: typeof g.saves === 'string' ? parseFloat(g.saves) : (g.saves || 0),
            goals_against_average: typeof g.goalsAgainstAverage === 'string' ? parseFloat(g.goalsAgainstAverage) : (g.goalsAgainstAverage || 0),
            save_percentage: typeof g.savePercentage === 'string' ? parseFloat(g.savePercentage) : (g.savePercentage || 0),
          };
      });

      // 5. Combine and Deduplicate
      // Filter out nulls from mapping
      const validSkaters = mappedSkaters.filter((p): p is Player => p !== null);
      const validGoalies = mappedGoalies.filter((p): p is Player => p !== null);
      
      const allPlayers = [...validSkaters, ...validGoalies];
      
      const uniquePlayers = new Map<string, Player>();
      allPlayers.forEach(p => {
        if (!uniquePlayers.has(p.id)) {
          uniquePlayers.set(p.id, p);
        } else {
            // Optional: If duplicate exists, keep the one with more games/points?
            // For now, first one wins.
        }
      });

      return Array.from(uniquePlayers.values()).sort((a, b) => b.points - a.points);

    } catch (error) {
      console.error('Error fetching players from staging tables:', error);
      return [];
    }
  },

  async getPlayersByPosition(position: string) {
    const all = await this.getAllPlayers();
    return all.filter(p => p.position === position);
  },

  async searchPlayers(query: string) {
    const all = await this.getAllPlayers();
    const lowerQuery = query.toLowerCase();
    return all.filter(p => p.full_name.toLowerCase().includes(lowerQuery));
  }
};
