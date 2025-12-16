#!/usr/bin/env python3
"""
Phase 1G: Shot Matching for On-Ice xGF/xGA Attribution

This script:
1. Loads split shift segments from player_shifts (with running game clock)
2. Loads shots from raw_shots (converts time_remaining_seconds to running game clock)
3. Matches shots to shifts using running game clock
4. Attributes xGF to shooting team players, xGA to defending team players
5. Aggregates on-ice xGF/xGA by player and situation
"""

import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, Tuple

load_dotenv()

supabase = create_client(
    os.getenv('VITE_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)


def calculate_running_game_clock(period: int, time_in_period_seconds: float) -> Optional[float]:
    """
    Convert period + time to running game clock.
    
    Args:
        period: Period number (1, 2, 3, 4+)
        time_in_period_seconds: Time in period in seconds
    
    Returns:
        Running game clock in seconds, or None if invalid
    """
    if period < 1 or period > 10:
        return None
    
    if time_in_period_seconds is None or time_in_period_seconds < 0:
        return None
    
    # Period 1: 0-1200 seconds (0-20 minutes)
    # Period 2: 1200-2400 seconds (20-40 minutes)
    # Period 3: 2400-3600 seconds (40-60 minutes)
    # Overtime: 3600+ seconds (60+ minutes, increments of 300s per OT period)
    base_seconds = (period - 1) * 1200.0
    
    # For overtime periods (4+), add 5 minutes per OT period
    if period > 3:
        ot_periods = period - 3
        base_seconds = 3600.0 + (ot_periods - 1) * 300.0
    
    return base_seconds + time_in_period_seconds


def load_shifts_with_game_clock():
    """
    Load player_shifts data with running game clock.
    
    Returns:
        DataFrame with shift segments including shift_start_game_clock and shift_end_game_clock
    """
    print("=" * 80)
    print("LOADING SHIFT DATA WITH RUNNING GAME CLOCK")
    print("=" * 80)
    
    all_shifts = []
    offset = 0
    batch_size = 1000
    
    while True:
        response = supabase.table('player_shifts').select(
            'player_id, game_id, period, team_id, situation, '
            'shift_start_time_seconds, shift_end_time_seconds'
        ).range(offset, offset + batch_size - 1).execute()
        
        if not response.data or len(response.data) == 0:
            break
        
        all_shifts.extend(response.data)
        
        if len(response.data) < batch_size:
            break
        
        offset += batch_size
        print(f"  Fetched {len(all_shifts):,} shift segments...")
    
    if len(all_shifts) == 0:
        print("WARNING: No shifts data found. Run calculate_player_toi.py first.")
        return None
    
    df = pd.DataFrame(all_shifts)
    
    # Convert types
    df['player_id'] = pd.to_numeric(df['player_id'], errors='coerce')
    df['game_id'] = pd.to_numeric(df['game_id'], errors='coerce')
    df['period'] = pd.to_numeric(df['period'], errors='coerce')
    df['team_id'] = pd.to_numeric(df['team_id'], errors='coerce')
    df['shift_start_time_seconds'] = pd.to_numeric(df['shift_start_time_seconds'], errors='coerce')
    df['shift_end_time_seconds'] = pd.to_numeric(df['shift_end_time_seconds'], errors='coerce')
    
    # Calculate running game clock from period and time
    df['shift_start_game_clock'] = df.apply(
        lambda row: calculate_running_game_clock(row['period'], row['shift_start_time_seconds']),
        axis=1
    )
    
    df['shift_end_game_clock'] = df.apply(
        lambda row: calculate_running_game_clock(row['period'], row['shift_end_time_seconds']),
        axis=1
    )
    
    # Remove invalid rows
    df = df[df['player_id'].notna()].copy()
    df = df[df['game_id'].notna()].copy()
    df = df[df['shift_start_game_clock'].notna()].copy()
    df = df[df['shift_end_game_clock'].notna()].copy()
    
    # Ensure shift_end_game_clock > shift_start_game_clock
    df = df[df['shift_end_game_clock'] > df['shift_start_game_clock']].copy()
    
    print(f"OK: Loaded {len(df):,} shift segments")
    print(f"   Unique players: {df['player_id'].nunique():,}")
    print(f"   Unique games: {df['game_id'].nunique():,}")
    
    return df


def load_shots_with_game_clock():
    """
    Load raw_shots data and convert time_remaining_seconds to running game clock.
    
    Returns:
        DataFrame with shot_game_clock column
    """
    print("\n" + "=" * 80)
    print("LOADING SHOTS DATA WITH RUNNING GAME CLOCK")
    print("=" * 80)
    
    all_shots = []
    offset = 0
    batch_size = 1000
    
    while True:
        response = supabase.table('raw_shots').select(
            'id, player_id, game_id, period, time_remaining_seconds, '
            'shooting_talent_adjusted_xg, flurry_adjusted_xg, xg_value, '
            'is_goal, is_empty_net, event_owner_team_id, home_team_id, away_team_id'
        ).range(offset, offset + batch_size - 1).execute()
        
        if not response.data or len(response.data) == 0:
            break
        
        all_shots.extend(response.data)
        
        if len(response.data) < batch_size:
            break
        
        offset += batch_size
        print(f"  Fetched {len(all_shots):,} shots...")
    
    if len(all_shots) == 0:
        print("WARNING: No shots data found.")
        return None
    
    df = pd.DataFrame(all_shots)
    
    # Convert types
    df['player_id'] = pd.to_numeric(df['player_id'], errors='coerce')
    df['game_id'] = pd.to_numeric(df['game_id'], errors='coerce')
    df['period'] = pd.to_numeric(df['period'], errors='coerce')
    df['time_remaining_seconds'] = pd.to_numeric(df['time_remaining_seconds'], errors='coerce')
    df['event_owner_team_id'] = pd.to_numeric(df['event_owner_team_id'], errors='coerce')
    df['home_team_id'] = pd.to_numeric(df['home_team_id'], errors='coerce')
    df['away_team_id'] = pd.to_numeric(df['away_team_id'], errors='coerce')
    
    # Handle xG values with fallback
    df['shooting_talent_adjusted_xg'] = pd.to_numeric(df['shooting_talent_adjusted_xg'], errors='coerce')
    df['flurry_adjusted_xg'] = pd.to_numeric(df['flurry_adjusted_xg'], errors='coerce')
    df['xg_value'] = pd.to_numeric(df['xg_value'], errors='coerce')
    df['xgf_value'] = df['shooting_talent_adjusted_xg'].fillna(
        df['flurry_adjusted_xg'].fillna(df['xg_value'])
    )
    
    # Convert time_remaining_seconds to time_elapsed_seconds, then to running game clock
    # Period length: 20 minutes = 1200 seconds (regulation), 5 minutes = 300 seconds (OT)
    df['period_length_seconds'] = df['period'].apply(lambda p: 1200.0 if p <= 3 else 300.0)
    df['time_elapsed_seconds'] = df['period_length_seconds'] - df['time_remaining_seconds'].fillna(0)
    
    # Calculate running game clock
    df['shot_game_clock'] = df.apply(
        lambda row: calculate_running_game_clock(row['period'], row['time_elapsed_seconds']),
        axis=1
    )
    
    # Remove invalid rows
    df = df[df['player_id'].notna()].copy()
    df = df[df['game_id'].notna()].copy()
    df = df[df['period'].notna()].copy()
    df = df[df['shot_game_clock'].notna()].copy()
    df = df[df['xgf_value'].notna()].copy()
    df = df[df['xgf_value'] > 0].copy()
    
    print(f"OK: Loaded {len(df):,} shots")
    print(f"   Unique players: {df['player_id'].nunique():,}")
    print(f"   Unique games: {df['game_id'].nunique():,}")
    
    return df


def match_shots_to_shifts(df_shifts: pd.DataFrame, df_shots: pd.DataFrame) -> pd.DataFrame:
    """
    Match shots to shifts using running game clock.
    
    For each shot at time T, find all shift segments where:
    shift_start_game_clock <= T < shift_end_game_clock
    
    Args:
        df_shifts: Shift segments with game clock times
        df_shots: Shots with game clock times
    
    Returns:
        DataFrame with shot_id, player_id, team_id, situation, xgf_value, is_shooting_team
    """
    print("\n" + "=" * 80)
    print("MATCHING SHOTS TO SHIFTS USING RUNNING GAME CLOCK")
    print("=" * 80)
    
    print("Matching shots to shifts...")
    print("(This may take a few minutes for large datasets)")
    
    # Group shifts by game for faster lookup
    shifts_by_game = df_shifts.groupby('game_id')
    
    matched_records = []
    shot_count = 0
    
    for game_id, game_shots in df_shots.groupby('game_id'):
        if game_id not in shifts_by_game.groups:
            continue
        
        game_shifts = shifts_by_game.get_group(game_id)
        
        for _, shot in game_shots.iterrows():
            shot_time = shot['shot_game_clock']
            shooting_team_id = shot['event_owner_team_id']
            
            # Find all shift segments that overlap with this shot time
            # Condition: shift_start_game_clock <= shot_time < shift_end_game_clock
            overlapping_shifts = game_shifts[
                (game_shifts['shift_start_game_clock'] <= shot_time) &
                (game_shifts['shift_end_game_clock'] > shot_time)
            ]
            
            if len(overlapping_shifts) == 0:
                continue  # No players on ice (shouldn't happen, but handle gracefully)
            
            # Remove duplicate players (same player might have multiple overlapping shifts)
            # This can happen if a shift was split at a situation boundary
            # We want one record per player per shot
            unique_players = overlapping_shifts.drop_duplicates(subset=['player_id'], keep='first')
            
            # For each unique player on ice, attribute xGF or xGA
            for _, shift in unique_players.iterrows():
                player_id = shift['player_id']
                player_team_id = shift['team_id']
                situation = shift['situation']
                
                # Determine if this is xGF (shooting team) or xGA (defending team)
                is_shooting_team = (player_team_id == shooting_team_id)
                
                matched_records.append({
                    'shot_id': shot['id'],
                    'game_id': game_id,
                    'period': shot['period'],
                    'shot_game_clock': shot_time,
                    'player_id': player_id,
                    'team_id': player_team_id,
                    'situation': situation,
                    'xgf_value': shot['xgf_value'] if is_shooting_team else 0.0,
                    'xga_value': shot['xgf_value'] if not is_shooting_team else 0.0,
                    'is_shooting_team': is_shooting_team,
                    'is_shooter': (player_id == shot['player_id'])
                })
            
            shot_count += 1
            if shot_count % 1000 == 0:
                print(f"  Processed {shot_count:,} shots...")
    
    print(f"\nOK: Matched {shot_count:,} shots to shifts")
    print(f"   Generated {len(matched_records):,} player-shot records")
    
    return pd.DataFrame(matched_records)


def aggregate_on_ice_xgf_xga(df_matched: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate on-ice xGF and xGA by player and situation.
    
    Args:
        df_matched: DataFrame from match_shots_to_shifts
    
    Returns:
        DataFrame with player_id, situation, on_ice_xgf, on_ice_xga
    """
    print("\n" + "=" * 80)
    print("AGGREGATING ON-ICE xGF AND xGA")
    print("=" * 80)
    
    # Aggregate by player and situation
    aggregated = df_matched.groupby(['player_id', 'situation']).agg(
        on_ice_xgf=('xgf_value', 'sum'),
        on_ice_xga=('xga_value', 'sum'),
        shots_for_count=('is_shooting_team', 'sum'),
        shots_against_count=('is_shooting_team', lambda x: (x == False).sum())
    ).reset_index()
    
    print(f"OK: Aggregated stats for {len(aggregated):,} player-situation combinations")
    
    return aggregated


if __name__ == "__main__":
    print("=" * 80)
    print("PHASE 1G: SHOT MATCHING FOR ON-ICE xGF/xGA ATTRIBUTION")
    print("=" * 80)
    
    # Load data
    df_shifts = load_shifts_with_game_clock()
    if df_shifts is None:
        print("ERROR: Could not load shifts data")
        exit(1)
    
    df_shots = load_shots_with_game_clock()
    if df_shots is None:
        print("ERROR: Could not load shots data")
        exit(1)
    
    # Match shots to shifts
    df_matched = match_shots_to_shifts(df_shifts, df_shots)
    
    # Aggregate on-ice xGF/xGA
    df_on_ice_stats = aggregate_on_ice_xgf_xga(df_matched)
    
    # Save results
    output_file = 'on_ice_xgf_xga.csv'
    df_on_ice_stats.to_csv(output_file, index=False)
    print(f"\nOK: Saved on-ice stats to {output_file}")
    
    # Show sample
    if len(df_on_ice_stats) > 0:
        print(f"\n📊 Sample On-Ice Stats (first 10):")
        print(df_on_ice_stats.head(10).to_string(index=False))
    
    print("\n" + "=" * 80)
    print("NEXT STEPS")
    print("=" * 80)
    print("1. Review on_ice_xgf_xga.csv")
    print("2. Update calculate_gar_components.py to use this on-ice data")
    print("3. Recalculate EVD and PPD components with accurate on-ice xGA")
