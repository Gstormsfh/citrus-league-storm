#!/usr/bin/env python3
"""
apply_qoc_adjustments.py
Apply Quality of Competition (QoC) adjustments to fantasy projections using GAR components.

This script:
1. Loads player GAR components from player_gar_components table
2. For each player-opponent matchup, calculates QoC adjustment factor
3. Applies adjustment to base talent-adjusted xG projection
4. Returns adjusted projections for use in fantasy_projection_pipeline.py

QoC Adjustment Formula:
- For Even Strength: QoC_Factor = (Player_EVO - Opponent_EVD) × Adjustment_Strength
- For Power Play: QoC_Factor = (Player_PPO - Opponent_PPD) × Adjustment_Strength
- Adjusted_xG = Base_Talent_Adjusted_xG × (1 + QoC_Factor)

Where Adjustment_Strength is a tuning parameter (default: 0.1 = 10% adjustment)
"""

import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, Optional, List, Tuple

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("❌ Error: Supabase credentials not found in .env file")
    print("   Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# QoC adjustment strength (configurable)
# 0.1 = 10% adjustment, 0.05 = 5% adjustment, etc.
QOC_ADJUSTMENT_STRENGTH = 0.1


def load_gar_components(player_ids: Optional[List[int]] = None, season: int = 2025):
    """
    Load GAR components for specified players.
    
    Args:
        player_ids: List of player IDs to load (None = all players)
        season: Season year (default: 2025)
    
    Returns:
        DataFrame with player_id and GAR component rates
    """
    try:
        query = supabase.table('player_gar_components').select(
            'player_id, evo_rate_regressed, evd_rate_regressed, '
            'ppo_rate_regressed, ppd_rate_regressed'
        ).eq('season', season)
        
        if player_ids:
            query = query.in_('player_id', player_ids)
        
        result = query.execute()
        
        if not result.data:
            return pd.DataFrame()
        
        df = pd.DataFrame(result.data)
        return df
        
    except Exception as e:
        print(f"❌ Error loading GAR components: {e}")
        return pd.DataFrame()


def get_team_id_from_players(player_ids: List[int]) -> Optional[int]:
    """
    Get team ID for a list of players by querying player_shifts table.
    
    Args:
        player_ids: List of player IDs
    
    Returns:
        Most common team_id for these players, or None if not found
    """
    if not player_ids:
        return None
    
    try:
        # Get team IDs for these players from recent shifts
        response = supabase.table('player_shifts').select(
            'player_id, team_id'
        ).in_('player_id', player_ids[:100]).limit(1000).execute()  # Limit to avoid huge queries
        
        if not response.data:
            return None
        
        # Count team_id occurrences
        team_counts = {}
        for row in response.data:
            team_id = row.get('team_id')
            if team_id:
                team_counts[team_id] = team_counts.get(team_id, 0) + 1
        
        if not team_counts:
            return None
        
        # Return most common team_id
        most_common_team = max(team_counts.items(), key=lambda x: x[1])[0]
        return int(most_common_team)
        
    except Exception as e:
        print(f"  WARNING: Could not get team ID from players: {e}")
        return None


def get_players_by_team(team_id: int) -> List[int]:
    """
    Get list of player IDs for a given team by querying player_shifts table.
    
    Args:
        team_id: NHL team ID
    
    Returns:
        List of unique player IDs on that team
    """
    try:
        # Get unique players from player_shifts for this team
        # Limit to recent games to get current roster
        response = supabase.table('player_shifts').select(
            'player_id'
        ).eq('team_id', team_id).limit(10000).execute()
        
        if not response.data:
            return []
        
        # Get unique player IDs
        player_ids = list(set([row['player_id'] for row in response.data]))
        return player_ids
        
    except Exception as e:
        print(f"  WARNING: Could not get players for team {team_id}: {e}")
        return []


def get_player_positions(player_ids: List[int]) -> Dict[int, str]:
    """
    Get player positions from staging_2025_skaters table.
    
    Args:
        player_ids: List of player IDs
    
    Returns:
        Dictionary mapping player_id -> position
    """
    if not player_ids:
        return {}
    
    try:
        # Query staging table for positions
        # Note: playerId in staging is string, need to convert
        player_id_strs = [str(pid) for pid in player_ids]
        
        response = supabase.table('staging_2025_skaters').select(
            'playerId, position'
        ).in_('playerId', player_id_strs).eq('situation', 'all').execute()
        
        if not response.data:
            return {}
        
        # Create mapping
        position_map = {}
        for row in response.data:
            player_id = int(row['playerId'])
            position = row.get('position', '')
            position_map[player_id] = position
        
        return position_map
        
    except Exception as e:
        print(f"  WARNING: Could not get player positions: {e}")
        return {}


def get_opponent_team_gar(opponent_team_id: int, component: str, season: int = 2025):
    """
    Get average GAR component rate for an opponent team.
    
    For defensive components (EVD, PPD), we average across all skaters on the team.
    For offensive components (EVO, PPO), we average across forwards only.
    
    Args:
        opponent_team_id: Team ID of opponent
        component: Component name ('evo', 'evd', 'ppo', 'ppd')
        season: Season year (default: 2025)
    
    Returns:
        Average component rate for the team
    """
    # Get all players on the team
    team_player_ids = get_players_by_team(opponent_team_id)
    
    if not team_player_ids:
        # Fallback: return league average (0.0 means no adjustment)
        return 0.0
    
    # Load GAR components for team players
    df_team_gar = load_gar_components(team_player_ids, season)
    
    if len(df_team_gar) == 0:
        return 0.0
    
    # Filter by position if needed
    if component in ['evo', 'ppo']:
        # For offensive components, use forwards only
        positions = get_player_positions(team_player_ids)
        forward_ids = [pid for pid, pos in positions.items() 
                      if pos and pos.upper() in ['C', 'LW', 'RW', 'F', 'W']]
        
        if forward_ids:
            df_team_gar = df_team_gar[df_team_gar['player_id'].isin(forward_ids)]
    
    # For EVD/PPD, use all skaters (already have all players)
    
    if len(df_team_gar) == 0:
        return 0.0
    
    # Get the appropriate component column
    component_map = {
        'evo': 'evo_rate_regressed',
        'evd': 'evd_rate_regressed',
        'ppo': 'ppo_rate_regressed',
        'ppd': 'ppd_rate_regressed'
    }
    
    component_col = component_map.get(component.lower())
    if not component_col or component_col not in df_team_gar.columns:
        return 0.0
    
    # Calculate average (simple mean, could be weighted by TOI in future)
    avg_rate = df_team_gar[component_col].mean()
    
    return float(avg_rate) if pd.notna(avg_rate) else 0.0


def calculate_qoc_adjustment(player_id: int, opponent_team_id: int, 
                             situation: str, df_gar: pd.DataFrame, season: int = 2025) -> float:
    """
    Calculate QoC adjustment factor for a player-opponent matchup.
    
    Args:
        player_id: Player ID
        opponent_team_id: Opponent team ID
        situation: Game situation ('5v5', 'PP', 'PK')
        df_gar: DataFrame with GAR components
    
    Returns:
        QoC adjustment factor (multiplier for xG projection)
    """
    # Get player's GAR component
    player_data = df_gar[df_gar['player_id'] == player_id]
    
    if len(player_data) == 0:
        return 1.0  # No adjustment if player data not available (1.0 = no change)
    
    player_row = player_data.iloc[0]
    
    # Determine which components to use based on situation
    if situation == '5v5':
        # Even strength: Player EVO vs Opponent EVD
        # Higher player EVO and lower opponent EVD = better matchup (positive adjustment)
        player_component = player_row.get('evo_rate_regressed', 0.0)
        opponent_component = get_opponent_team_gar(opponent_team_id, 'evd', season)
        # QoC = (Player_EVO - Opponent_EVD) × Strength
        # Positive when player is better offensively than opponent is defensively
        qoc_factor = (player_component - opponent_component) * QOC_ADJUSTMENT_STRENGTH
        
    elif situation == 'PP':
        # Power play: Player PPO vs Opponent PPD
        # Higher player PPO and lower opponent PPD = better matchup (positive adjustment)
        player_component = player_row.get('ppo_rate_regressed', 0.0)
        opponent_component = get_opponent_team_gar(opponent_team_id, 'ppd', season)
        # QoC = (Player_PPO - Opponent_PPD) × Strength
        qoc_factor = (player_component - opponent_component) * QOC_ADJUSTMENT_STRENGTH
        
    elif situation == 'PK':
        # Penalty kill: Player PPD vs Opponent PPO
        # Lower player PPD (better defense) and lower opponent PPO = better matchup
        # For PK, lower PPD is better, so we invert: (Opponent_PPO - Player_PPD)
        player_component = player_row.get('ppd_rate_regressed', 0.0)
        opponent_component = get_opponent_team_gar(opponent_team_id, 'ppo', season)
        # QoC = (Opponent_PPO - Player_PPD) × Strength
        # Positive when opponent has lower PPO (easier to defend) and player has lower PPD (better defense)
        qoc_factor = (opponent_component - player_component) * QOC_ADJUSTMENT_STRENGTH
        
    else:
        return 1.0  # Unknown situation - no adjustment
    
    # Cap the adjustment to prevent extreme values (e.g., ±20%)
    qoc_factor = max(-0.2, min(0.2, qoc_factor))
    
    # Convert to multiplier (1 + factor)
    # Positive factor = increase xG, negative factor = decrease xG
    adjustment_multiplier = 1.0 + qoc_factor
    
    return adjustment_multiplier


def apply_qoc_to_projections(df_projections: pd.DataFrame, 
                             season: int = 2025) -> pd.DataFrame:
    """
    Apply QoC adjustments to a DataFrame of projections.
    
    Args:
        df_projections: DataFrame with columns:
            - player_id: Player ID
            - opponent_team_id: Opponent team ID
            - situation: Game situation ('5v5', 'PP', 'PK')
            - base_xg: Base talent-adjusted xG projection
        season: Season year (default: 2025)
    
    Returns:
        DataFrame with qoc_adjustment_factor and adjusted_xg columns added
    """
    print("=" * 80)
    print("APPLYING QUALITY OF COMPETITION ADJUSTMENTS")
    print("=" * 80)
    
    # Get unique player IDs
    player_ids = df_projections['player_id'].unique().tolist()
    
    # Load GAR components for all players
    print(f"Loading GAR components for {len(player_ids):,} players...")
    df_gar = load_gar_components(player_ids, season)
    
    if len(df_gar) == 0:
        print("⚠️  No GAR components found. Skipping QoC adjustments.")
        df_projections['qoc_adjustment_factor'] = 1.0
        df_projections['adjusted_xg'] = df_projections['base_xg']
        return df_projections
    
    print(f"✅ Loaded GAR components for {len(df_gar):,} players")
    
    # Apply QoC adjustment to each projection
    print("Calculating QoC adjustments...")
    
    qoc_factors = []
    for _, row in df_projections.iterrows():
        factor = calculate_qoc_adjustment(
            row['player_id'],
            row.get('opponent_team_id', 0),
            row.get('situation', '5v5'),
            df_gar
        )
        qoc_factors.append(factor)
    
    df_projections['qoc_adjustment_factor'] = qoc_factors
    df_projections['adjusted_xg'] = df_projections['base_xg'] * df_projections['qoc_adjustment_factor']
    
    print(f"✅ Applied QoC adjustments to {len(df_projections):,} projections")
    print(f"   Average adjustment factor: {df_projections['qoc_adjustment_factor'].mean():.4f}")
    print(f"   Adjustment range: [{df_projections['qoc_adjustment_factor'].min():.4f}, {df_projections['qoc_adjustment_factor'].max():.4f}]")
    
    return df_projections


def main():
    """
    Main function for testing QoC adjustments.
    """
    print("=" * 80)
    print("QUALITY OF COMPETITION ADJUSTMENTS")
    print("=" * 80)
    print()
    print("This script is designed to be imported and used by fantasy_projection_pipeline.py")
    print("For standalone testing, create a test DataFrame with player projections.")
    print()


if __name__ == "__main__":
    main()

