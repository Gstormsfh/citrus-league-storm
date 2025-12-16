/**
 * ProjectionService
 * Service for fetching and formatting player projections (matchup and RoS)
 */

import { supabase } from '@/integrations/supabase/client';

export interface PlayerProjection {
  player_id: number;
  game_id: number;
  base_xg: number;
  gsax_adjusted_xg: number;
  qoc_adjusted_xg: number;
  final_projected_xg: number;
  gsax_factor_pct: number;
  qoc_factor_pct: number;
  goalie_factor: number;
  opponent_team_id: number | null;
}

export interface PlayerTalentMetrics {
  player_id: number;
  season: number;
  ros_projection_xg: number;
  talent_adjusted_xg_per_60?: number;
  avg_toi_per_game?: number;
  updated_at: string;
}

export interface ProjectionWithRoS {
  matchup: PlayerProjection[];
  ros: PlayerTalentMetrics | null;
}

// Conversion factor: xG to fantasy points
const XG_TO_POINTS_FACTOR = 20.0;

/**
 * Get matchup projections for specific players and games
 */
export async function getPlayerProjections(
  playerIds: number[],
  gameIds?: number[],
  season: number = 2025
): Promise<PlayerProjection[]> {
  try {
    let query = supabase
      .from('player_projections')
      .select('*')
      .in('player_id', playerIds)
      .eq('season', season);

    if (gameIds && gameIds.length > 0) {
      query = query.in('game_id', gameIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching player projections:', error);
      return [];
    }

    return (data || []).map((row) => ({
      player_id: row.player_id,
      game_id: row.game_id,
      base_xg: parseFloat(row.base_xg) || 0,
      gsax_adjusted_xg: parseFloat(row.gsax_adjusted_xg) || 0,
      qoc_adjusted_xg: parseFloat(row.qoc_adjusted_xg) || 0,
      final_projected_xg: parseFloat(row.final_projected_xg) || 0,
      gsax_factor_pct: parseFloat(row.gsax_factor_pct) || 0,
      qoc_factor_pct: parseFloat(row.qoc_factor_pct) || 0,
      goalie_factor: parseFloat(row.goalie_factor) || 0,
      opponent_team_id: row.opponent_team_id || null,
    }));
  } catch (error) {
    console.error('Error in getPlayerProjections:', error);
    return [];
  }
}

/**
 * Get RoS (Rest of Season) projections for specific players
 */
export async function getPlayerTalentMetrics(
  playerIds: number[],
  season: number = 2025
): Promise<PlayerTalentMetrics[]> {
  try {
    const { data, error } = await supabase
      .from('player_talent_metrics')
      .select('*')
      .in('player_id', playerIds)
      .eq('season', season);

    if (error) {
      console.error('Error fetching player talent metrics:', error);
      return [];
    }

    return (data || []).map((row) => ({
      player_id: row.player_id,
      season: row.season,
      ros_projection_xg: parseFloat(row.ros_projection_xg) || 0,
      talent_adjusted_xg_per_60: row.talent_adjusted_xg_per_60
        ? parseFloat(row.talent_adjusted_xg_per_60)
        : undefined,
      avg_toi_per_game: row.avg_toi_per_game
        ? parseFloat(row.avg_toi_per_game)
        : undefined,
      updated_at: row.updated_at || '',
    }));
  } catch (error) {
    console.error('Error in getPlayerTalentMetrics:', error);
    return [];
  }
}

/**
 * Get both matchup and RoS projections for players in a matchup week
 */
export async function getProjectionsForMatchup(
  team1PlayerIds: number[],
  team2PlayerIds: number[],
  weekStart: Date,
  weekEnd: Date,
  season: number = 2025
): Promise<Map<number, ProjectionWithRoS>> {
  try {
    const allPlayerIds = [...new Set([...team1PlayerIds, ...team2PlayerIds])];

    // Get game IDs for the week
    const { data: gamesData, error: gamesError } = await supabase
      .from('nhl_games')
      .select('game_id')
      .eq('season', season)
      .gte('game_date', weekStart.toISOString().split('T')[0])
      .lte('game_date', weekEnd.toISOString().split('T')[0]);

    if (gamesError) {
      console.error('Error fetching games for matchup week:', gamesError);
      return new Map();
    }

    const gameIds = (gamesData || []).map((g) => g.game_id);

    // Fetch both matchup and RoS projections in parallel
    const [matchupProjections, rosMetrics] = await Promise.all([
      getPlayerProjections(allPlayerIds, gameIds.length > 0 ? gameIds : undefined, season),
      getPlayerTalentMetrics(allPlayerIds, season),
    ]);

    // Group by player_id
    const result = new Map<number, ProjectionWithRoS>();

    // Group matchup projections by player
    const matchupByPlayer = new Map<number, PlayerProjection[]>();
    for (const proj of matchupProjections) {
      if (!matchupByPlayer.has(proj.player_id)) {
        matchupByPlayer.set(proj.player_id, []);
      }
      matchupByPlayer.get(proj.player_id)!.push(proj);
    }

    // Group RoS metrics by player
    const rosByPlayer = new Map<number, PlayerTalentMetrics>();
    for (const ros of rosMetrics) {
      rosByPlayer.set(ros.player_id, ros);
    }

    // Combine for each player
    for (const playerId of allPlayerIds) {
      result.set(playerId, {
        matchup: matchupByPlayer.get(playerId) || [],
        ros: rosByPlayer.get(playerId) || null,
      });
    }

    return result;
  } catch (error) {
    console.error('Error in getProjectionsForMatchup:', error);
    return new Map();
  }
}

/**
 * Format explainability message based on projection factors
 * Returns null if no significant factors
 */
export function formatExplainabilityMessage(
  projection: PlayerProjection
): string | null {
  const qocAbs = Math.abs(projection.qoc_factor_pct);
  const gsaxAbs = Math.abs(projection.gsax_factor_pct);

  // Check if factors are significant (>= 5%)
  const qocSignificant = qocAbs >= 0.05;
  const gsaxSignificant = gsaxAbs >= 0.05;

  if (!qocSignificant && !gsaxSignificant) {
    return null;
  }

  // Prioritize QoC message if significant
  if (qocSignificant) {
    const qocPct = Math.round(projection.qoc_factor_pct * 100);
    if (projection.qoc_factor_pct >= 0.05) {
      return `⬆️ Matchup Advantage: Projected ${qocPct}% boost due to poor opponent defense (EVD).`;
    } else {
      return `⬇️ Matchup Penalty: Projected ${Math.abs(qocPct)}% reduction due to elite opponent defense (EVD).`;
    }
  }

  // Fall back to GSAx message
  if (gsaxSignificant) {
    const gsaxPct = Math.round(projection.gsax_factor_pct * 100);
    if (projection.gsax_factor_pct <= -0.05) {
      return `📉 Goalie Tax: Your shots face an elite goalie (GSAx) reducing projection by ${Math.abs(gsaxPct)}%.`;
    } else {
      return `📈 Goalie Bonus: Opponent Goalie is replacement-level (GSAx), boosting projection by ${gsaxPct}%.`;
    }
  }

  return null;
}

/**
 * Calculate total matchup projection for a player across all games in a week
 */
export function calculateMatchupProjectionTotal(
  projections: PlayerProjection[]
): {
  matchup_projected_xg: number;
  matchup_projected_points: number;
  gsax_factor_pct: number;
  qoc_factor_pct: number;
  explainability_message: string | null;
} {
  if (projections.length === 0) {
    return {
      matchup_projected_xg: 0,
      matchup_projected_points: 0,
      gsax_factor_pct: 0,
      qoc_factor_pct: 0,
      explainability_message: null,
    };
  }

  // Sum final projected xG across all games
  const matchup_projected_xg = projections.reduce(
    (sum, p) => sum + p.final_projected_xg,
    0
  );

  // Average the factors (or use the most significant one)
  const avgGsaxFactor = projections.reduce((sum, p) => sum + p.gsax_factor_pct, 0) / projections.length;
  const avgQocFactor = projections.reduce((sum, p) => sum + p.qoc_factor_pct, 0) / projections.length;

  // Use the first projection for explainability message (or combine messages)
  const explainability_message = formatExplainabilityMessage(projections[0]);

  return {
    matchup_projected_xg,
    matchup_projected_points: matchup_projected_xg * XG_TO_POINTS_FACTOR,
    gsax_factor_pct: avgGsaxFactor,
    qoc_factor_pct: avgQocFactor,
    explainability_message,
  };
}

/**
 * Get RoS projection in points format
 */
export function getRoSProjectionPoints(ros: PlayerTalentMetrics | null): number {
  if (!ros) {
    return 0;
  }
  return ros.ros_projection_xg * XG_TO_POINTS_FACTOR;
}

