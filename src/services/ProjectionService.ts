/**
 * ProjectionService
 * Service for fetching and formatting player projections (matchup and RoS)
 */

import { supabase } from '@/integrations/supabase/client';
import {
  getLeagueScoringSettings,
  calculateFantasyPointsWithMapping,
  getDefaultScoringSettings,
  type ProjectedStats as LeagueProjectedStats,
} from './LeagueScoringService';

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

export interface ProjectedStats {
  goals: number;
  assists: number;
  shots: number;
  blocks: number;
  hits: number;
  ppp: number;
  pim?: number;
  plus_minus?: number;
}

export interface ProjectionWithStats {
  matchup_projected_xg: number;
  matchup_projected_points: number;
  matchup_projected_stats: ProjectedStats;
  ros_projected_xg: number;
  ros_projected_points: number;
  ros_projected_stats: ProjectedStats | null;
  gsax_factor_pct: number;
  qoc_factor_pct: number;
  explainability_message: string | null;
}

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

// DUPLICATE FUNCTION
// /**
//  * Calculate total matchup projection for a player across all games in a week
//  */
// export function calculateMatchupProjectionTotal(
//   projections: PlayerProjection[]
// ): {
//   matchup_projected_xg: number;
//   matchup_projected_points: number;
//   gsax_factor_pct: number;
//   qoc_factor_pct: number;
//   explainability_message: string | null;
// } {
//   if (projections.length === 0) {
//     return {
//       matchup_projected_xg: 0,
//       matchup_projected_points: 0,
//       gsax_factor_pct: 0,
//       qoc_factor_pct: 0,
//       explainability_message: null,
//     };
//   }

//   // Sum final projected xG across all games
//   const matchup_projected_xg = projections.reduce(
//     (sum, p) => sum + p.final_projected_xg,
//     0
//   );

//   // Average the factors (or use the most significant one)
//   const avgGsaxFactor = projections.reduce((sum, p) => sum + p.gsax_factor_pct, 0) / projections.length;
//   const avgQocFactor = projections.reduce((sum, p) => sum + p.qoc_factor_pct, 0) / projections.length;

//   // Use the first projection for explainability message (or combine messages)
//   const explainability_message = formatExplainabilityMessage(projections[0]);

//   return {
//     matchup_projected_xg,
//     matchup_projected_points: matchup_projected_xg * XG_TO_POINTS_FACTOR,
//     gsax_factor_pct: avgGsaxFactor,
//     qoc_factor_pct: avgQocFactor,
//     explainability_message,
//   };
// }

/**
 * Get projected stats for matchup projections
 */
export async function getMatchupProjectedStats(
  playerIds: number[],
  gameIds: number[],
  season: number = 2025
): Promise<Map<number, ProjectedStats>> {
  try {
    const { data, error } = await supabase
      .from('player_projected_stats')
      .select('*')
      .in('player_id', playerIds)
      .in('game_id', gameIds)
      .eq('season', season)
      .gt('game_id', 0); // Only matchup projections (game_id > 0, not -1 for RoS)

    if (error) {
      console.error('Error fetching matchup projected stats:', error);
      return new Map();
    }

    const statsByPlayer = new Map<number, ProjectedStats>();

    // Sum stats across all games for each player
    for (const row of data || []) {
      const playerId = row.player_id;
      const existing = statsByPlayer.get(playerId) || {
        goals: 0,
        assists: 0,
        shots: 0,
        blocks: 0,
        hits: 0,
        ppp: 0,
      };

      statsByPlayer.set(playerId, {
        goals: existing.goals + (parseFloat(row.projected_goals) || 0),
        assists: existing.assists + (parseFloat(row.projected_assists) || 0),
        shots: existing.shots + (parseFloat(row.projected_shots) || 0),
        blocks: existing.blocks + (parseFloat(row.projected_blocks) || 0),
        hits: existing.hits + (parseFloat(row.projected_hits) || 0),
        ppp: existing.ppp + (parseFloat(row.projected_ppp) || 0),
        pim: (existing.pim || 0) + (parseFloat(row.projected_pim) || 0),
        plus_minus: row.projected_plus_minus
          ? (existing.plus_minus || 0) + parseFloat(row.projected_plus_minus)
          : existing.plus_minus,
      });
    }

    return statsByPlayer;
  } catch (error) {
    console.error('Error in getMatchupProjectedStats:', error);
    return new Map();
  }
}

/**
 * Get projected stats for RoS projections
 */
export async function getRoSProjectedStats(
  playerIds: number[],
  season: number = 2025
): Promise<Map<number, ProjectedStats>> {
  try {
    const { data, error } = await supabase
      .from('player_projected_stats')
      .select('*')
      .in('player_id', playerIds)
      .eq('season', season)
      .eq('game_id', -1); // Only RoS projections (game_id = -1)

    if (error) {
      console.error('Error fetching RoS projected stats:', error);
      return new Map();
    }

    const statsByPlayer = new Map<number, ProjectedStats>();

    for (const row of data || []) {
      const playerId = row.player_id;
      statsByPlayer.set(playerId, {
        goals: parseFloat(row.projected_goals) || 0,
        assists: parseFloat(row.projected_assists) || 0,
        shots: parseFloat(row.projected_shots) || 0,
        blocks: parseFloat(row.projected_blocks) || 0,
        hits: parseFloat(row.projected_hits) || 0,
        ppp: parseFloat(row.projected_ppp) || 0,
        pim: row.projected_pim ? parseFloat(row.projected_pim) : undefined,
        plus_minus: row.projected_plus_minus
          ? parseFloat(row.projected_plus_minus)
          : undefined,
      });
    }

    return statsByPlayer;
  } catch (error) {
    console.error('Error in getRoSProjectedStats:', error);
    return new Map();
  }
}

/**
 * Calculate total matchup projection with stats and league-specific points
 */
export async function calculateMatchupProjectionWithStats(
  projections: PlayerProjection[],
  leagueId?: string
): Promise<{
  matchup_projected_xg: number;
  matchup_projected_points: number;
  matchup_projected_stats: ProjectedStats;
  gsax_factor_pct: number;
  qoc_factor_pct: number;
  explainability_message: string | null;
}> {
  if (projections.length === 0) {
    return {
      matchup_projected_xg: 0,
      matchup_projected_points: 0,
      matchup_projected_stats: {
        goals: 0,
        assists: 0,
        shots: 0,
        blocks: 0,
        hits: 0,
        ppp: 0,
      },
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

  // Average the factors
  const avgGsaxFactor =
    projections.reduce((sum, p) => sum + p.gsax_factor_pct, 0) / projections.length;
  const avgQocFactor =
    projections.reduce((sum, p) => sum + p.qoc_factor_pct, 0) / projections.length;

  // Get explainability message
  const explainability_message = formatExplainabilityMessage(projections[0]);

  // Get projected stats
  const playerIds = [...new Set(projections.map((p) => p.player_id))];
  const gameIds = [...new Set(projections.map((p) => p.game_id))];
  const statsMap = await getMatchupProjectedStats(
    playerIds,
    gameIds,
    projections[0].season || 2025
  );

  // Sum stats across all players (for team totals) or get first player's stats
  const matchup_projected_stats: ProjectedStats = {
    goals: 0,
    assists: 0,
    shots: 0,
    blocks: 0,
    hits: 0,
    ppp: 0,
  };

  // Sum stats for all players in projections
  for (const playerId of playerIds) {
    const playerStats = statsMap.get(playerId);
    if (playerStats) {
      matchup_projected_stats.goals += playerStats.goals;
      matchup_projected_stats.assists += playerStats.assists;
      matchup_projected_stats.shots += playerStats.shots;
      matchup_projected_stats.blocks += playerStats.blocks;
      matchup_projected_stats.hits += playerStats.hits;
      matchup_projected_stats.ppp += playerStats.ppp;
    }
  }

  // Calculate league-specific points
  let matchup_projected_points = 0;
  if (leagueId) {
    const leagueSettings = await getLeagueScoringSettings(leagueId);
    if (leagueSettings) {
      matchup_projected_points = calculateFantasyPointsWithMapping(
        matchup_projected_stats,
        leagueSettings
      );
    } else {
      // Fallback to default scoring
      const defaultSettings = getDefaultScoringSettings();
      matchup_projected_points = calculateFantasyPointsWithMapping(
        matchup_projected_stats,
        defaultSettings
      );
    }
  } else {
    // No league ID provided, use default scoring
    const defaultSettings = getDefaultScoringSettings();
    matchup_projected_points = calculateFantasyPointsWithMapping(
      matchup_projected_stats,
      defaultSettings
    );
  }

  return {
    matchup_projected_xg,
    matchup_projected_points,
    matchup_projected_stats,
    gsax_factor_pct: avgGsaxFactor,
    qoc_factor_pct: avgQocFactor,
    explainability_message,
  };
}

/**
 * Get RoS projection with stats and league-specific points
 */
export async function getRoSProjectionWithStats(
  ros: PlayerTalentMetrics | null,
  leagueId?: string
): Promise<{
  ros_projected_xg: number;
  ros_projected_points: number;
  ros_projected_stats: ProjectedStats | null;
}> {
  if (!ros) {
    return {
      ros_projected_xg: 0,
      ros_projected_points: 0,
      ros_projected_stats: null,
    };
  }

  // Get projected stats
  const statsMap = await getRoSProjectedStats([ros.player_id], ros.season);
  const ros_projected_stats = statsMap.get(ros.player_id) || null;

  // Calculate league-specific points
  let ros_projected_points = 0;
  if (ros_projected_stats) {
    if (leagueId) {
      const leagueSettings = await getLeagueScoringSettings(leagueId);
      if (leagueSettings) {
        ros_projected_points = calculateFantasyPointsWithMapping(
          ros_projected_stats,
          leagueSettings
        );
      } else {
        // Fallback to default scoring
        const defaultSettings = getDefaultScoringSettings();
        ros_projected_points = calculateFantasyPointsWithMapping(
          ros_projected_stats,
          defaultSettings
        );
      }
    } else {
      // No league ID provided, use default scoring
      const defaultSettings = getDefaultScoringSettings();
      ros_projected_points = calculateFantasyPointsWithMapping(
        ros_projected_stats,
        defaultSettings
      );
    }
  }

  return {
    ros_projected_xg: ros.ros_projection_xg,
    ros_projected_points,
    ros_projected_stats,
  };
}

/**
 * Calculate total matchup projection for a player across all games in a week
 * @deprecated Use calculateMatchupProjectionWithStats instead for league-specific scoring
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
    matchup_projected_points: matchup_projected_xg * 20.0, // Legacy: hardcoded factor
    // matchup_projected_points: matchup_projected_xg * XG_TO_POINTS_FACTOR, // from duplicate function
    gsax_factor_pct: avgGsaxFactor,
    qoc_factor_pct: avgQocFactor,
    explainability_message,
  };
}

/**
 * Get RoS projection in points format
 * @deprecated Use getRoSProjectionWithStats instead for league-specific scoring
 */
export function getRoSProjectionPoints(ros: PlayerTalentMetrics | null): number {
  if (!ros) {
    return 0;
  }
  return ros.ros_projection_xg * 20.0; // Legacy: hardcoded factor
}

