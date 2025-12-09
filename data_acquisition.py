# data_acquisition.py

import pandas as pd
import os
import requests 
import datetime
from dotenv import load_dotenv # Used to load your .env file
from supabase import create_client, Client

# data_acquisition.py (continued)
import joblib # Tool for loading saved ML models
import math # For calculating distance/angle
import numpy as np 

# --- CRITICAL: LOAD THE TRAINED MODEL ---
# This assumes xg_model.joblib is in the same directory
try:
    XG_MODEL = joblib.load('xg_model.joblib')
    # Load the feature list (saved during training)
    try:
        MODEL_FEATURES = joblib.load('model_features.joblib')
    except FileNotFoundError:
        # Fallback to default if feature list not found
        MODEL_FEATURES = ['distance', 'angle', 'is_rebound', 'shot_type_encoded', 'is_power_play', 'score_differential']
    # Load the shot type encoder
    try:
        SHOT_TYPE_ENCODER = joblib.load('shot_type_encoder.joblib')
    except FileNotFoundError:
        print("WARNING: shot_type_encoder.joblib not found. Shot type encoding may fail.")
        SHOT_TYPE_ENCODER = None
except FileNotFoundError:
    print("ERROR: xg_model.joblib not found. Please run model_trainer.py first!")
    exit()

# Define the center of the net coordinates for calculation (in standard NHL coordinates)
NET_X, NET_Y = 89, 0

# --- 1. INITIAL SETUP ---
# Load variables from the .env file (automatically finds the file)
load_dotenv()

# CRITICAL FIX: Use the VITE_ names found in your .env file
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# The Service Role Key uses a different name (without VITE_ prefix)
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# Base URL for the new NHL API (used for game center/PBP)
NHL_BASE_URL = "https://api-web.nhle.com/v1" 

def parse_time_to_seconds(time_str):
    """Convert time string (MM:SS) to total seconds for time difference calculations."""
    if not time_str or ':' not in time_str:
        return 0
    try:
        parts = time_str.split(':')
        minutes = int(parts[0])
        seconds = int(parts[1])
        return minutes * 60 + seconds
    except (ValueError, IndexError):
        return 0

def calculate_time_difference(prev_play, current_play, max_period=3):
    """
    Calculate time difference between two plays in seconds.
    Returns: time difference in seconds, or None if plays are in different periods
    or time cannot be calculated.
    
    Note: timeInPeriod counts UP from 00:00, so later plays have higher values.
    If prev_play is at 16:07 and current_play is at 16:16, that's 9 seconds later.
    """
    prev_period = prev_play.get('periodDescriptor', {}).get('number', 0)
    curr_period = current_play.get('periodDescriptor', {}).get('number', 0)
    
    # If different periods, not a rebound (too much time passed)
    if prev_period != curr_period:
        return None
    
    prev_time = prev_play.get('timeInPeriod', '')
    curr_time = current_play.get('timeInPeriod', '')
    
    prev_seconds = parse_time_to_seconds(prev_time)
    curr_seconds = parse_time_to_seconds(curr_time)
    
    if prev_seconds is None or curr_seconds is None or prev_seconds == 0 or curr_seconds == 0:
        return None
    
    # Time difference: current play happens AFTER previous play
    # So current time should be greater than previous time
    # Example: 16:07 -> 16:16 = 9 seconds
    time_diff = curr_seconds - prev_seconds
    
    # If negative, previous play happened after current (shouldn't happen in sorted order)
    # If too large (> 60 seconds), probably not a rebound
    if time_diff < 0 or time_diff > 60:
        return None
    
    return time_diff

def get_finished_game_ids(date_str=None):
    """Fetches list of finished games for a given date."""
    date_to_check = date_str if date_str else datetime.date.today().strftime('%Y-%m-%d')
    schedule_url = f"{NHL_BASE_URL}/schedule/{date_to_check}"
    
    try:
        response = requests.get(schedule_url)
        response.raise_for_status() # Raise exception for bad status codes (4xx or 5xx)
        schedule_data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching schedule: {e}")
        return []

    finished_game_ids = []
    # Loop through the schedule data to find games that are FINAL (check against API status)
    # The actual status code varies, but 'FINAL' or 'OFF' usually indicate completion.
    for date_entry in schedule_data.get('gameWeek', []):
        for game in date_entry.get('games', []):
            # Check if the game status is one of the final states
            game_state = game.get('gameState')
            if game_state in ['FINAL', 'OFF', 'F']: 
                 # We need the game ID (e.g., 2024020123)
                finished_game_ids.append(game.get('id')) 
    
    return finished_game_ids

def scrape_pbp_and_process():
    """Scrapes raw PBP for all finished games and processes data."""
    # Temporarily use a known date with games for testing (format: YYYY-MM-DD)
    # TODO: Change back to yesterday's date after testing
    game_ids = get_finished_game_ids(date_str='2025-12-07')  # Example date with known games
    # game_ids = get_finished_game_ids(date_str=(datetime.date.today() - datetime.timedelta(days=1)).strftime('%Y-%m-%d'))
    
    all_shot_data = []

    for game_id in game_ids:
        # PBP Endpoint: https://api-web.nhle.com/v1/gamecenter/{game_id}/play-by-play
        pbp_url = f"{NHL_BASE_URL}/gamecenter/{game_id}/play-by-play"
        
        try:
            response = requests.get(pbp_url)
            raw_data = response.json()
            
            # --- FEATURE ENGINEERING: Extracting Shot Coordinates and Calculating Features ---
            print(f"Processing Play-by-Play for Game ID: {game_id}...")
            
            # We assume the NHL JSON structure has a 'plays' list
            # typeCode values: 505 = goal, 506 = shot-on-goal, 507 = missed-shot
            # Plays are already sorted by sortOrder, so we can track previous plays for rebound detection
            previous_play = None  # Track previous play for rebound detection
            
            for play in raw_data.get('plays', []):
                type_code = play.get('typeCode')
                # Only process shots on goal (506), goals (505), and missed shots (507)
                if type_code not in [505, 506, 507]: 
                    continue
                
                # Get details (coordinates and player info are in details)
                details = play.get('details', {})
                if not details:
                    continue
                
                # Get coordinates from details (xCoord, yCoord)
                shot_coord_x = details.get('xCoord', 0)
                shot_coord_y = details.get('yCoord', 0)
                
                # Get player ID - use scoringPlayerId for goals, shootingPlayerId for shots
                if type_code == 505:  # Goal
                    player_id = details.get('scoringPlayerId')
                else:  # Shot (506 or 507)
                    player_id = details.get('shootingPlayerId')
                
                if not player_id or shot_coord_x == 0:  # Skip if no player or invalid coordinates
                    continue
                
                # CRITICAL CHECK: NHL coordinates are centered. We must flip coordinates 
                # if the team is shooting into the other net (x < 0) for consistent calculation.
                if shot_coord_x < 0:
                    shot_coord_x = -shot_coord_x
                    shot_coord_y = -shot_coord_y
                
                # ============================================================
                # FEATURE ENGINEERING: Calculate all 6 model inputs
                # ============================================================
                
                # FEATURE 1: DISTANCE (Continuous, 0-100+ feet)
                # What: Euclidean distance from shot location to center of net
                # Why: Closer shots = higher goal probability (MOST IMPORTANT FEATURE: 33.2%)
                # Range: Typically 10-80 feet in NHL
                # Formula: √((89 - x)² + (0 - y)²) where (89, 0) is net center
                distance = math.sqrt((NET_X - shot_coord_x)**2 + (NET_Y - shot_coord_y)**2)

                # FEATURE 2: ANGLE (Continuous, 0-90 degrees)
                # What: Angle from center of net to shot location
                # Why: Shots from center (low angle) = higher goal probability (14.5% importance)
                # Range: 0° = directly in front, 90° = from the side
                # Formula: Calculate angle from center line, ensuring 0-90° range
                # Use absolute value of y-coordinate to get angle from center
                dx = abs(NET_X - shot_coord_x)  # Horizontal distance from net
                dy = abs(shot_coord_y - NET_Y)  # Vertical distance from center
                
                if dx == 0:
                    angle = 90.0  # Directly to the side
                else:
                    # Calculate angle from center line (0° = straight on, 90° = from side)
                    angle = math.degrees(math.atan2(dy, dx))
                
                # Ensure angle is in valid range (0-90 degrees)
                angle = max(0.0, min(90.0, angle))
                
                # FEATURE 3: IS_REBOUND (Binary: 0 or 1)
                # What: Whether this shot came immediately after a save/rebound
                # Why: Rebound shots catch goalies out of position (17.4% importance - 2nd most important!)
                # Values: 0 = normal shot, 1 = rebound shot
                # Detection Logic:
                #   1. Previous play must be a shot-on-goal (typeCode 506) that was NOT a goal
                #   2. Same team must be shooting (eventOwnerTeamId matches)
                #   3. Time difference must be < 3 seconds
                #   4. Must be in same period
                is_rebound = 0
                
                if previous_play:
                    prev_type_code = previous_play.get('typeCode')
                    prev_details = previous_play.get('details', {})
                    prev_team_id = prev_details.get('eventOwnerTeamId')
                    current_team_id = details.get('eventOwnerTeamId')
                    
                    # Check if previous play was a shot-on-goal (506) that was saved (not a goal)
                    if prev_type_code == 506:  # Shot on goal
                        # Previous shot was saved (not a goal, typeCode 505)
                        # Check if same team is shooting (rebound opportunity)
                        if prev_team_id and current_team_id and prev_team_id == current_team_id:
                            # Calculate time difference
                            time_diff = calculate_time_difference(previous_play, play)
                            if time_diff is not None and time_diff < 3.0:  # Within 3 seconds
                                is_rebound = 1
                
                # Update previous_play for next iteration (only track shot-related plays)
                previous_play = play
                
                # FEATURE 4: SHOT_TYPE_ENCODED (Categorical, encoded as integer)
                # What: Type of shot taken (wrist, snap, slap, etc.)
                # Why: Some shot types are more effective (8.5% importance)
                # Possible Values from NHL API:
                #   - 'wrist' (most common - 407 in sample data)
                #   - 'snap' (very common - 348 in sample)
                #   - 'slap' (common - 129 in sample)
                #   - 'tip-in' (common - 128 in sample)
                #   - 'backhand' (less common - 78 in sample)
                #   - 'deflected' (rare - 13 in sample)
                #   - 'wrap-around' (rare - 8 in sample)
                #   - 'bat' (very rare - 6 in sample)
                #   - 'between-legs' (very rare - 1 in sample)
                #   - 'poke' (very rare - 1 in sample)
                # Encoding: Converted to numbers (0-6) using LabelEncoder from training
                shot_type_raw = details.get('shotType', '').lower() if details.get('shotType') else ''
                # Map common shot type variations to standard names
                shot_type_mapping = {
                    'wrist': 'wrist',
                    'snap': 'snap',
                    'slap': 'slap',
                    'backhand': 'backhand',
                    'tip-in': 'tip-in',
                    'tip': 'tip-in',
                    'deflected': 'deflected',
                    'deflection': 'deflected',
                    'wrap-around': 'wrap-around',
                    'wrap': 'wrap-around',
                    'between-legs': 'between-legs',
                    'bat': 'bat',
                    'poke': 'poke'
                }
                shot_type_standard = shot_type_mapping.get(shot_type_raw, 'wrist')  # Default to 'wrist' if unknown
                
                # Encode shot type using the label encoder
                if SHOT_TYPE_ENCODER:
                    try:
                        # Handle unknown shot types by defaulting to 'wrist'
                        if shot_type_standard in SHOT_TYPE_ENCODER.classes_:
                            shot_type_encoded = SHOT_TYPE_ENCODER.transform([shot_type_standard])[0]
                        else:
                            # Default to 'wrist' if shot type not in training data
                            if 'wrist' in SHOT_TYPE_ENCODER.classes_:
                                shot_type_encoded = SHOT_TYPE_ENCODER.transform(['wrist'])[0]
                            else:
                                shot_type_encoded = 0  # Fallback to first class
                    except Exception as e:
                        shot_type_encoded = 0  # Fallback on error
                else:
                    shot_type_encoded = 0  # Fallback if encoder not loaded
                
                # FEATURE 5: IS_POWER_PLAY (Binary: 0 or 1)
                # What: Whether the shot occurred during a power play
                # Why: Power plays create better scoring opportunities (16.7% importance - 3rd most important!)
                # Values: 0 = even strength or shorthanded, 1 = power play
                # Detection: Parsed from situation_code field
                # Power Play Codes: '5v4', '5v3', '4v3', '6v4', '6v3' (man advantage)
                # Even Strength: '5v5' (normal play)
                # Shorthanded: '4v5', '3v5', '3v4' (man disadvantage)
                situation_code = str(play.get('situationCode', ''))
                is_power_play = 1 if any(pp in situation_code for pp in ['5v4', '5v3', '4v3', '6v4', '6v3']) else 0
                
                # FEATURE 6: SCORE_DIFFERENTIAL (Integer, typically -5 to +5)
                # What: Score difference from shooting team's perspective at time of shot
                # Why: Trailing teams take more risks, leading teams more conservative (9.7% importance)
                # Range: Negative = trailing, 0 = tied, Positive = leading
                # Example: If team is down 2-1, score_differential = -1 (trailing by 1)
                # Calculation: Get scores at time of event, determine shooting team, calculate difference
                away_score_at_event = details.get('awayScore', 0) or 0
                home_score_at_event = details.get('homeScore', 0) or 0
                event_owner_team_id = details.get('eventOwnerTeamId')  # Which team is shooting
                home_team_id = raw_data.get('homeTeam', {}).get('id')
                # Calculate from shooting team's perspective
                if event_owner_team_id == home_team_id:
                    # Home team shooting: positive = home leading, negative = home trailing
                    score_differential = home_score_at_event - away_score_at_event
                else:
                    # Away team shooting: positive = away leading, negative = away trailing
                    score_differential = away_score_at_event - home_score_at_event

                # Append the features required by the model
                all_shot_data.append({
                    'playerId': player_id,
                    'game_id': game_id,
                    # THESE ARE THE FEATURES YOUR MODEL USES:
                    'distance': distance,
                    'angle': angle,
                    'is_rebound': is_rebound,
                    'shot_type_encoded': shot_type_encoded,
                    'is_power_play': is_power_play,
                    'score_differential': score_differential,
                })
            
        except Exception as e:
            print(f"Could not process Game ID {game_id}: {e}")
            continue

    # ... (End of the loop where you collect all shot features into all_shot_data)

    # --- PREDICTION AND AGGREGATION ---
    if not all_shot_data:
        print("No shots found to process.")
        return None
        
    df_shots = pd.DataFrame(all_shot_data)

    # 1. Select the exact features the model was trained on
    # Using the defined list (MODEL_FEATURES) ensures the order is correct for the model
    X_predict = df_shots[MODEL_FEATURES] 

    # 2. Predict the xG probability
    # XG_MODEL.predict_proba returns [[Prob of No Goal, Prob of Goal]]. 
    # We take the second column [:, 1] because that's the probability of a GOAL (the xG value)
    raw_xg = XG_MODEL.predict_proba(X_predict)[:, 1]
    
    # 3. CALIBRATE xG values to realistic ranges
    # The model was trained on synthetic data and predicts too high values.
    # Real NHL shots typically have xG of 0.05-0.15, rarely above 0.30.
    # Validation shows we're ~8.5x too high, so we need stronger calibration.
    # Method: Use a power function to compress high values while preserving relative differences
    # Formula: calibrated_xg = raw_xg^calibration_factor
    # Higher calibration_factor = more compression
    # Factor of 3.5: 0.999 -> 0.996, 0.5 -> 0.088, 0.1 -> 0.0002
    CALIBRATION_FACTOR = 3.5  # Increased from 2.5 based on validation (target: ~0.2 xG/game avg)
    df_shots['xG_Value'] = np.power(raw_xg, CALIBRATION_FACTOR)
    
    # Additional cap: No single shot should exceed 0.50 xG (50% chance)
    # Even the best shots (breakaways, empty nets) rarely exceed this
    df_shots['xG_Value'] = df_shots['xG_Value'].clip(upper=0.50)
    
    # Scale down further to match staging data average (~0.2 xG/game)
    # Our average is ~1.165, staging is ~0.2, so scale by ~0.17
    SCALE_FACTOR = 0.17  # Brings 1.165 avg down to ~0.2
    df_shots['xG_Value'] = df_shots['xG_Value'] * SCALE_FACTOR 

    # 3. Aggregate xG per player for the final stats table
    # This groups all the calculated xG values and sums them up per player and per game.
    final_stats_df = df_shots.groupby(['playerId', 'game_id']).agg(
        # I_F_xGoals (Individual For Expected Goals) is the sum of all xG values for the player's shots
        I_F_xGoals=('xG_Value', 'sum')
        # NOTE: This is where you would add the complex logic for GSAx, OnIce_xGoalsPercentage, etc.
        # Removed total_shots as it's not in the database schema
    ).reset_index()

    print(f"Calculated xG for {len(final_stats_df)} unique player/game combinations.")
    return final_stats_df




# --- 2. MAIN EXECUTION ---
if __name__ == "__main__":
    print("Starting Advanced Stats Pipeline...")
    final_stats_df = scrape_pbp_and_process()
    
    if final_stats_df is not None and not final_stats_df.empty:
        print(f"Data processing complete. {len(final_stats_df)} records ready for upload.")
        
        # --- UPLOAD TO SUPABASE ---
        data_to_upload = final_stats_df.to_dict(orient='records')
        
        try:
            # Upsert (insert or update) the newly calculated stats into the raw_player_stats table
            # This handles duplicates by updating existing records instead of failing
            # NOTE: Your Supabase table must have a unique constraint on (playerId, game_id)
            response = supabase.table('raw_player_stats').upsert(
                data_to_upload,
                on_conflict='playerId,game_id'  # Update if this combination already exists
            ).execute()
            print(f"Successfully uploaded/updated {len(data_to_upload)} advanced stats records to Supabase.")
        except Exception as e:
            print(f"ERROR: Could not upload data to Supabase: {e}")
            print(f"Error details: {e}")

