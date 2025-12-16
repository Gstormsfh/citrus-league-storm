#!/usr/bin/env python3
"""
calculate_gar_components.py
Calculate raw GAR component rates (EVO, EVD, PPO, PPD, Penalty) for all skaters.

This script:
1. Loads on-ice xGF/xGA data from Phase 1G shot matching
2. Loads TOI data from player_toi_by_situation table
3. Calculates raw component rates per 60 minutes for:
   - EVO (Even Strength Offense): xGF/60 at 5v5
   - EVD (Even Strength Defense): xGA/60 at 5v5
   - PPO (Power Play Offense): xGF/60 on PP
   - PPD (Power Play Defense/Penalty Kill): xGA/60 on PK
   - Penalty Component: (Penalties Drawn - Penalties Taken)/60
4. Outputs raw component rates for Bayesian regression

This script uses validated on-ice tracking from Phase 1G to accurately attribute
xGF and xGA to all players on ice for each shot.
"""

import pandas as pd
import numpy as np
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime
from typing import Dict, Optional, Tuple
import requests

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found in .env file")
    print("   Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Component-specific constants
SITUATION_5V5 = "5v5"
SITUATION_PP = "PP"
SITUATION_PK = "PK"

# NHL API base URL
NHL_BASE_URL = "https://api-web.nhle.com/v1"

# Penalty event typeCode (from data_acquisition.py analysis)
PENALTY_TYPECODE = 516


def load_on_ice_xgf_xga_data():
    """
    Load on-ice xGF/xGA data from Phase 1G shot matching.
    
    This function either:
    1. Loads from CSV if previously calculated (on_ice_xgf_xga.csv)
    2. Calculates on-the-fly using fix_gar_on_ice_tracking.py functions
    
    Returns:
        DataFrame with columns: player_id, situation, on_ice_xgf, on_ice_xga
    """
    print("=" * 80)
    print("LOADING ON-ICE xGF/xGA DATA")
    print("=" * 80)
    
    # First, try to load from CSV (if Phase 1G was already run)
    csv_file = 'on_ice_xgf_xga.csv'
    if os.path.exists(csv_file):
        print(f"Loading from existing CSV: {csv_file}")
        try:
            df = pd.read_csv(csv_file)
            print(f"OK: Loaded {len(df):,} player-situation combinations from CSV")
            print(f"   Unique players: {df['player_id'].nunique():,}")
            return df
        except Exception as e:
            print(f"WARNING: Could not load CSV: {e}")
            print("   Will calculate on-the-fly...")
    
    # If CSV not found, calculate on-the-fly using fix_gar_on_ice_tracking functions
    print("CSV not found. Calculating on-ice xGF/xGA on-the-fly...")
    print("(This may take several minutes for large datasets)")
    
    try:
        # Import functions from fix_gar_on_ice_tracking
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from fix_gar_on_ice_tracking import (
            load_shifts_with_game_clock,
            load_shots_with_game_clock,
            match_shots_to_shifts,
            aggregate_on_ice_xgf_xga
        )
        
        # Load shifts and shots
        df_shifts = load_shifts_with_game_clock()
        if df_shifts is None:
            print("ERROR: Could not load shifts data")
            return None
        
        df_shots = load_shots_with_game_clock()
        if df_shots is None:
            print("ERROR: Could not load shots data")
            return None
        
        # Match shots to shifts
        df_matched = match_shots_to_shifts(df_shifts, df_shots)
        
        # Aggregate on-ice xGF/xGA
        df_on_ice = aggregate_on_ice_xgf_xga(df_matched)
        
        # Debug: Check if xGA is being calculated
        if len(df_on_ice) > 0:
            non_zero_xga = (df_on_ice['on_ice_xga'] > 0).sum()
            print(f"   Non-zero xGA records: {non_zero_xga:,} / {len(df_on_ice):,}")
            if non_zero_xga == 0:
                print("   WARNING: All xGA values are zero! Check shot matching logic.")
        
        # Save to CSV for future use
        df_on_ice.to_csv(csv_file, index=False)
        print(f"OK: Saved on-ice stats to {csv_file}")
        
        return df_on_ice
        
    except ImportError as e:
        print(f"ERROR: Could not import fix_gar_on_ice_tracking functions: {e}")
        print("   Please ensure fix_gar_on_ice_tracking.py is in the same directory")
        return None
    except Exception as e:
        print(f"ERROR: Error calculating on-ice data: {e}")
        import traceback
        traceback.print_exc()
        return None


def load_shots_data():
    """
    Load shots data from raw_shots table.
    
    Returns:
        DataFrame with columns: player_id, game_id, period, shooting_talent_adjusted_xg,
        flurry_adjusted_xg, xg_value, is_goal, is_empty_net, home_skaters_on_ice,
        away_skaters_on_ice, team_code, is_home_team
    """
    print("=" * 80)
    print("LOADING SHOTS DATA")
    print("=" * 80)
    
    print("Loading from Supabase raw_shots table...")
    print("(Using pagination to fetch all records)")
    
    try:
        all_shots = []
        offset = 0
        batch_size = 1000
        
        while True:
            response = supabase.table('raw_shots').select(
                'id, player_id, game_id, period, time_remaining_seconds, shooting_talent_adjusted_xg, '
                'flurry_adjusted_xg, xg_value, is_goal, is_empty_net, '
                'home_skaters_on_ice, away_skaters_on_ice, team_code, is_home_team, goalie_id'
            ).range(offset, offset + batch_size - 1).execute()
            
            if not response.data or len(response.data) == 0:
                break
            
            all_shots.extend(response.data)
            
            if len(response.data) < batch_size:
                break  # Last batch
            
            offset += batch_size
            print(f"  Fetched {len(all_shots):,} records so far...")
        
        if len(all_shots) == 0:
            print("WARNING: No data found in database (0 rows returned)")
            return None
        
        df = pd.DataFrame(all_shots)
        
        # Convert types
        df['player_id'] = pd.to_numeric(df['player_id'], errors='coerce')
        df['game_id'] = pd.to_numeric(df['game_id'], errors='coerce')
        df['period'] = pd.to_numeric(df['period'], errors='coerce')
        df['is_goal'] = pd.to_numeric(df['is_goal'], errors='coerce').fillna(0).astype(int)
        df['is_empty_net'] = pd.to_numeric(df['is_empty_net'], errors='coerce').fillna(False).astype(bool)
        df['home_skaters_on_ice'] = pd.to_numeric(df['home_skaters_on_ice'], errors='coerce').fillna(5)
        df['away_skaters_on_ice'] = pd.to_numeric(df['away_skaters_on_ice'], errors='coerce').fillna(5)
        df['is_home_team'] = pd.to_numeric(df['is_home_team'], errors='coerce').fillna(False).astype(bool)
        
        # Handle xG values with fallback logic
        df['shooting_talent_adjusted_xg'] = pd.to_numeric(
            df['shooting_talent_adjusted_xg'], errors='coerce'
        )
        df['flurry_adjusted_xg'] = pd.to_numeric(
            df['flurry_adjusted_xg'], errors='coerce'
        )
        df['xg_value'] = pd.to_numeric(
            df['xg_value'], errors='coerce'
        )
        
        # Apply fallback logic
        df['xgf_value'] = df['shooting_talent_adjusted_xg'].fillna(
            df['flurry_adjusted_xg'].fillna(df['xg_value'])
        )
        
        # Remove rows with invalid player_id or missing xG
        df = df[df['player_id'].notna()].copy()
        df = df[df['xgf_value'].notna()].copy()
        
        # Ensure xG values are non-negative
        df['xgf_value'] = df['xgf_value'].clip(lower=0.0)
        
        # Identify situation for each shot
        df['situation'] = df.apply(identify_situation_from_shot, axis=1)
        
        print(f"Loaded {len(df):,} shots from database")
        print(f"   Unique players: {df['player_id'].nunique():,}")
        print(f"   Unique games: {df['game_id'].nunique():,}")
        print(f"   Situation breakdown:")
        print(f"     5v5: {(df['situation'] == SITUATION_5V5).sum():,}")
        print(f"     PP:  {(df['situation'] == SITUATION_PP).sum():,}")
        print(f"     PK:  {(df['situation'] == SITUATION_PK).sum():,}")
        
        return df
        
    except Exception as e:
        print(f"ERROR: Error loading from database: {e}")
        import traceback
        traceback.print_exc()
        return None


def identify_situation_from_shot(row):
    """
    Identify game situation from shot row.
    
    Args:
        row: DataFrame row with home_skaters_on_ice, away_skaters_on_ice, is_empty_net, is_home_team
    
    Returns:
        Situation string: "5v5", "PP", or "PK"
    """
    home_skaters = row.get('home_skaters_on_ice', 5)
    away_skaters = row.get('away_skaters_on_ice', 5)
    is_empty_net = row.get('is_empty_net', False)
    is_home_team = row.get('is_home_team', False)
    
    # Empty net situations
    if is_empty_net:
        return SITUATION_5V5
    
    # Even strength
    if home_skaters == 5 and away_skaters == 5:
        return SITUATION_5V5
    
    # Determine if shooting team has man advantage (PP) or disadvantage (PK)
    if is_home_team:
        if home_skaters > away_skaters:
            return SITUATION_PP  # Home team on power play
        elif home_skaters < away_skaters:
            return SITUATION_PK  # Home team on penalty kill
    else:
        if away_skaters > home_skaters:
            return SITUATION_PP  # Away team on power play
        elif away_skaters < home_skaters:
            return SITUATION_PK  # Away team on penalty kill
    
    # Default to 5v5
    return SITUATION_5V5


def load_toi_data():
    """
    Load TOI data from player_toi_by_situation table.
    
    Returns:
        DataFrame with columns: player_id, game_id, situation, toi_seconds
    """
    print("\n" + "=" * 80)
    print("LOADING TOI DATA")
    print("=" * 80)
    
    print("Loading from Supabase player_toi_by_situation table...")
    
    try:
        all_toi = []
        offset = 0
        batch_size = 1000
        
        while True:
            response = supabase.table('player_toi_by_situation').select(
                'player_id, game_id, situation, toi_seconds'
            ).range(offset, offset + batch_size - 1).execute()
            
            if not response.data or len(response.data) == 0:
                break
            
            all_toi.extend(response.data)
            
            if len(response.data) < batch_size:
                break  # Last batch
            
            offset += batch_size
            print(f"  Fetched {len(all_toi):,} records so far...")
        
        if len(all_toi) == 0:
            print("WARNING: No TOI data found. Run calculate_player_toi.py first.")
            return None
        
        df = pd.DataFrame(all_toi)
        
        # Convert types
        df['player_id'] = pd.to_numeric(df['player_id'], errors='coerce')
        df['game_id'] = pd.to_numeric(df['game_id'], errors='coerce')
        df['toi_seconds'] = pd.to_numeric(df['toi_seconds'], errors='coerce')
        
        # Remove invalid rows
        df = df[df['player_id'].notna()].copy()
        df = df[df['game_id'].notna()].copy()
        df = df[df['toi_seconds'].notna()].copy()
        df = df[df['toi_seconds'] > 0].copy()
        
        # Convert to minutes
        df['toi_minutes'] = df['toi_seconds'] / 60.0
        
        print(f"Loaded {len(df):,} TOI records")
        print(f"   Unique players: {df['player_id'].nunique():,}")
        print(f"   Unique games: {df['game_id'].nunique():,}")
        
        return df
        
    except Exception as e:
        print(f"ERROR: Error loading TOI data: {e}")
        import traceback
        traceback.print_exc()
        return None


def calculate_component_rates(df_on_ice, df_toi):
    """
    Calculate raw component rates for each player using on-ice xGF/xGA data.
    
    Args:
        df_on_ice: DataFrame with on-ice xGF/xGA by player and situation
        df_toi: DataFrame with TOI data by player and situation
    
    Returns:
        DataFrame with player_id and component rates
    """
    print("\n" + "=" * 80)
    print("CALCULATING RAW COMPONENT RATES")
    print("=" * 80)
    
    print("Using validated on-ice xGF/xGA data from Phase 1G...")
    
    # Aggregate TOI by player and situation
    toi_aggregates = df_toi.groupby(['player_id', 'situation']).agg(
        total_toi_minutes=('toi_minutes', 'sum')
    ).reset_index()
    
    # Merge on-ice xGF/xGA with TOI
    merged = pd.merge(
        df_on_ice,
        toi_aggregates,
        on=['player_id', 'situation'],
        how='outer'
    )
    
    # Fill missing values
    merged['on_ice_xgf'] = merged['on_ice_xgf'].fillna(0.0)
    merged['on_ice_xga'] = merged['on_ice_xga'].fillna(0.0)
    merged['total_toi_minutes'] = merged['total_toi_minutes'].fillna(0.0)
    
    # Calculate rates per 60 minutes for each situation
    # EVO: xGF/60 at 5v5
    # EVD: xGA/60 at 5v5
    # PPO: xGF/60 on PP
    # PPD: xGA/60 on PK
    
    # Minimum TOI threshold to calculate meaningful rates (10 minutes)
    MIN_TOI_MINUTES = 10.0
    
    merged['xgf_rate_per_60'] = np.where(
        merged['total_toi_minutes'] >= MIN_TOI_MINUTES,
        (merged['on_ice_xgf'] / merged['total_toi_minutes']) * 60.0,
        np.where(
            merged['total_toi_minutes'] > 0,
            (merged['on_ice_xgf'] / merged['total_toi_minutes']) * 60.0,  # Calculate but will be filtered
            0.0
        )
    )
    
    merged['xga_rate_per_60'] = np.where(
        merged['total_toi_minutes'] >= MIN_TOI_MINUTES,
        (merged['on_ice_xga'] / merged['total_toi_minutes']) * 60.0,
        np.where(
            merged['total_toi_minutes'] > 0,
            (merged['on_ice_xga'] / merged['total_toi_minutes']) * 60.0,  # Calculate but will be filtered
            0.0
        )
    )
    
    # Cap rates at reasonable maximums to prevent extreme outliers
    # EVO/EVD: Cap at 5.0 xGF/xGA per 60 (very high but possible)
    # PPO/PPD: Cap at 15.0 xGF/xGA per 60 (power plays are high-event)
    merged['xgf_rate_per_60'] = merged['xgf_rate_per_60'].clip(upper=15.0)
    merged['xga_rate_per_60'] = merged['xga_rate_per_60'].clip(upper=15.0)
    
    # Initialize component rates DataFrame with all players
    all_players = pd.concat([
        df_on_ice[['player_id']],
        df_toi[['player_id']]
    ]).drop_duplicates().reset_index(drop=True)
    
    component_rates = all_players.copy()
    
    # Calculate EVO (xGF/60 at 5v5) - use sum in case of multiple rows, but should be one per player-situation
    evo_data = merged[merged['situation'] == SITUATION_5V5].groupby('player_id')['xgf_rate_per_60'].sum().reset_index()
    evo_data.columns = ['player_id', 'evo_rate_raw']
    # Cap EVO at 5.0 (even strength shouldn't exceed this)
    evo_data['evo_rate_raw'] = evo_data['evo_rate_raw'].clip(upper=5.0)
    component_rates = component_rates.merge(evo_data, on='player_id', how='left')
    component_rates['evo_rate_raw'] = component_rates['evo_rate_raw'].fillna(0.0)
    
    # Calculate EVD (xGA/60 at 5v5)
    evd_data = merged[merged['situation'] == SITUATION_5V5].groupby('player_id')['xga_rate_per_60'].sum().reset_index()
    evd_data.columns = ['player_id', 'evd_rate_raw']
    # Cap EVD at 5.0
    evd_data['evd_rate_raw'] = evd_data['evd_rate_raw'].clip(upper=5.0)
    component_rates = component_rates.merge(evd_data, on='player_id', how='left')
    component_rates['evd_rate_raw'] = component_rates['evd_rate_raw'].fillna(0.0)
    
    # Calculate PPO (xGF/60 on PP)
    ppo_data = merged[merged['situation'] == SITUATION_PP].groupby('player_id')['xgf_rate_per_60'].sum().reset_index()
    ppo_data.columns = ['player_id', 'ppo_rate_raw']
    # Cap PPO at 12.0 (power plays are high-event)
    ppo_data['ppo_rate_raw'] = ppo_data['ppo_rate_raw'].clip(upper=12.0)
    component_rates = component_rates.merge(ppo_data, on='player_id', how='left')
    component_rates['ppo_rate_raw'] = component_rates['ppo_rate_raw'].fillna(0.0)
    
    # Calculate PPD (xGA/60 on PK)
    ppd_data = merged[merged['situation'] == SITUATION_PK].groupby('player_id')['xga_rate_per_60'].sum().reset_index()
    ppd_data.columns = ['player_id', 'ppd_rate_raw']
    # Cap PPD at 12.0
    ppd_data['ppd_rate_raw'] = ppd_data['ppd_rate_raw'].clip(upper=12.0)
    component_rates = component_rates.merge(ppd_data, on='player_id', how='left')
    component_rates['ppd_rate_raw'] = component_rates['ppd_rate_raw'].fillna(0.0)
    
    # Get total TOI for each player by situation
    toi_5v5 = df_toi[df_toi['situation'] == SITUATION_5V5].groupby('player_id')['toi_minutes'].sum().reset_index()
    toi_5v5.columns = ['player_id', 'toi_5v5_minutes']
    
    toi_pp = df_toi[df_toi['situation'] == SITUATION_PP].groupby('player_id')['toi_minutes'].sum().reset_index()
    toi_pp.columns = ['player_id', 'toi_pp_minutes']
    
    toi_pk = df_toi[df_toi['situation'] == SITUATION_PK].groupby('player_id')['toi_minutes'].sum().reset_index()
    toi_pk.columns = ['player_id', 'toi_pk_minutes']
    
    toi_total = df_toi.groupby('player_id')['toi_minutes'].sum().reset_index()
    toi_total.columns = ['player_id', 'toi_total_minutes']
    
    # Merge all TOI data
    component_rates = component_rates.merge(toi_5v5, on='player_id', how='left')
    component_rates = component_rates.merge(toi_pp, on='player_id', how='left')
    component_rates = component_rates.merge(toi_pk, on='player_id', how='left')
    component_rates = component_rates.merge(toi_total, on='player_id', how='left')
    
    # Fill missing TOI values
    component_rates['toi_5v5_minutes'] = component_rates['toi_5v5_minutes'].fillna(0.0)
    component_rates['toi_pp_minutes'] = component_rates['toi_pp_minutes'].fillna(0.0)
    component_rates['toi_pk_minutes'] = component_rates['toi_pk_minutes'].fillna(0.0)
    component_rates['toi_total_minutes'] = component_rates['toi_total_minutes'].fillna(0.0)
    
    # Penalty component will be calculated separately
    component_rates['penalty_component_raw'] = 0.0  # Will be updated by calculate_penalty_component
    
    # Filter out players with insufficient TOI (< 10 minutes total)
    # These players have unreliable rates due to small sample size
    MIN_TOTAL_TOI = 10.0
    players_before_filter = len(component_rates)
    component_rates = component_rates[component_rates['toi_total_minutes'] >= MIN_TOTAL_TOI].copy()
    players_after_filter = len(component_rates)
    
    print(f"Calculated component rates for {players_after_filter:,} players (filtered from {players_before_filter:,} with TOI >= {MIN_TOTAL_TOI} min)")
    print(f"   Players with 5v5 TOI: {(component_rates['toi_5v5_minutes'] > 0).sum():,}")
    print(f"   Players with PP TOI: {(component_rates['toi_pp_minutes'] > 0).sum():,}")
    print(f"   Players with PK TOI: {(component_rates['toi_pk_minutes'] > 0).sum():,}")
    print(f"\n   Sample rates (after filtering low TOI):")
    print(f"      EVO (xGF/60 at 5v5): min={component_rates['evo_rate_raw'].min():.3f}, max={component_rates['evo_rate_raw'].max():.3f}, mean={component_rates['evo_rate_raw'].mean():.3f}")
    print(f"      EVD (xGA/60 at 5v5): min={component_rates['evd_rate_raw'].min():.3f}, max={component_rates['evd_rate_raw'].max():.3f}, mean={component_rates['evd_rate_raw'].mean():.3f}")
    print(f"      PPO (xGF/60 on PP): min={component_rates['ppo_rate_raw'].min():.3f}, max={component_rates['ppo_rate_raw'].max():.3f}, mean={component_rates['ppo_rate_raw'].mean():.3f}")
    print(f"      PPD (xGA/60 on PK): min={component_rates['ppd_rate_raw'].min():.3f}, max={component_rates['ppd_rate_raw'].max():.3f}, mean={component_rates['ppd_rate_raw'].mean():.3f}")
    
    return component_rates


def get_game_ids_from_toi() -> list:
    """
    Get list of unique game IDs from player_toi_by_situation table.
    
    Returns:
        List of game IDs (as integers)
    """
    try:
        all_game_ids = []
        offset = 0
        batch_size = 1000
        
        while True:
            response = supabase.table('player_toi_by_situation').select(
                'game_id'
            ).range(offset, offset + batch_size - 1).execute()
            
            if not response.data or len(response.data) == 0:
                break
            
            all_game_ids.extend([row['game_id'] for row in response.data])
            
            if len(response.data) < batch_size:
                break
            
            offset += batch_size
        
        # Get unique game IDs
        unique_game_ids = list(set(all_game_ids))
        print(f"Found {len(unique_game_ids):,} unique games in TOI data")
        return unique_game_ids
        
    except Exception as e:
        print(f"ERROR: Could not get game IDs from TOI table: {e}")
        return []


def extract_penalty_events(game_id: int) -> list:
    """
    Extract penalty events from NHL play-by-play data for a single game.
    
    Args:
        game_id: NHL game ID
    
    Returns:
        List of penalty event dictionaries with:
        - committing_player_id: Player who took penalty
        - drawn_by_player_id: Player who drew penalty (may be None)
        - game_id: Game ID
    """
    pbp_url = f"{NHL_BASE_URL}/gamecenter/{game_id}/play-by-play"
    
    try:
        response = requests.get(pbp_url, timeout=10)
        response.raise_for_status()
        raw_data = response.json()
    except Exception as e:
        print(f"  WARNING: Could not fetch PBP for game {game_id}: {e}")
        return []
    
    penalty_events = []
    plays = raw_data.get('plays', [])
    
    for play in plays:
        type_code = play.get('typeCode')
        
        # Check if this is a penalty event
        if type_code == PENALTY_TYPECODE:
            details = play.get('details', {})
            
            # Extract penalty information
            committing_player_id = details.get('committingPlayerId') or details.get('committedByPlayerId')
            drawn_by_player_id = details.get('drawnByPlayerId')
            
            if committing_player_id:
                penalty_events.append({
                    'game_id': game_id,
                    'committing_player_id': committing_player_id,
                    'drawn_by_player_id': drawn_by_player_id
                })
    
    return penalty_events


def calculate_penalty_component(df_toi: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate penalty component (penalties drawn - penalties taken) per 60 minutes.
    
    Args:
        df_toi: DataFrame with TOI data (to get total TOI per player)
    
    Returns:
        DataFrame with player_id and penalty_component_raw
    """
    print("\n" + "=" * 80)
    print("CALCULATING PENALTY COMPONENT")
    print("=" * 80)
    
    print("Extracting penalty events from play-by-play data...")
    print("(This may take several minutes for large datasets)")
    
    # Get list of games to process
    game_ids = get_game_ids_from_toi()
    
    if len(game_ids) == 0:
        print("WARNING: No game IDs found. Cannot calculate penalty component.")
        return pd.DataFrame(columns=['player_id', 'penalty_component_raw'])
    
    # Extract penalty events from all games
    all_penalties = []
    processed = 0
    
    for game_id in game_ids:
        penalties = extract_penalty_events(game_id)
        all_penalties.extend(penalties)
        processed += 1
        
        if processed % 50 == 0:
            print(f"  Processed {processed:,} / {len(game_ids):,} games...")
    
    if len(all_penalties) == 0:
        print("WARNING: No penalty events found. Setting penalty component to 0.")
        # Return DataFrame with all players and 0 penalty component
        all_players = df_toi['player_id'].unique()
        return pd.DataFrame({
            'player_id': all_players,
            'penalty_component_raw': 0.0
        })
    
    print(f"OK: Extracted {len(all_penalties):,} penalty events")
    
    # Convert to DataFrame
    df_penalties = pd.DataFrame(all_penalties)
    
    # Count penalties taken (committed) and drawn per player
    penalties_taken = df_penalties.groupby('committing_player_id').size().reset_index()
    penalties_taken.columns = ['player_id', 'penalties_taken']
    
    penalties_drawn = df_penalties[df_penalties['drawn_by_player_id'].notna()].groupby('drawn_by_player_id').size().reset_index()
    penalties_drawn.columns = ['player_id', 'penalties_drawn']
    
    # Get total TOI per player (in minutes)
    player_toi_total = df_toi.groupby('player_id')['toi_minutes'].sum().reset_index()
    player_toi_total.columns = ['player_id', 'toi_total_minutes']
    
    # Merge all data
    penalty_component = player_toi_total.copy()
    penalty_component = penalty_component.merge(penalties_taken, on='player_id', how='left')
    penalty_component = penalty_component.merge(penalties_drawn, on='player_id', how='left')
    
    # Fill missing values
    penalty_component['penalties_taken'] = penalty_component['penalties_taken'].fillna(0)
    penalty_component['penalties_drawn'] = penalty_component['penalties_drawn'].fillna(0)
    
    # Calculate penalty component: (Drawn - Taken) / TOI_minutes * 60
    penalty_component['penalty_component_raw'] = np.where(
        penalty_component['toi_total_minutes'] > 0,
        ((penalty_component['penalties_drawn'] - penalty_component['penalties_taken']) / 
         penalty_component['toi_total_minutes']) * 60.0,
        0.0
    )
    
    # Store summary stats before selecting columns
    total_taken = penalty_component['penalties_taken'].sum()
    total_drawn = penalty_component['penalties_drawn'].sum()
    min_penalty = penalty_component['penalty_component_raw'].min()
    max_penalty = penalty_component['penalty_component_raw'].max()
    mean_penalty = penalty_component['penalty_component_raw'].mean()
    
    # Select only needed columns
    penalty_component = penalty_component[['player_id', 'penalty_component_raw']]
    
    print(f"OK: Calculated penalty component for {len(penalty_component):,} players")
    print(f"   Penalties taken: {total_taken:,.0f}")
    print(f"   Penalties drawn: {total_drawn:,.0f}")
    print(f"   Penalty component range: min={min_penalty:.3f}, max={max_penalty:.3f}, mean={mean_penalty:.3f}")
    
    return penalty_component


def save_component_rates(df_rates):
    """
    Save component rates to CSV and database.
    
    Args:
        df_rates: DataFrame with component rates
    """
    print("\n" + "=" * 80)
    print("SAVING COMPONENT RATES")
    print("=" * 80)
    
    # Save to CSV
    output_file = 'player_gar_components_raw.csv'
    df_rates.to_csv(output_file, index=False)
    print(f"Saved to {output_file}")
    
    # Note: We'll save to database after regression in calculate_gar_regression.py
    print("   (Database storage will happen after regression)")


def main():
    """
    Main function to calculate GAR component rates.
    """
    print("=" * 80)
    print("PHASE 2: CALCULATE RAW GAR COMPONENT RATES")
    print("=" * 80)
    print()
    
    # Load on-ice xGF/xGA data (from Phase 1G)
    df_on_ice = load_on_ice_xgf_xga_data()
    if df_on_ice is None:
        print("ERROR: Failed to load on-ice xGF/xGA data")
        print("   Please ensure Phase 1G (shot matching) has been completed")
        return
    
    # Load TOI data
    df_toi = load_toi_data()
    if df_toi is None:
        print("ERROR: No TOI data available.")
        print("   Run calculate_player_toi.py first to generate TOI data.")
        return
    
    # Calculate component rates (EVO, EVD, PPO, PPD)
    df_rates = calculate_component_rates(df_on_ice, df_toi)
    
    if df_rates is None or len(df_rates) == 0:
        print("ERROR: Failed to calculate component rates")
        return
    
    # Calculate penalty component
    df_penalty = calculate_penalty_component(df_toi)
    
    # Merge penalty component into main rates
    # Remove the placeholder penalty_component_raw column first
    if 'penalty_component_raw' in df_rates.columns:
        df_rates = df_rates.drop(columns=['penalty_component_raw'])
    
    df_rates = df_rates.merge(df_penalty, on='player_id', how='left')
    df_rates['penalty_component_raw'] = df_rates['penalty_component_raw'].fillna(0.0)
    
    # Save results
    save_component_rates(df_rates)
    
    print()
    print("=" * 80)
    print("PHASE 2 COMPLETE")
    print("=" * 80)
    print()
    print("Summary:")
    print(f"  - Calculated component rates for {len(df_rates):,} players")
    print(f"  - EVO (xGF/60 at 5v5): Ready for regression")
    print(f"  - EVD (xGA/60 at 5v5): Ready for regression")
    print(f"  - PPO (xGF/60 on PP): Ready for regression")
    print(f"  - PPD (xGA/60 on PK): Ready for regression")
    print(f"  - Penalty Component: Ready for regression")
    print()
    print("Next step:")
    print("  Run calculate_gar_regression.py to apply Bayesian regression")


if __name__ == "__main__":
    main()

