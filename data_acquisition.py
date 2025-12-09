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
    # The list of features the model was trained on:
    MODEL_FEATURES = ['distance', 'angle', 'is_rebound'] 
except FileNotFoundError:
    print("ERROR: xg_model.joblib not found. Please run model_trainer.py first!")
    exit()

# Define the center of the net coordinates for calculation (in standard NHL coordinates)
NET_X, NET_Y = 89, 0

# --- 1. INITIAL SETUP ---
# Load variables from the .env file (automatically finds the file)
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role Key for backend tasks

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# Base URL for the new NHL API (used for game center/PBP)
NHL_BASE_URL = "https://api-web.nhle.com/v1" 

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
            if game.get('gameState') == 'FINAL': 
                 # We need the game ID (e.g., 2024020123)
                finished_game_ids.append(game.get('id')) 
    
    return finished_game_ids

def scrape_pbp_and_process():
    """Scrapes raw PBP for all finished games and processes data."""
    # NOTE: For real testing, you might use yesterday's date to ensure data is available
    game_ids = get_finished_game_ids(date_str=(datetime.date.today() - datetime.timedelta(days=1)).strftime('%Y-%m-%d'))
    
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
            for play in raw_data.get('plays', []):
                # Only process unblocked shots that are on goal or missed (GOAL/SHOT)
                if play.get('typeCode') not in ['SHOT', 'GOAL']: 
                    continue
                
                # Ensure coordinates and player info exist
                coordinates = play.get('coordinates')
                player_id = play.get('details', {}).get('eventOwnerTeamId') # Player is usually the event owner
                
                if not coordinates or not player_id:
                    continue

                shot_coord_x = coordinates.get('x', 0) 
                shot_coord_y = coordinates.get('y', 0)
                
                # CRITICAL CHECK: NHL coordinates are centered. We must flip coordinates 
                # if the team is shooting into the other net (x < 0) for consistent calculation.
                if shot_coord_x < 0:
                    shot_coord_x = -shot_coord_x
                    shot_coord_y = -shot_coord_y
                
                # 1. Calculate Distance (using the Euclidean distance formula)
                distance = math.sqrt((NET_X - shot_coord_x)**2 + (NET_Y - shot_coord_y)**2)

                # 2. Calculate Angle (using arctangent function - simplified)
                angle = math.degrees(math.atan2(abs(shot_coord_y - NET_Y), (NET_X - shot_coord_x)))
                
                # 3. Rebound identification (Placeholder logic - actual logic is more complex)
                # We will use a placeholder for now, as real rebound logic requires checking previous plays.
                is_rebound = 1 if 'rebound' in play.get('tags', []) else 0 

                # Append the features required by the model
                all_shot_data.append({
                    'playerId': player_id,
                    'game_id': game_id,
                    # THESE ARE THE FEATURES YOUR MODEL USES:
                    'distance': distance,
                    'angle': angle,
                    'is_rebound': is_rebound,
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
    df_shots['xG_Value'] = XG_MODEL.predict_proba(X_predict)[:, 1] 

    # 3. Aggregate xG per player for the final stats table
    # This groups all the calculated xG values and sums them up per player and per game.
    final_stats_df = df_shots.groupby(['playerId', 'game_id']).agg(
        # I_F_xGoals (Individual For Expected Goals) is the sum of all xG values for the player's shots
        I_F_xGoals=('xG_Value', 'sum'),  
        total_shots=('playerId', 'size') # Optional: Count of shots to verify data
        # NOTE: This is where you would add the complex logic for GSAx, OnIce_xGoalsPercentage, etc.
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
            # Insert the newly calculated stats into the raw_player_stats table
            # NOTE: Your Supabase table name for raw stats must match this!
            response = supabase.table('raw_player_stats').insert(data_to_upload).execute()
            print("Successfully uploaded advanced stats to Supabase.")
        except Exception as e:
            print(f"ERROR: Could not upload data to Supabase: {e}")

