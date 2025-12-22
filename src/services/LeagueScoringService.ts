/**
 * LeagueScoringService
 * Service for fetching league scoring settings and calculating fantasy points from projected stats
 */

import { supabase } from '@/integrations/supabase/client';

export interface LeagueScoringStat {
  id: string;
  name: string;
  points: number;
  enabled: boolean;
  category?: string;
  default?: boolean;
}

export interface LeagueScoringSettings {
  stats: LeagueScoringStat[];
  scoringType?: string;
  teamsCount?: number;
  draftType?: string;
  isPublic?: boolean;
}

export interface ProjectedStats {
  goals: number;
  assists: number;
  shots: number;
  blocks: number;
  hits: number;
  ppp: number; // Power Play Points
  pim?: number; // Penalty Minutes (optional)
  plus_minus?: number; // Plus/Minus (optional)
}

/**
 * Get league scoring settings by league ID
 */
export async function getLeagueScoringSettings(
  leagueId: string
): Promise<LeagueScoringSettings | null> {
  try {
    const { data: league, error } = await supabase
      .from('leagues')
      .select('settings')
      .eq('id', leagueId)
      .single();

    if (error) {
      console.error('Error fetching league scoring settings:', error);
      return null;
    }

    if (!league || !league.settings) {
      return null;
    }

    // Extract stats from settings
    const settings = league.settings as any;
    const stats: LeagueScoringStat[] = settings.stats || [];

    return {
      stats,
      scoringType: settings.scoringType,
      teamsCount: settings.teamsCount,
      draftType: settings.draftType,
      isPublic: settings.isPublic,
    };
  } catch (error) {
    console.error('Error in getLeagueScoringSettings:', error);
    return null;
  }
}

/**
 * Calculate fantasy points from projected stats using league scoring settings
 */
export function calculateFantasyPoints(
  projectedStats: ProjectedStats,
  leagueSettings: LeagueScoringSettings
): number {
  let points = 0.0;

  // Find enabled stats and calculate points
  for (const stat of leagueSettings.stats) {
    if (!stat.enabled) {
      continue;
    }

    const statValue = projectedStats[stat.id as keyof ProjectedStats];
    if (statValue !== undefined && statValue !== null) {
      points += statValue * stat.points;
    }
  }

  return points;
}

/**
 * Get default scoring settings (used as fallback)
 */
export function getDefaultScoringSettings(): LeagueScoringSettings {
  return {
    stats: [
      { id: 'g', name: 'Goals', points: 3, enabled: true, category: 'Offense', default: true },
      { id: 'a', name: 'Assists', points: 2, enabled: true, category: 'Offense', default: true },
      { id: 'ppp', name: 'Power Play Points', points: 1, enabled: true, category: 'Offense', default: true },
      { id: 'sog', name: 'Shots on Goal', points: 0.4, enabled: true, category: 'Offense', default: true },
      { id: 'blk', name: 'Blocks', points: 0.5, enabled: true, category: 'Defense', default: true },
      { id: 'hit', name: 'Hits', points: 0.2, enabled: true, category: 'Defense', default: true },
      { id: 'w', name: 'Wins', points: 4, enabled: true, category: 'Goalie', default: true },
      { id: 'so', name: 'Shutouts', points: 3, enabled: true, category: 'Goalie', default: true },
      { id: 'sv', name: 'Saves', points: 0.2, enabled: true, category: 'Goalie', default: true },
      { id: 'ga', name: 'Goals Against', points: -1, enabled: true, category: 'Goalie', default: true },
    ],
    scoringType: 'h2h-points',
  };
}

/**
 * Map projected stats to league stat IDs
 * Handles different naming conventions (e.g., 'shots' vs 'sog')
 */
export function mapProjectedStatsToLeagueStats(
  projectedStats: ProjectedStats
): Record<string, number> {
  return {
    g: projectedStats.goals,
    a: projectedStats.assists,
    ppp: projectedStats.ppp,
    sog: projectedStats.shots, // Shots on Goal
    blk: projectedStats.blocks,
    hit: projectedStats.hits,
    pim: projectedStats.pim || 0,
    // Note: Goalie stats (w, so, sv, ga) are not in ProjectedStats
    // They would need to be added separately if goalie projections are implemented
  };
}

/**
 * Calculate fantasy points with automatic stat mapping
 */
export function calculateFantasyPointsWithMapping(
  projectedStats: ProjectedStats,
  leagueSettings: LeagueScoringSettings
): number {
  const mappedStats = mapProjectedStatsToLeagueStats(projectedStats);
  
  let points = 0.0;
  
  for (const stat of leagueSettings.stats) {
    if (!stat.enabled) {
      continue;
    }
    
    const statValue = mappedStats[stat.id];
    if (statValue !== undefined && statValue !== null) {
      points += statValue * stat.points;
    }
  }
  
  return points;
}



