#!/usr/bin/env python3
"""
fantasy_projection_pipeline.py
Fantasy projection pipeline with GSAx integration.

This script:
1. Loads GSAx data from goalie_gsax table
2. Calculates per-game GSAx factors for each goalie
3. Fetches team xGF (sum of talent-adjusted xG for all players)
4. Applies GSAx adjustment when projecting opponent team goals
5. Updates projections table with goalie-adjusted values
"""

import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime
from typing import Dict, Optional
from apply_qoc_adjustments import apply_qoc_to_projections

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("[ERROR] Error: Supabase credentials not found in .env file")
    print("   Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)


def load_goalie_gsax_data(season: int = 2025) -> Optional[pd.DataFrame]:
    """
    Load GSAx data from goalie_gsax table.
    
    Returns:
        DataFrame with goalie_id, regressed_gsax, total_shots_faced
    """
    print("=" * 80)
    print("LOADING GOALIE GSAX DATA")
    print("=" * 80)
    
    try:
        # IMPORTANT: For production we only care about the current season (2025)
        response = (
            supabase
            .table('goalie_gsax')
            .select('*')
            .eq('season', season)
            .execute()
        )
        
        if not response.data or len(response.data) == 0:
            print("[WARNING] No GSAx data found. Please run calculate_goalie_gsax.py first.")
            return None
        
        df = pd.DataFrame(response.data)
        
        # Convert types
        df['goalie_id'] = pd.to_numeric(df['goalie_id'], errors='coerce')
        df['regressed_gsax'] = pd.to_numeric(df['regressed_gsax'], errors='coerce')
        df['total_shots_faced'] = pd.to_numeric(df['total_shots_faced'], errors='coerce')
        
        # Remove invalid rows
        df = df[df['goalie_id'].notna() & df['regressed_gsax'].notna()].copy()
        
        print(f"[OK] Loaded GSAx data for {len(df):,} goalies")
        print(f"   GSAx range: [{df['regressed_gsax'].min():.2f}, {df['regressed_gsax'].max():.2f}]")
        
        return df
        
    except Exception as e:
        print(f"[ERROR] Error loading GSAx data: {e}")
        import traceback
        traceback.print_exc()
        return None


def calculate_goalie_factors(goalie_gsax: pd.DataFrame, goalie_games: Dict[int, int]) -> pd.DataFrame:
    """
    Calculate per-game GSAx factor for each goalie.
    
    Formula: Goalie_Factor = GSAx_reg / Total_Games_Played
    
    Args:
        goalie_gsax: DataFrame with goalie_id, regressed_gsax
        goalie_games: Dictionary mapping goalie_id to games played
    
    Returns:
        DataFrame with goalie_id, regressed_gsax, games_played, goalie_factor
    """
    print("\n" + "=" * 80)
    print("CALCULATING GOALIE FACTORS")
    print("=" * 80)
    
    # Merge games played data
    goalie_gsax['games_played'] = goalie_gsax['goalie_id'].map(goalie_games).fillna(1)
    
    # Calculate per-game factor
    # CRITICAL: Use regressed_gsax, NOT raw_gsax
    goalie_gsax['goalie_factor'] = goalie_gsax['regressed_gsax'] / goalie_gsax['games_played']
    
    # Handle edge cases (zero games, division by zero)
    goalie_gsax.loc[goalie_gsax['games_played'] == 0, 'goalie_factor'] = 0.0
    
    print(f"[OK] Calculated factors for {len(goalie_gsax):,} goalies")
    print(f"   Factor range: [{goalie_gsax['goalie_factor'].min():.4f}, {goalie_gsax['goalie_factor'].max():.4f}]")
    print(f"   Average factor: {goalie_gsax['goalie_factor'].mean():.4f}")
    
    return goalie_gsax[['goalie_id', 'regressed_gsax', 'games_played', 'goalie_factor']].copy()


def get_goalie_games_played(season: int = 2025) -> Dict[int, int]:
    """
    Get games played for each goalie from raw_shots table.
    
    Returns:
        Dictionary mapping goalie_id to games_played
    """
    print("\n" + "=" * 80)
    print("CALCULATING GOALIE GAMES PLAYED")
    print("=" * 80)
    
    try:
        # Get unique (goalie_id, game_id) pairs for the specified season
        all_shots = []
        offset = 0
        batch_size = 1000
        
        while True:
            response = (
                supabase
                .table('raw_shots')
                .select('goalie_id, game_id, season')
                .eq('season', season)
                .range(offset, offset + batch_size - 1)
                .execute()
            )
            
            if not response.data or len(response.data) == 0:
                break
            
            all_shots.extend(response.data)
            
            if len(response.data) < batch_size:
                break
            
            offset += batch_size
        
        if len(all_shots) == 0:
            print("[WARNING] No shots data found")
            return {}
        
        df = pd.DataFrame(all_shots)
        df['goalie_id'] = pd.to_numeric(df['goalie_id'], errors='coerce')
        df = df[df['goalie_id'].notna()].copy()
        
        # Count unique games per goalie
        goalie_games = df.groupby('goalie_id')['game_id'].nunique().to_dict()
        
        print(f"[OK] Calculated games played for {len(goalie_games):,} goalies")
        print(f"   Games range: [{min(goalie_games.values()) if goalie_games else 0}, {max(goalie_games.values()) if goalie_games else 0}]")
        
        return goalie_games
        
    except Exception as e:
        print(f"[WARNING] Error calculating games played: {e}")
        print("   Using default of 1 game per goalie")
        return {}


def calculate_team_xgf(team_players: list, player_xg_data: Dict[int, float]) -> float:
    """
    Calculate team xGF (sum of talent-adjusted xG for all players).
    
    CRITICAL: Must use Talent-Adjusted xG (shooting_talent_adjusted_xg),
    NOT Base xG or Flurry-Adjusted xG, to maintain consistency with GSAx baseline.
    
    Args:
        team_players: List of player IDs on the team
        player_xg_data: Dictionary mapping player_id to talent-adjusted xG per game
    
    Returns:
        Total team xGF (expected goals for)
    """
    team_xgf = sum(player_xg_data.get(pid, 0.0) for pid in team_players)
    return team_xgf


def apply_gsax_adjustment(team_xgf: float, opponent_goalie_factor: float) -> float:
    """
    Apply GSAx adjustment to team projected goals.
    
    Formula: Team_Projected_Goals = Team_xGF - Goalie_Factor
    
    Args:
        team_xgf: Team's talent-adjusted xGF
        opponent_goalie_factor: Opposing goalie's per-game GSAx factor
    
    Returns:
        Adjusted projected goals
    """
    # Negative factor (bad goalie) increases projected goals
    # Positive factor (good goalie) decreases projected goals
    adjusted_goals = team_xgf - opponent_goalie_factor
    
    # Ensure non-negative
    adjusted_goals = max(0.0, adjusted_goals)
    
    return adjusted_goals


def get_player_talent_adjusted_xg(season: int = 2025) -> Dict[int, float]:
    """
    Get per-game talent-adjusted xG for each player from raw_shots table.
    
    Returns:
        Dictionary mapping player_id to average talent-adjusted xG per game
    """
    print("\n" + "=" * 80)
    print("LOADING PLAYER TALENT-ADJUSTED XG")
    print("=" * 80)
    
    try:
        all_shots = []
        offset = 0
        batch_size = 1000
        
        while True:
            # IMPORTANT: Only use current-season shots for production projections
            response = (
                supabase
                .table('raw_shots')
                .select(
                    'player_id, shooting_talent_adjusted_xg, '
                    'flurry_adjusted_xg, xg_value, game_id, season'
                )
                .eq('season', season)
                .range(offset, offset + batch_size - 1)
                .execute()
            )
            
            if not response.data or len(response.data) == 0:
                break
            
            all_shots.extend(response.data)
            
            if len(response.data) < batch_size:
                break
            
            offset += batch_size
        
        if len(all_shots) == 0:
            print("[WARNING] No shots data found")
            return {}
        
        df = pd.DataFrame(all_shots)
        
        # Convert types
        df['player_id'] = pd.to_numeric(df['player_id'], errors='coerce')
        df['shooting_talent_adjusted_xg'] = pd.to_numeric(
            df['shooting_talent_adjusted_xg'], errors='coerce'
        )
        df['flurry_adjusted_xg'] = pd.to_numeric(
            df['flurry_adjusted_xg'], errors='coerce'
        )
        df['xg_value'] = pd.to_numeric(df['xg_value'], errors='coerce')
        
        # Apply fallback logic (same as in calculate_goalie_gsax.py)
        df['xga_value'] = df['shooting_talent_adjusted_xg'].fillna(
            df['flurry_adjusted_xg'].fillna(df['xg_value'])
        )
        
        # Remove invalid rows
        df = df[df['player_id'].notna() & df['xga_value'].notna()].copy()
        
        # Calculate per-game average xG for each player
        player_xg = df.groupby('player_id').agg(
            total_xg=('xga_value', 'sum'),
            games=('game_id', 'nunique')
        ).reset_index()
        
        player_xg['xg_per_game'] = player_xg['total_xg'] / player_xg['games']
        player_xg.loc[player_xg['games'] == 0, 'xg_per_game'] = 0.0
        
        result_dict = dict(zip(
            player_xg['player_id'].astype(int),
            player_xg['xg_per_game']
        ))
        
        print(f"[OK] Loaded xG data for {len(result_dict):,} players")
        print(f"   Average xG per game: {player_xg['xg_per_game'].mean():.4f}")
        
        return result_dict
        
    except Exception as e:
        print(f"[ERROR] Error loading player xG data: {e}")
        import traceback
        traceback.print_exc()
        return {}


def main(season: int = 2025):
    """Main execution function."""
    print("\n" + "=" * 80)
    print("FANTASY PROJECTION PIPELINE WITH GSAX INTEGRATION")
    print("=" * 80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load GSAx data
    goalie_gsax = load_goalie_gsax_data(season=season)
    if goalie_gsax is None:
        print("[ERROR] Failed to load GSAx data. Please run calculate_goalie_gsax.py first.")
        return
    
    # Get goalie games played
    goalie_games = get_goalie_games_played(season=season)
    
    # Calculate goalie factors
    goalie_factors = calculate_goalie_factors(goalie_gsax, goalie_games)
    
    # Get player talent-adjusted xG
    player_xg = get_player_talent_adjusted_xg(season=season)
    
    print("\n" + "=" * 80)
    print("PIPELINE READY")
    print("=" * 80)
    print("[OK] GSAx factors calculated and ready for use in projections")
    print("[OK] Player talent-adjusted xG loaded")
    print("\nNext steps:")
    print("1. Use goalie_factors dictionary to look up goalie_factor by goalie_id")
    print("2. Calculate team xGF using calculate_team_xgf() with player_xg data")
    print("3. Apply GSAx adjustment using apply_gsax_adjustment()")
    print("4. Update projections table with adjusted values")
    
    # Create lookup dictionaries for easy access
    goalie_factor_lookup = dict(zip(
        goalie_factors['goalie_id'].astype(int),
        goalie_factors['goalie_factor']
    ))
    
    return {
        'goalie_factors': goalie_factor_lookup,
        'player_xg': player_xg,
        'goalie_factors_df': goalie_factors
    }


def update_projections_with_gsax(
    game_id: int,
    team_a_players: list,
    team_b_players: list,
    team_b_goalie_id: Optional[int],
    goalie_factors: Dict[int, float],
    player_xg: Dict[int, float],
    apply_qoc: bool = True,
    season: int = 2025
) -> Optional[float]:
    """
    Update projections for a specific game with GSAx and QoC adjustments.
    
    This function:
    1. Calculates Team A's xGF (sum of talent-adjusted xG)
    2. Gets Team B's goalie factor
    3. Applies GSAx adjustment: Team_A_Projected_Goals = Team_A_xGF - Goalie_B_Factor
    4. Optionally applies QoC adjustments using GAR components
    5. Returns adjusted projected goals (for backwards compatibility)
    
    Args:
        game_id: NHL game ID
        team_a_players: List of player IDs for Team A
        team_b_players: List of player IDs for Team B
        team_b_goalie_id: Goalie ID for Team B (opposing goalie)
        goalie_factors: Dictionary mapping goalie_id to goalie_factor
        player_xg: Dictionary mapping player_id to per-game talent-adjusted xG
        apply_qoc: Whether to apply Quality of Competition adjustments (default: True)
        season: Season year for GAR component lookup (default: 2025)
    
    Returns:
        Adjusted projected goals for Team A, or None if calculation fails
    """
    result = get_final_fantasy_projection(
        game_id=game_id,
        team_a_players=team_a_players,
        team_b_players=team_b_players,
        team_b_goalie_id=team_b_goalie_id,
        goalie_factors=goalie_factors,
        player_xg=player_xg,
        apply_qoc=apply_qoc,
        season=season,
    )
    
    if result is None:
        return None
    
    # For legacy callers, return only the final projected goals
    return result.get('final_projected_goals')


def get_final_fantasy_projection(
    game_id: int,
    team_a_players: list,
    team_b_players: list,
    team_b_goalie_id: Optional[int],
    goalie_factors: Dict[int, float],
    player_xg: Dict[int, float],
    apply_qoc: bool = True,
    season: int = 2025,
) -> Optional[Dict[str, float]]:
    """
    Final projection entrypoint that enforces the full pipeline:
    Base Talent-Adjusted xG → GSAx → GAR/QoC.

    Returns a dictionary with both the final projection AND
    explainability hooks (intermediate values and factors).
    """
    # 1) Base team xGF from talent-adjusted xG
    base_team_xgf = calculate_team_xgf(team_a_players, player_xg)
    
    # Guard against completely empty teams
    if base_team_xgf < 0:
        base_team_xgf = 0.0
    
    # 2) GSAx adjustment
    goalie_factor = goalie_factors.get(team_b_goalie_id, 0.0) if team_b_goalie_id else 0.0
    gsax_adjusted_goals = apply_gsax_adjustment(base_team_xgf, goalie_factor)
    
    if base_team_xgf > 0:
        gsax_factor_pct = (gsax_adjusted_goals / base_team_xgf) - 1.0
    else:
        gsax_factor_pct = 0.0
    
    final_goals = gsax_adjusted_goals
    qoc_factor_pct = 0.0
    
    # 3) QoC adjustment (GAR-based) – operates at player level, then aggregates
    qoc_adjusted_goals = gsax_adjusted_goals
    
    if apply_qoc and team_a_players:
        from apply_qoc_adjustments import get_team_id_from_players
        
        opponent_team_id = get_team_id_from_players(team_b_players) if team_b_players else None
        
        if opponent_team_id:
            df_projections = pd.DataFrame({
                'player_id': team_a_players,
                'opponent_team_id': [opponent_team_id] * len(team_a_players),
                'situation': ['5v5'] * len(team_a_players),
                # Use per-player base xG so QoC acts at player level
                'base_xg': [player_xg.get(pid, 0.0) for pid in team_a_players],
            })
            
            df_projections = apply_qoc_to_projections(df_projections, season)
            qoc_adjusted_goals = float(df_projections['adjusted_xg'].sum())
            
            if gsax_adjusted_goals > 0:
                qoc_factor_pct = (qoc_adjusted_goals / gsax_adjusted_goals) - 1.0
            else:
                qoc_factor_pct = 0.0
            
            final_goals = qoc_adjusted_goals
        else:
            print("  WARNING: Could not determine opponent team ID. Skipping QoC adjustment.")
    
    # Ensure final projection is non-negative
    final_goals = max(0.0, final_goals)
    
    return {
        'game_id': game_id,
        'season': season,
        'base_team_xgf': float(base_team_xgf),
        'gsax_adjusted_goals': float(gsax_adjusted_goals),
        'qoc_adjusted_goals': float(qoc_adjusted_goals),
        'final_projected_goals': float(final_goals),
        'gsax_factor_pct': float(gsax_factor_pct),
        'qoc_factor_pct': float(qoc_factor_pct),
        'goalie_factor': float(goalie_factor),
    }


def update_all_projections(
    goalie_factors: Dict[int, float],
    player_xg: Dict[int, float]
):
    """
    Update all projections in the projections table with GSAx adjustments.
    
    This is a high-level function that:
    1. Fetches all games from nhl_games table
    2. For each game, identifies teams and goalies
    3. Calculates adjusted projections
    4. Updates projections table
    
    Args:
        goalie_factors: Dictionary mapping goalie_id to goalie_factor
        player_xg: Dictionary mapping player_id to per-game talent-adjusted xG
    """
    print("\n" + "=" * 80)
    print("UPDATING PROJECTIONS WITH GSAX")
    print("=" * 80)
    
    try:
        # Fetch upcoming games
        # Note: This is a simplified version - you may need to adjust based on your schema
        response = supabase.table('nhl_games').select('game_id, home_team_id, away_team_id').execute()
        
        if not response.data:
            print("[WARNING] No games found")
            return
        
        games = pd.DataFrame(response.data)
        print(f"   Found {len(games):,} games")
        
        # For each game, we would:
        # 1. Get team rosters
        # 2. Get goalie IDs
        # 3. Calculate adjusted projections
        # 4. Update projections table
        
        # This is a placeholder - actual implementation depends on your data structure
        print("   Projection update logic would go here")
        print("   (Requires team roster and goalie assignment data)")
        
    except Exception as e:
        print(f"[ERROR] Error updating projections: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    results = main()
    
    if results:
        print("\n" + "=" * 80)
        print("INTEGRATION EXAMPLE")
        print("=" * 80)
        print("Example: Calculating adjusted goals for Team A vs Team B")
        print("\nTo use in your projection system:")
        print("1. Call update_projections_with_gsax() for each game")
        print("2. Pass team rosters, goalie IDs, and the lookup dictionaries")
        print("3. Update projections table with adjusted values")
        print("\nNote: Full integration requires team roster and goalie assignment data")

