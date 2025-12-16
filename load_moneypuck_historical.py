#!/usr/bin/env python3
"""
load_moneypuck_historical.py
Load historical MoneyPuck shot data and process it through our pipeline.

This script:
1. Loads MoneyPuck CSV files for 2023 and 2024 seasons
2. Maps MoneyPuck columns to our raw_shots table schema
3. Processes through xG model pipeline
4. Saves to database with proper season tracking
"""

import pandas as pd
import numpy as np
import sys
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from season_utils import derive_season_from_game_id
import joblib
import math

load_dotenv()

# Supabase client (initialized in save_to_database)
supabase: Client = None

# Load models (same as data_acquisition.py)
try:
    XG_MODEL = joblib.load('xg_model_moneypuck.joblib')
    MODEL_FEATURES = joblib.load('model_features_moneypuck.joblib')
    print("✅ Loaded MoneyPuck-aligned xG model")
except FileNotFoundError:
    print("ERROR: xG model files not found!")
    sys.exit(1)

try:
    SHOT_TYPE_ENCODER = joblib.load('shot_type_encoder.joblib')
except FileNotFoundError:
    print("WARNING: shot_type_encoder.joblib not found")
    SHOT_TYPE_ENCODER = None

# Constants
NET_X = 89
NET_Y = 0


def map_moneypuck_to_raw_shots(df_mp):
    """
    Map MoneyPuck CSV data to our raw_shots table schema.
    
    Args:
        df_mp: DataFrame from MoneyPuck CSV
        
    Returns:
        DataFrame with columns matching raw_shots table
    """
    print(f"Mapping {len(df_mp):,} MoneyPuck shots to raw_shots schema...")
    
    # Initialize output DataFrame
    records = []
    
    for idx, row in df_mp.iterrows():
        # Core identifiers
        # Note: MoneyPuck uses different game_id format (e.g., 20001 instead of 2023010065)
        # We'll use MoneyPuck's game_id directly for now
        game_id_mp = row.get('game_id')
        if pd.isna(game_id_mp):
            continue
        game_id = int(game_id_mp)
        
        player_id = int(row.get('shooterPlayerId', 0)) if pd.notna(row.get('shooterPlayerId')) else None
        
        if not game_id or not player_id:
            continue
        
        # Use MoneyPuck season directly (it's already in the data)
        season = row.get('season')
        if pd.isna(season):
            # Fallback: try to derive from game_id (though MoneyPuck format is different)
            season = derive_season_from_game_id(game_id)
            if season is None:
                # Default to 2023 if we can't determine
                season = 2023
        else:
            season = int(season)
        
        # Coordinates (MoneyPuck uses adjusted coordinates)
        shot_x = float(row.get('xCordAdjusted', 0)) if pd.notna(row.get('xCordAdjusted')) else 70.0
        shot_y = float(row.get('yCordAdjusted', 0)) if pd.notna(row.get('yCordAdjusted')) else 0.0
        
        # Ensure coordinates are in NHL format (flip if needed)
        if shot_x < 0:
            shot_x = -shot_x
            shot_y = -shot_y
        
        # Shot type and event
        shot_type_raw = str(row.get('shotType', '')).upper() if pd.notna(row.get('shotType')) else None
        goal = int(row.get('goal', 0)) if pd.notna(row.get('goal')) else 0
        
        # Determine shot_type_code from MoneyPuck data
        shot_was_on_goal = int(row.get('shotWasOnGoal', 0)) if pd.notna(row.get('shotWasOnGoal')) else 0
        if goal == 1:
            shot_type_code = 505  # Goal
        elif shot_was_on_goal == 1:
            shot_type_code = 506  # Shot on goal
        else:
            shot_type_code = 507  # Missed shot
        
        # Distance and angle (MoneyPuck already calculated)
        distance = float(row.get('shotDistance', 0)) if pd.notna(row.get('shotDistance')) else 0.0
        angle = float(row.get('shotAngleAdjusted', 0)) if pd.notna(row.get('shotAngleAdjusted')) else 0.0
        
        # If distance/angle missing, calculate from coordinates
        if distance == 0 or angle == 0:
            distance = math.sqrt((NET_X - shot_x)**2 + (NET_Y - shot_y)**2)
            dx = abs(NET_X - shot_x)
            dy = abs(shot_y - NET_Y)
            if dx == 0:
                angle = 90.0
            else:
                angle = math.degrees(math.atan2(dy, dx))
            angle = max(0.0, min(90.0, angle))
        
        # Rebound detection
        is_rebound = int(row.get('shotRebound', 0)) if pd.notna(row.get('shotRebound')) else 0
        is_rebound = bool(is_rebound)
        
        # Power play detection
        home_skaters = int(row.get('homeSkatersOnIce', 5)) if pd.notna(row.get('homeSkatersOnIce')) else 5
        away_skaters = int(row.get('awaySkatersOnIce', 5)) if pd.notna(row.get('awaySkatersOnIce')) else 5
        is_power_play = (home_skaters != 5 or away_skaters != 5)
        
        # Score differential
        home_score = int(row.get('homeTeamGoals', 0)) if pd.notna(row.get('homeTeamGoals')) else 0
        away_score = int(row.get('awayTeamGoals', 0)) if pd.notna(row.get('awayTeamGoals')) else 0
        is_home_team = int(row.get('isHomeTeam', 0)) if pd.notna(row.get('isHomeTeam')) else 0
        
        if is_home_team:
            score_differential = home_score - away_score
        else:
            score_differential = away_score - home_score
        
        # Shot type encoding
        shot_type_encoded = 0
        if SHOT_TYPE_ENCODER and shot_type_raw:
            try:
                shot_type_encoded = int(SHOT_TYPE_ENCODER.transform([shot_type_raw])[0])
            except:
                pass
        
        # Goalie info
        goalie_id = int(row.get('goalieIdForShot', 0)) if pd.notna(row.get('goalieIdForShot')) else None
        goalie_name = str(row.get('goalieNameForShot', '')) if pd.notna(row.get('goalieNameForShot')) else None
        
        # Period and time
        period = int(row.get('period', 1)) if pd.notna(row.get('period')) else 1
        time_in_period = str(row.get('time', '')) if pd.notna(row.get('time')) else None
        
        # Last event features
        last_event_category = str(row.get('lastEventCategory', '')) if pd.notna(row.get('lastEventCategory')) else None
        last_event_x = float(row.get('lastEventxCord_adjusted', 0)) if pd.notna(row.get('lastEventxCord_adjusted')) else None
        last_event_y = float(row.get('lastEventyCord_adjusted', 0)) if pd.notna(row.get('lastEventyCord_adjusted')) else None
        distance_from_last_event = float(row.get('distanceFromLastEvent', 0)) if pd.notna(row.get('distanceFromLastEvent')) else None
        time_since_last_event = float(row.get('timeSinceLastEvent', 0)) if pd.notna(row.get('timeSinceLastEvent')) else None
        speed_from_last_event = float(row.get('speedFromLastEvent', 0)) if pd.notna(row.get('speedFromLastEvent')) else None
        
        # Create base record
        record = {
            'game_id': game_id,
            'player_id': player_id,
            'season': season,
            'shot_x': shot_x,
            'shot_y': shot_y,
            'shot_type_code': shot_type_code,
            'shot_type': shot_type_raw,
            'is_goal': bool(goal),
            'distance': distance,
            'angle': angle,
            'shot_angle_adjusted': abs(angle),
            'is_rebound': is_rebound,
            'is_power_play': is_power_play,
            'score_differential': score_differential,
            'shot_type_encoded': shot_type_encoded,
            'goalie_id': goalie_id,
            'goalie_name': goalie_name,
            'period': period,
            'time_in_period': time_in_period,
            'last_event_category': last_event_category,
            'last_event_x': last_event_x,
            'last_event_y': last_event_y,
            'distance_from_last_event': distance_from_last_event,
            'time_since_last_event': time_since_last_event,
            'speed_from_last_event': speed_from_last_event,
            'home_skaters_on_ice': home_skaters,
            'away_skaters_on_ice': away_skaters,
            'team_code': str(row.get('teamCode', '')) if pd.notna(row.get('teamCode')) else None,
            'is_home_team': bool(is_home_team),
            'home_score': home_score,
            'away_score': away_score,
        }
        
        records.append(record)
    
    df_mapped = pd.DataFrame(records)
    print(f"✅ Mapped {len(df_mapped):,} shots")
    
    return df_mapped


def process_through_xg_model(df):
    """
    Process shots through xG model pipeline.
    
    Args:
        df: DataFrame with mapped MoneyPuck data
        
    Returns:
        DataFrame with xG predictions added
    """
    print(f"Processing {len(df):,} shots through xG model...")
    
    # Prepare features for model
    # Note: We'll use MoneyPuck's xGoal as base, but recalculate with our model for consistency
    model_inputs = []
    
    for idx, row in df.iterrows():
        # Build feature vector matching MODEL_FEATURES
        features = {}
        
        # Core features
        features['distance'] = row.get('distance', 0)
        features['angle'] = row.get('angle', 0)
        features['is_rebound'] = 1 if row.get('is_rebound') else 0
        features['shot_type_encoded'] = row.get('shot_type_encoded', 0)
        features['is_power_play'] = 1 if row.get('is_power_play') else 0
        features['score_differential'] = row.get('score_differential', 0)
        
        # Additional features (use defaults if missing)
        features['is_slot_shot'] = 0  # Would need to calculate from coordinates
        features['has_pass_before_shot'] = 0  # MoneyPuck doesn't track passes the same way
        features['pass_lateral_distance'] = 0
        features['pass_to_net_distance'] = 0
        features['pass_zone_encoded'] = 0
        features['pass_immediacy_score'] = 0
        features['goalie_movement_score'] = 0
        features['pass_quality_score'] = 0
        
        # Time since powerplay (use 0 if not on PP)
        features['time_since_powerplay_started'] = 0 if not row.get('is_power_play') else 60
        
        model_inputs.append([features.get(f, 0) for f in MODEL_FEATURES])
    
    # Predict xG (XGBRegressor outputs xG directly, not probability)
    X = np.array(model_inputs)
    xg_predictions = XG_MODEL.predict(X)  # Direct xG prediction
    
    # Ensure xG values are in valid range [0, 1]
    xg_predictions = np.clip(xg_predictions, 0.0, 1.0)
    
    df['xg_value'] = xg_predictions
    
    print(f"✅ Calculated xG for {len(df):,} shots")
    print(f"   Mean xG: {df['xg_value'].mean():.4f}")
    print(f"   Max xG: {df['xg_value'].max():.4f}")
    
    return df


def save_to_database(df):
    """
    Save processed shots to raw_shots table.
    
    Args:
        df: DataFrame with processed shots
    """
    global supabase
    
    # Initialize Supabase client if not already done
    if supabase is None:
        # Use same variable names as data_acquisition.py
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print("ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
            return
        
        supabase = create_client(supabase_url, supabase_key)
    
    print(f"\nSaving {len(df):,} shots to database...")
    
    # CRITICAL FIX: Deduplicate based on unique constraint BEFORE batching
    # The unique constraint is: (game_id, player_id, shot_x, shot_y, shot_type_code)
    # This prevents "ON CONFLICT DO UPDATE command cannot affect row a second time" errors
    print(f"  🔍 Deduplicating {len(df):,} shot records...")
    initial_count = len(df)
    df_deduplicated = df.drop_duplicates(
        subset=['game_id', 'player_id', 'shot_x', 'shot_y', 'shot_type_code'],
        keep='first',  # Keep first occurrence of duplicates
        inplace=False
    )
    duplicates_removed = initial_count - len(df_deduplicated)
    
    if duplicates_removed > 0:
        print(f"  ⚠️  Removed {duplicates_removed:,} duplicate shot record(s) before upload")
    
    # Convert to records
    records = df_deduplicated.to_dict('records')
    
    # Clean NaN values
    for record in records:
        for key, value in list(record.items()):
            if pd.isna(value):
                record[key] = None
    
    # Batch upsert
    BATCH_SIZE = 1000
    total_saved = 0
    
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (len(records) + BATCH_SIZE - 1) // BATCH_SIZE
        
        try:
            response = supabase.table('raw_shots').upsert(
                batch,
                on_conflict='game_id,player_id,shot_x,shot_y,shot_type_code'
            ).execute()
            
            total_saved += len(batch)
            print(f"  📦 Batch {batch_num}/{total_batches}: Processed {len(batch)} records...")
            
        except Exception as e:
            print(f"  ⚠️  Error processing batch {batch_num}: {e}")
            # Try individual inserts for this batch
            for record in batch:
                try:
                    supabase.table('raw_shots').upsert(
                        [record],
                        on_conflict='game_id,player_id,shot_x,shot_y,shot_type_code'
                    ).execute()
                    total_saved += 1
                except:
                    pass
    
    print(f"✅ Successfully saved {total_saved:,} shot records to raw_shots table")


def process_moneypuck_file(filepath, season_label):
    """
    Process a single MoneyPuck CSV file.
    
    Args:
        filepath: Path to MoneyPuck CSV file
        season_label: Label for this season (e.g., "2023-24")
    """
    print("=" * 80)
    print(f"PROCESSING MONEYPUCK DATA: {season_label}")
    print("=" * 80)
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return
    
    print(f"Loading {filepath}...")
    df_mp = pd.read_csv(filepath)
    print(f"✅ Loaded {len(df_mp):,} shots from MoneyPuck")
    
    # Map to our schema
    df_mapped = map_moneypuck_to_raw_shots(df_mp)
    
    if len(df_mapped) == 0:
        print("❌ No shots mapped successfully")
        return
    
    # Process through xG model
    df_processed = process_through_xg_model(df_mapped)
    
    # Save to database
    save_to_database(df_processed)
    
    print(f"\n✅ Completed processing {season_label}")
    print(f"   Total shots processed: {len(df_processed):,}")


def main():
    """Main function to process both MoneyPuck files."""
    print("=" * 80)
    print("LOADING HISTORICAL MONEYPUCK DATA")
    print("=" * 80)
    
    # Process 2023 season
    process_moneypuck_file(
        'data/moneypuck_shots_2023.csv',
        '2023-24'
    )
    
    # Process 2024 season
    process_moneypuck_file(
        'data/moneypuck_shots_2024.csv',
        '2024-25'
    )
    
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()

