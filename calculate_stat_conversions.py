#!/usr/bin/env python3
"""
calculate_stat_conversions.py
Hybrid Bayesian regression system for converting projected xG into fantasy stats.

This module implements a hybrid approach:
- High-sample players: Use player-specific conversion rates
- Low-sample players: Shrink toward league averages using Bayesian regression

The conversion engine handles both:
- Matchup projections: Per-game xG → per-game stats
- RoS projections: Total season xG → season total stats
"""

import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, Optional, Tuple
from collections import defaultdict

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found in .env file")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# ============================================================================
# LEAGUE-WIDE CONVERSION RATES (RP Rates)
# ============================================================================

# Goals conversion
GOALS_PER_XG_RP = 0.15  # 15% of xG converts to goals (league average)

# Assists conversion
ASSISTS_PER_GOAL_RP = 1.5  # 1.5 assists per goal on average

# Shots conversion
SHOTS_PER_GOAL_RP = 5.0  # 5 shots per goal
SHOTS_PER_XG_RP = 0.75  # 0.75 shots per xG

# Blocks and Hits (per TOI minute)
BLOCKS_PER_TOI_RP = 0.02  # 0.02 blocks per minute of TOI
HITS_PER_TOI_RP = 0.15  # 0.15 hits per minute of TOI

# Power Play Points
PPP_PER_GOAL_RP = 0.25  # 25% of goals are on power play

# ============================================================================
# SAMPLE SIZE THRESHOLDS (C Constants)
# ============================================================================

C_GOALS_XG = 50.0  # Minimum xG before using player Goals/xG rate
C_ASSISTS_GOAL = 10.0  # Minimum goals before using player Assists/Goal rate
C_SHOTS_XG = 100.0  # Minimum xG before using player Shots/xG rate
C_BLOCKS_TOI = 500.0  # Minimum TOI minutes before using player Blocks/TOI rate
C_HITS_TOI = 500.0  # Minimum TOI minutes before using player Hits/TOI rate
C_PPP_GOAL = 20.0  # Minimum goals before using player PPP/Goal rate

# ============================================================================
# BAYESIAN REGRESSION FUNCTION
# ============================================================================

def regress_conversion_rate(
    player_rate: float,
    league_rate: float,
    sample_size: float,
    c_constant: float
) -> float:
    """
    Apply Bayesian shrinkage: blend player rate with league average.
    
    Formula: Regressed Rate = (Sample / (Sample + C)) × Player Rate + (C / (Sample + C)) × League Rate
    
    Args:
        player_rate: Player's personal conversion rate
        league_rate: League-wide average (RP rate)
        sample_size: Player's sample size (xG, goals, TOI, etc.)
        c_constant: C constant (threshold for trusting player rate)
    
    Returns:
        Regressed conversion rate
    """
    if sample_size <= 0:
        return league_rate
    
    weight = sample_size / (sample_size + c_constant)
    return (weight * player_rate) + ((1 - weight) * league_rate)


# ============================================================================
# HISTORICAL RATE CALCULATION
# ============================================================================

def load_player_historical_stats(season: int = 2025) -> pd.DataFrame:
    """
    Load player historical stats from staging_2025_skaters table.
    
    Returns:
        DataFrame with player_id, goals, assists, shots, hits, blocks, xg, games_played
    """
    try:
        response = supabase.table('staging_2025_skaters').select(
            'playerId, I_F_goals, I_F_primaryAssists, I_F_secondaryAssists, '
            'I_F_shotsOnGoal, I_F_hits, shotsBlockedByPlayer, '
            'I_F_xGoals, games_played'
        ).eq('situation', 'all').execute()
        
        if not response.data:
            print("   WARNING: No staging data found")
            return pd.DataFrame()
        
        df = pd.DataFrame(response.data)
        
        # Convert to numeric
        df['player_id'] = pd.to_numeric(df['playerId'], errors='coerce')
        df['goals'] = pd.to_numeric(df['I_F_goals'], errors='coerce').fillna(0)
        df['assists'] = (
            pd.to_numeric(df['I_F_primaryAssists'], errors='coerce').fillna(0) +
            pd.to_numeric(df['I_F_secondaryAssists'], errors='coerce').fillna(0)
        )
        df['shots'] = pd.to_numeric(df['I_F_shotsOnGoal'], errors='coerce').fillna(0)
        df['hits'] = pd.to_numeric(df['I_F_hits'], errors='coerce').fillna(0)
        df['blocks'] = pd.to_numeric(df['shotsBlockedByPlayer'], errors='coerce').fillna(0)
        df['xg'] = pd.to_numeric(df['I_F_xGoals'], errors='coerce').fillna(0)
        df['games_played'] = pd.to_numeric(df['games_played'], errors='coerce').fillna(1)
        
        # Keep only valid players
        df = df[df['player_id'].notna()].copy()
        
        return df[['player_id', 'goals', 'assists', 'shots', 'hits', 'blocks', 'xg', 'games_played']]
        
    except Exception as e:
        print(f"   ERROR: Error loading historical stats: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def load_player_toi(season: int = 2025) -> Dict[int, float]:
    """
    Load player TOI totals from player_toi_by_situation.
    
    Returns:
        Dictionary mapping player_id to total TOI in minutes
    """
    try:
        # Try player_gar_components first (has toi_total_minutes)
        response = supabase.table('player_gar_components').select(
            'player_id, toi_total_minutes, season'
        ).eq('season', season).execute()
        
        if response.data:
            df = pd.DataFrame(response.data)
            df['player_id'] = pd.to_numeric(df['player_id'], errors='coerce')
            df['toi_total_minutes'] = pd.to_numeric(df['toi_total_minutes'], errors='coerce').fillna(0)
            toi_dict = df.groupby('player_id')['toi_total_minutes'].sum().to_dict()
            return {int(k): float(v) for k, v in toi_dict.items()}
        
        # Fall back to aggregating from player_toi_by_situation
        toi_response = supabase.table('player_toi_by_situation').select(
            'player_id, toi_seconds, season'
        ).eq('season', season).execute()
        
        if not toi_response.data:
            return {}
        
        df = pd.DataFrame(toi_response.data)
        df['player_id'] = pd.to_numeric(df['player_id'], errors='coerce')
        df['toi_seconds'] = pd.to_numeric(df['toi_seconds'], errors='coerce').fillna(0)
        df['toi_total_minutes'] = df['toi_seconds'] / 60.0
        
        # Sum TOI per player
        toi_dict = df.groupby('player_id')['toi_total_minutes'].sum().to_dict()
        return {int(k): float(v) for k, v in toi_dict.items()}
        
    except Exception as e:
        print(f"   ERROR: Error loading TOI data: {e}")
        return {}


def calculate_player_conversion_rates(
    df_stats: pd.DataFrame,
    toi_dict: Dict[int, float]
) -> Dict[int, Dict[str, float]]:
    """
    Calculate player-specific conversion rates from historical data.
    
    Returns:
        Dictionary mapping player_id to conversion rates dict
    """
    rates = {}
    
    for _, row in df_stats.iterrows():
        player_id = int(row['player_id'])
        goals = float(row['goals'])
        assists = float(row['assists'])
        shots = float(row['shots'])
        hits = float(row['hits'])
        blocks = float(row['blocks'])
        xg = float(row['xg'])
        toi = toi_dict.get(player_id, 0.0)
        
        # Calculate rates (avoid division by zero)
        goals_per_xg = goals / xg if xg > 0 else 0.0
        assists_per_goal = assists / goals if goals > 0 else 0.0
        shots_per_xg = shots / xg if xg > 0 else 0.0
        blocks_per_toi = blocks / toi if toi > 0 else 0.0
        hits_per_toi = hits / toi if toi > 0 else 0.0
        
        # Estimate PPP (assume 25% of goals are PP, but we'll use actual if available)
        # For now, use league average
        ppp_per_goal = PPP_PER_GOAL_RP
        
        rates[player_id] = {
            'goals_per_xg': goals_per_xg,
            'assists_per_goal': assists_per_goal,
            'shots_per_xg': shots_per_xg,
            'blocks_per_toi': blocks_per_toi,
            'hits_per_toi': hits_per_toi,
            'ppp_per_goal': ppp_per_goal,
            # Sample sizes
            'xg_sample': xg,
            'goals_sample': goals,
            'toi_sample': toi,
        }
    
    return rates


# ============================================================================
# STAT CONVERSION FUNCTIONS
# ============================================================================

def convert_xg_to_stats(
    player_id: int,
    projected_xg: float,
    projected_toi: float,
    season: int = 2025,
    projection_type: str = 'matchup',  # 'matchup' or 'ros'
    player_rates_cache: Optional[Dict[int, Dict[str, float]]] = None
) -> Dict[str, float]:
    """
    Convert projected xG to projected fantasy stats using hybrid approach.
    
    Args:
        player_id: NHL player ID
        projected_xg: Projected xG value
            - For 'matchup': per-game xG
            - For 'ros': total remaining season xG
        projected_toi: Projected TOI in minutes
            - For 'matchup': per-game TOI
            - For 'ros': total remaining season TOI
        season: Season year
        projection_type: 'matchup' (per-game) or 'ros' (season total)
        player_rates_cache: Optional pre-calculated player rates (for performance)
    
    Returns:
        Dictionary with: goals, assists, shots, blocks, hits, ppp
    """
    # Load player rates if not provided
    if player_rates_cache is None:
        df_stats = load_player_historical_stats(season)
        toi_dict = load_player_toi(season)
        player_rates_cache = calculate_player_conversion_rates(df_stats, toi_dict)
    
    # Get player rates (or use league averages if not found)
    player_rates = player_rates_cache.get(player_id, {})
    
    # 1. Goals from xG
    player_goals_per_xg = player_rates.get('goals_per_xg', 0.0)
    xg_sample = player_rates.get('xg_sample', 0.0)
    regressed_goals_per_xg = regress_conversion_rate(
        player_goals_per_xg,
        GOALS_PER_XG_RP,
        xg_sample,
        C_GOALS_XG
    )
    projected_goals = regressed_goals_per_xg * projected_xg
    
    # 2. Assists from Goals
    player_assists_per_goal = player_rates.get('assists_per_goal', 0.0)
    goals_sample = player_rates.get('goals_sample', 0.0)
    regressed_assists_per_goal = regress_conversion_rate(
        player_assists_per_goal,
        ASSISTS_PER_GOAL_RP,
        goals_sample,
        C_ASSISTS_GOAL
    )
    projected_assists = regressed_assists_per_goal * projected_goals
    
    # 3. Shots from xG
    player_shots_per_xg = player_rates.get('shots_per_xg', 0.0)
    regressed_shots_per_xg = regress_conversion_rate(
        player_shots_per_xg,
        SHOTS_PER_XG_RP,
        xg_sample,
        C_SHOTS_XG
    )
    projected_shots = regressed_shots_per_xg * projected_xg
    
    # 4. Blocks from TOI
    player_blocks_per_toi = player_rates.get('blocks_per_toi', 0.0)
    toi_sample = player_rates.get('toi_sample', 0.0)
    regressed_blocks_per_toi = regress_conversion_rate(
        player_blocks_per_toi,
        BLOCKS_PER_TOI_RP,
        toi_sample,
        C_BLOCKS_TOI
    )
    projected_blocks = regressed_blocks_per_toi * projected_toi
    
    # 5. Hits from TOI
    player_hits_per_toi = player_rates.get('hits_per_toi', 0.0)
    regressed_hits_per_toi = regress_conversion_rate(
        player_hits_per_toi,
        HITS_PER_TOI_RP,
        toi_sample,
        C_HITS_TOI
    )
    projected_hits = regressed_hits_per_toi * projected_toi
    
    # 6. PPP from Goals (use league average for now, can be improved)
    projected_ppp = PPP_PER_GOAL_RP * projected_goals
    
    return {
        'goals': max(0.0, float(projected_goals)),
        'assists': max(0.0, float(projected_assists)),
        'shots': max(0.0, float(projected_shots)),
        'blocks': max(0.0, float(projected_blocks)),
        'hits': max(0.0, float(projected_hits)),
        'ppp': max(0.0, float(projected_ppp)),
    }


# ============================================================================
# BATCH CONVERSION (for performance)
# ============================================================================

def convert_batch_xg_to_stats(
    projections: list,
    season: int = 2025,
    projection_type: str = 'matchup'
) -> list:
    """
    Convert multiple xG projections to stats in batch (more efficient).
    
    Args:
        projections: List of dicts with 'player_id', 'projected_xg', 'projected_toi'
        season: Season year
        projection_type: 'matchup' or 'ros'
    
    Returns:
        List of dicts with added stat projections
    """
    # Load rates once for all players
    df_stats = load_player_historical_stats(season)
    toi_dict = load_player_toi(season)
    player_rates_cache = calculate_player_conversion_rates(df_stats, toi_dict)
    
    results = []
    for proj in projections:
        stats = convert_xg_to_stats(
            player_id=proj['player_id'],
            projected_xg=proj['projected_xg'],
            projected_toi=proj.get('projected_toi', 18.0),  # Default 18 min per game
            season=season,
            projection_type=projection_type,
            player_rates_cache=player_rates_cache
        )
        
        # Merge stats into projection dict
        result = {**proj, **stats}
        results.append(result)
    
    return results


if __name__ == "__main__":
    # Test the conversion engine
    print("=" * 80)
    print("TESTING STAT CONVERSION ENGINE")
    print("=" * 80)
    
    # Test with a sample player
    test_player_id = 8471214  # Example player ID
    test_xg = 0.5  # Per-game xG
    test_toi = 18.0  # Per-game TOI
    
    stats = convert_xg_to_stats(
        player_id=test_player_id,
        projected_xg=test_xg,
        projected_toi=test_toi,
        season=2025,
        projection_type='matchup'
    )
    
    print(f"\nTest Player ID: {test_player_id}")
    print(f"Input: {test_xg} xG, {test_toi} min TOI")
    print(f"Output Stats:")
    for stat, value in stats.items():
        print(f"  {stat}: {value:.4f}")

