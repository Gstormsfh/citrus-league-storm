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

# Import calculation functions for derived features
try:
    from feature_calculations import calculate_last_event_shot_metrics
except ImportError:
    # Fallback if feature_calculations not available
    def calculate_last_event_shot_metrics(type_code, x, y):
        """Fallback function if feature_calculations not available."""
        if type_code in [505, 506, 507] and x and y:
            NET_X = 89
            NET_Y = 0
            distance = math.sqrt((NET_X - x)**2 + (NET_Y - y)**2)
            dx = abs(NET_X - x)
            dy = abs(y - NET_Y)
            if dx == 0:
                angle = 90.0
            else:
                angle = math.degrees(math.atan2(dy, dx))
            angle = max(0.0, min(90.0, angle))
            return angle, distance
        return None, None 

# --- CRITICAL: LOAD THE TRAINED MODEL ---
# Try to load MoneyPuck-aligned model first, fallback to old model
try:
    # Try MoneyPuck-aligned model (new, recommended)
    try:
        XG_MODEL = joblib.load('xg_model_moneypuck.joblib')
        MODEL_FEATURES = joblib.load('model_features_moneypuck.joblib')
        print("✅ Loaded MoneyPuck-aligned xG model")
        USE_MONEYPUCK_MODEL = True
    except FileNotFoundError:
        # Fallback to old model
        XG_MODEL = joblib.load('xg_model.joblib')
        try:
            MODEL_FEATURES = joblib.load('model_features.joblib')
        except FileNotFoundError:
            # Fallback to default if feature list not found
            MODEL_FEATURES = ['distance', 'angle', 'is_rebound', 'shot_type_encoded', 'is_power_play', 'score_differential',
                             'is_slot_shot',
                             'has_pass_before_shot', 'pass_lateral_distance', 'pass_to_net_distance',
                             'pass_zone_encoded', 'pass_immediacy_score', 'goalie_movement_score', 'pass_quality_score']
        print("⚠️  Using old xG model. Consider retraining with MoneyPuck targets.")
        USE_MONEYPUCK_MODEL = False
    
    # Load the last_event_category encoder (for MoneyPuck model)
    try:
        LAST_EVENT_CATEGORY_ENCODER = joblib.load('last_event_category_encoder.joblib')
    except FileNotFoundError:
        print("WARNING: last_event_category_encoder.joblib not found. Will encode on-the-fly if needed.")
        LAST_EVENT_CATEGORY_ENCODER = None
    
    # Load the shot type encoder
    try:
        SHOT_TYPE_ENCODER = joblib.load('shot_type_encoder.joblib')
    except FileNotFoundError:
        print("WARNING: shot_type_encoder.joblib not found. Shot type encoding may fail.")
        SHOT_TYPE_ENCODER = None
    
    # Load the pass zone encoder
    try:
        PASS_ZONE_ENCODER = joblib.load('pass_zone_encoder.joblib')
    except FileNotFoundError:
        print("WARNING: pass_zone_encoder.joblib not found. Pass zone encoding may fail.")
        PASS_ZONE_ENCODER = None
    
    # Load the xA (Expected Assists) model
    try:
        XA_MODEL = joblib.load('xa_model.joblib')
        XA_MODEL_FEATURES = joblib.load('xa_model_features.joblib')
        print("xA model loaded successfully.")
    except FileNotFoundError:
        print("WARNING: xa_model.joblib not found. Expected Assists calculation will be skipped.")
        XA_MODEL = None
        XA_MODEL_FEATURES = None
except FileNotFoundError:
    print("ERROR: No xG model found! Please run retrain_xg_with_moneypuck.py first!")
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

def find_pass_before_shot(play, previous_plays, current_team_id):
    """
    Find a pass/play by the same team within 2-3 seconds before a shot.
    
    Args:
        play: Current shot play
        previous_plays: List of previous plays (last 15 plays)
        current_team_id: Team ID of the shooting team
    
    Returns:
        dict with keys:
            - 'pass_play': The pass event if found, None otherwise
            - 'passer_id': The playerId of the passer, None if not found
    """
    if not previous_plays or not current_team_id:
        return None
    
    current_period = play.get('periodDescriptor', {}).get('number', 0)
    current_time = parse_time_to_seconds(play.get('timeInPeriod', ''))
    
    if current_time is None:
        return None
    
    # Excluded event types (not passes):
    # 502 = faceoff, 503 = hit (optional - may want to include), 
    # penalties, stoppages, period-end, game-end
    excluded_types = [502]  # Faceoffs are definitely not passes
    # Note: We'll include hits (503) as they could be passes, but prioritize other events
    
    # Look back through previous plays (most recent first)
    for prev_play in reversed(previous_plays[-15:]):  # Check last 15 plays
        prev_type_code = prev_play.get('typeCode')
        prev_details = prev_play.get('details', {})
        prev_team_id = prev_details.get('eventOwnerTeamId')
        
        # Skip excluded types
        if prev_type_code in excluded_types:
            continue
        
        # Must be same team
        if not prev_team_id or prev_team_id != current_team_id:
            continue
        
        # Must be same period
        prev_period = prev_play.get('periodDescriptor', {}).get('number', 0)
        if prev_period != current_period:
            continue
        
        # Must have coordinates (passes need location data)
        prev_x = prev_details.get('xCoord', 0)
        prev_y = prev_details.get('yCoord', 0)
        if prev_x == 0 and prev_y == 0:
            continue
        
        # Calculate time difference
        prev_time = parse_time_to_seconds(prev_play.get('timeInPeriod', ''))
        if prev_time is None:
            continue
        
        time_diff = current_time - prev_time
        
        # Must be within 3 seconds (same as rebound detection)
        if 0 < time_diff <= 3.0:
            # Extract passer ID from pass event
            # Try playerId first, fallback to eventOwnerTeamId (team-level, less accurate)
            passer_id = prev_details.get('playerId')
            if not passer_id:
                # Fallback: use eventOwnerTeamId (but this is team-level, not player-level)
                # This is less ideal but better than nothing
                passer_id = prev_team_id
            
            return {
                'pass_play': prev_play,
                'passer_id': passer_id
            }
    
    return {'pass_play': None, 'passer_id': None}

def classify_pass_zone(pass_x, pass_y):
    """
    Classify pass location into zones based on distance and angle from net.
    
    Args:
        pass_x: X coordinate of pass location (NHL coordinates, net at x=89)
        pass_y: Y coordinate of pass location (NHL coordinates, net at y=0)
    
    Returns:
        str: Zone classification ('crease', 'slot_low_angle', 'slot_high_angle', 
             'high_slot_low_angle', 'high_slot_high_angle', 'blue_line_low_angle', 
             'blue_line_high_angle', 'deep', 'no_pass')
    """
    # Handle flipped coordinates (if team is shooting into other net)
    if pass_x < 0:
        pass_x = -pass_x
        pass_y = -pass_y
    
    # Calculate distance from net
    pass_distance = math.sqrt((NET_X - pass_x)**2 + (NET_Y - pass_y)**2)
    
    # Calculate angle from net center
    dx = abs(NET_X - pass_x)  # Horizontal distance from net
    dy = abs(pass_y - NET_Y)  # Vertical distance from center
    
    if dx == 0:
        pass_angle = 90.0
    else:
        pass_angle = math.degrees(math.atan2(dy, dx))
    
    pass_angle = max(0.0, min(90.0, pass_angle))
    
    # Zone classification based on distance and angle
    if pass_distance < 10:
        return 'crease'
    elif 10 <= pass_distance < 20:
        if pass_angle < 30:
            return 'slot_low_angle'
        else:
            return 'slot_high_angle'
    elif 20 <= pass_distance < 35:
        if pass_angle < 30:
            return 'high_slot_low_angle'
        else:
            return 'high_slot_high_angle'
    elif 35 <= pass_distance < 60:
        if pass_angle < 45:
            return 'blue_line_low_angle'
        else:
            return 'blue_line_high_angle'
    elif pass_distance >= 60:
        return 'deep'
    else:
        return 'no_pass'

def calculate_pass_immediacy_score(time_before_shot):
    """
    Calculate pass immediacy score based on time between pass and shot.
    
    Args:
        time_before_shot: Time in seconds between pass and shot (0-3+ seconds)
    
    Returns:
        float: Immediacy score (0-1), where 1.0 = immediate one-timer, 0.0 = delayed shot
    """
    if time_before_shot is None or time_before_shot < 0:
        return 0.0
    
    # Formula: immediacy = max(0, 1 - (time_before_shot / 3.0))
    # 0 seconds = 1.0 (immediate one-timer)
    # 1 second = 0.67 (quick shot)
    # 2 seconds = 0.33 (delayed shot)
    # 3+ seconds = 0.0 (not immediate)
    immediacy = max(0.0, 1.0 - (time_before_shot / 3.0))
    return immediacy

def calculate_goalie_movement_score(pass_lateral_distance, pass_immediacy_score):
    """
    Calculate goalie movement requirement score combining lateral distance and timing.
    
    Args:
        pass_lateral_distance: Lateral distance of pass in feet (0-50+)
        pass_immediacy_score: Pass immediacy score (0-1)
    
    Returns:
        float: Goalie movement score (0-1), where higher = more goalie movement required
    """
    if pass_lateral_distance is None or pass_immediacy_score is None:
        return 0.0
    
    # Formula: movement = (pass_lateral_distance / 50.0) * pass_immediacy_score
    # High lateral distance (cross-ice) + immediate shot = high movement required
    # Low lateral distance (short pass) = low movement required
    # Delayed shot (low immediacy) = low movement even with high lateral distance
    lateral_normalized = min(1.0, pass_lateral_distance / 50.0)  # Cap at 1.0 for distances > 50ft
    movement = lateral_normalized * pass_immediacy_score
    return min(1.0, movement)  # Ensure 0-1 range

def calculate_normalized_lateral_distance(pass_lateral_distance, pass_zone):
    """
    Calculate normalized lateral distance that accounts for zone context.
    
    The rink is 85 feet wide. A 5ft lateral pass in the crease/slot is much more
    significant than a 5ft lateral pass from the blue line because:
    - In tight areas, goalie has less time/space to react
    - Same absolute distance means different relative impact in different zones
    
    Args:
        pass_lateral_distance: Absolute lateral distance in feet
        pass_zone: Zone classification string
    
    Returns:
        float: Normalized lateral distance (0-1), where higher = more significant
    """
    if pass_lateral_distance is None or pass_zone is None or pass_zone == 'no_pass':
        return 0.0
    
    # Zone-specific normalization factors
    # Higher factor = same lateral distance is more significant in that zone
    zone_factors = {
        'crease': 2.0,  # 5ft in crease = 10ft normalized (very significant!)
        'slot_low_angle': 1.8,
        'slot_high_angle': 1.6,
        'high_slot_low_angle': 1.3,
        'high_slot_high_angle': 1.1,
        'blue_line_low_angle': 0.8,
        'blue_line_high_angle': 0.6,
        'deep': 0.4
    }
    
    factor = zone_factors.get(pass_zone, 1.0)
    normalized = (pass_lateral_distance * factor) / 85.0  # Normalize by rink width
    return min(1.0, normalized)  # Cap at 1.0

def calculate_zone_relative_distance(pass_distance_to_net, pass_zone):
    """
    Calculate distance as percentage of zone depth.
    
    Args:
        pass_distance_to_net: Distance from pass to net in feet
        pass_zone: Zone classification string
    
    Returns:
        float: Distance as percentage of zone (0-1), where lower = closer to net within zone
    """
    if pass_distance_to_net is None or pass_zone is None or pass_zone == 'no_pass':
        return 1.0  # Default to far (100%)
    
    # Zone depth ranges (approximate)
    zone_depths = {
        'crease': (0, 10),  # 0-10 feet
        'slot_low_angle': (10, 20),
        'slot_high_angle': (10, 20),
        'high_slot_low_angle': (20, 35),
        'high_slot_high_angle': (20, 35),
        'blue_line_low_angle': (35, 60),
        'blue_line_high_angle': (35, 60),
        'deep': (60, 100)
    }
    
    if pass_zone not in zone_depths:
        return 1.0
    
    zone_min, zone_max = zone_depths[pass_zone]
    zone_depth = zone_max - zone_min
    
    if zone_depth == 0:
        return 0.5
    
    # Calculate position within zone (0 = at zone_min, 1 = at zone_max)
    if pass_distance_to_net < zone_min:
        return 0.0  # Closer than zone start
    elif pass_distance_to_net > zone_max:
        return 1.0  # Beyond zone end
    else:
        return (pass_distance_to_net - zone_min) / zone_depth

def calculate_pass_quality_score(pass_zone, pass_immediacy_score, goalie_movement_score, pass_distance_to_net):
    """
    Calculate composite pass quality score combining all pass factors.
    
    Args:
        pass_zone: Zone classification string (e.g., 'crease', 'slot_low_angle')
        pass_immediacy_score: Pass immediacy score (0-1)
        goalie_movement_score: Goalie movement score (0-1)
        pass_distance_to_net: Distance from pass location to net in feet
    
    Returns:
        float: Pass quality score (0-1), where higher = better pass quality
    """
    # Zone danger weights (higher for crease/slot zones)
    zone_weights = {
        'crease': 1.0,
        'slot_low_angle': 0.9,
        'slot_high_angle': 0.7,
        'high_slot_low_angle': 0.6,
        'high_slot_high_angle': 0.5,
        'blue_line_low_angle': 0.4,
        'blue_line_high_angle': 0.3,
        'deep': 0.2,
        'no_pass': 0.0
    }
    
    zone_weight = zone_weights.get(pass_zone, 0.0)
    
    # Distance component (closer = higher, normalized to 0-1)
    # Assume max distance of 100ft, closer passes get higher score
    if pass_distance_to_net is None or pass_distance_to_net < 0:
        distance_component = 0.0
    else:
        distance_component = max(0.0, 1.0 - (pass_distance_to_net / 100.0))
    
    # Weighted combination:
    # - Zone weight: 40% (where pass came from matters most)
    # - Immediacy: 30% (how quick the shot is)
    # - Goalie movement: 20% (cross-ice + immediate = dangerous)
    # - Distance: 10% (closer passes are better)
    quality_score = (
        zone_weight * 0.4 +
        pass_immediacy_score * 0.3 +
        goalie_movement_score * 0.2 +
        distance_component * 0.1
    )
    
    return min(1.0, max(0.0, quality_score))  # Ensure 0-1 range

def get_finished_game_ids_from_db(date_str=None):
    """
    Fetches list of finished games from nhl_games table for a given date.
    Falls back to API if table doesn't exist or query fails.
    """
    date_to_check = date_str if date_str else datetime.date.today().strftime('%Y-%m-%d')
    
    try:
        # Try to query nhl_games table first
        response = supabase.table('nhl_games').select('game_id').eq('game_date', date_to_check).in_('status', ['final', 'FINAL', 'OFF', 'F']).execute()
        
        if response.data:
            game_ids = [game['game_id'] for game in response.data]
            print(f"Found {len(game_ids)} finished games in database for {date_to_check}")
            return game_ids
    except Exception as e:
        print(f"Could not query nhl_games table: {e}")
        print("Falling back to NHL API...")
    
    # Fallback to API
    return get_finished_game_ids(date_str)

def get_finished_game_ids(date_str=None):
    """Fetches list of finished games for a given date from NHL API."""
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
    # Filter by the date reported in the schedule data to only process games from the requested date
    for date_entry in schedule_data.get('gameWeek', []):
        # Filter by the date reported in the schedule data
        if date_entry.get('date') == date_to_check:
            for game in date_entry.get('games', []):
                # Check if the game status is one of the final states
                game_state = game.get('gameState')
                if game_state in ['FINAL', 'OFF', 'F']: 
                     # We need the game ID (e.g., 2024020123)
                    finished_game_ids.append(game.get('id')) 
    
    return finished_game_ids

def scrape_pbp_and_process(date_str='2025-12-07'):
    """
    Scrapes raw PBP for all finished games and processes data.
    
    Args:
        date_str: Date to process games for (format: YYYY-MM-DD). Defaults to '2025-12-07'.
    """
    print(f"📅 Processing games for date: {date_str}")
    print("=" * 60)
    
    # Try to get games from database first, fallback to API
    game_ids = get_finished_game_ids_from_db(date_str=date_str)
    
    if not game_ids:
        print(f"⚠️  No finished games found for {date_str}")
        return None
    
    print(f"Found {len(game_ids)} finished games to process")
    print()
    
    all_shot_data = []
    games_processed = 0
    games_failed = 0

    for idx, game_id in enumerate(game_ids, 1):
        # PBP Endpoint: https://api-web.nhle.com/v1/gamecenter/{game_id}/play-by-play
        pbp_url = f"{NHL_BASE_URL}/gamecenter/{game_id}/play-by-play"
        
        try:
            response = requests.get(pbp_url)
            response.raise_for_status()
            raw_data = response.json()
            
            # --- FEATURE ENGINEERING: Extracting Shot Coordinates and Calculating Features ---
            print(f"[{idx}/{len(game_ids)}] Processing Game ID: {game_id}...")
            shots_in_game = 0
            
            # We assume the NHL JSON structure has a 'plays' list
            # typeCode values: 505 = goal, 506 = shot-on-goal, 507 = missed-shot
            # Plays are already sorted by sortOrder, so we can track previous plays for rebound detection
            previous_play = None  # Track previous play for rebound detection
            previous_plays = []  # Track last 15 plays for pass detection (need more history than rebounds)
            
            for play in raw_data.get('plays', []):
                type_code = play.get('typeCode')
                # Only process shots on goal (506), goals (505), and missed shots (507)
                if type_code not in [505, 506, 507]: 
                    continue
                
                # Get details (coordinates and player info are in details)
                details = play.get('details', {})
                if not details:
                    continue
                
                # MAXIMIZE RAW DATA EXTRACTION: Get ALL available fields from API
                # Play-level fields
                event_id = play.get('eventId')
                sort_order = play.get('sortOrder')
                type_desc = play.get('typeDescKey', '')
                
                # Period/time fields
                period_descriptor = play.get('periodDescriptor', {})
                period_number = period_descriptor.get('number')
                period_type = period_descriptor.get('periodType', '')
                time_in_period = play.get('timeInPeriod', '')
                time_remaining = play.get('timeRemaining', '')
                
                # Situation/context fields
                situation_code = str(play.get('situationCode', ''))
                home_team_defending_side = play.get('homeTeamDefendingSide', '')
                
                # Details fields (where most data lives)
                shot_coord_x = details.get('xCoord', 0)
                shot_coord_y = details.get('yCoord', 0)
                zone_code = details.get('zoneCode', '')
                
                # Player fields
                if type_code == 505:  # Goal
                    player_id = details.get('scoringPlayerId')
                    shooting_player_id = details.get('scoringPlayerId')  # Same for goals
                else:  # Shot (506 or 507)
                    player_id = details.get('shootingPlayerId')
                    shooting_player_id = details.get('shootingPlayerId')
                
                # Additional player info
                scoring_player_id = details.get('scoringPlayerId')
                assist1_player_id = details.get('assist1PlayerId')
                assist2_player_id = details.get('assist2PlayerId')
                
                # Goalie info
                goalie_in_net_id = details.get('goalieInNetId')
                
                # Team context
                event_owner_team_id = details.get('eventOwnerTeamId')
                away_score_at_event = details.get('awayScore', 0) or 0
                home_score_at_event = details.get('homeScore', 0) or 0
                away_sog = details.get('awaySOG', 0) or 0
                home_sog = details.get('homeSOG', 0) or 0
                
                # Shot-specific fields
                shot_type_raw = details.get('shotType', '')
                miss_reason = details.get('reason', '')  # For missed shots
                
                # Game-level context (from raw_data)
                home_team_id = raw_data.get('homeTeam', {}).get('id')
                away_team_id = raw_data.get('awayTeam', {}).get('id')
                home_team_abbrev = raw_data.get('homeTeam', {}).get('abbrev', '')
                away_team_abbrev = raw_data.get('awayTeam', {}).get('abbrev', '')
                
                if not player_id or shot_coord_x == 0:  # Skip if no player or invalid coordinates
                    continue
                
                # CRITICAL CHECK: NHL coordinates are centered. We must flip coordinates 
                # if the team is shooting into the other net (x < 0) for consistent calculation.
                if shot_coord_x < 0:
                    shot_coord_x = -shot_coord_x
                    shot_coord_y = -shot_coord_y
                
                # ============================================================
                # FEATURE ENGINEERING: Calculate all 9 model inputs
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
                
                # FEATURE: SHOT_ANGLE_ADJUSTED (Absolute value of angle)
                # What: Absolute value of shot angle (MoneyPuck uses this)
                # Why: Removes direction bias, focuses on angle magnitude
                # Formula: abs(angle) - but angle is already 0-90, so this is just angle
                # Note: MoneyPuck's shotAngle can be negative, so they use abs() to get 0-90 range
                shot_angle_adjusted = abs(angle)  # For consistency with MoneyPuck (angle is already 0-90)
                
                # NEW FEATURE: IS_SLOT_SHOT (Scaled 0-1, continuous)
                # High-Danger Zone Score: The Slot (distance < 25ft AND |y| < 15ft)
                # Score scales from 1.0 (very close to net, centered) to 0.0 (edge of slot or outside)
                # This directly addresses the undervalued slot area identified in heatmap analysis
                # Formula:
                #   - Distance component: max(0, 1 - (distance / 25)) - closer = higher
                #   - Lateral component: max(0, 1 - (|y| / 15)) - more centered = higher
                #   - Combined: weighted average (60% distance, 40% lateral)
                if distance < 25 and abs(shot_coord_y) < 15:
                    # Inside slot - calculate scaled score
                    distance_component = max(0.0, 1.0 - (distance / 25.0))  # 1.0 at net, 0.0 at 25ft
                    lateral_component = max(0.0, 1.0 - (abs(shot_coord_y) / 15.0))  # 1.0 at center, 0.0 at 15ft
                    # Weighted average: distance matters more (60%) than lateral position (40%)
                    is_slot_shot = (distance_component * 0.6 + lateral_component * 0.4)
                else:
                    # Outside slot
                    is_slot_shot = 0.0
                
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
                
                # FEATURE 7-9: PASS BEFORE SHOT FEATURES
                # What: Detect if there was a pass/play by the same team right before the shot
                # Why: One-timers and backdoor passes are significantly more dangerous (expected 10-15% importance)
                # Features:
                #   - has_pass_before_shot: Binary (0 or 1) - whether a pass was detected
                #   - pass_lateral_distance: Continuous (0-100+ ft) - how far across ice the pass traveled
                #   - pass_to_net_distance: Continuous (0-100+ ft) - how close the pass was to the net
                has_pass_before_shot = 0
                pass_lateral_distance = 0.0
                pass_to_net_distance = 0.0
                
                current_team_id = details.get('eventOwnerTeamId')
                pass_result = find_pass_before_shot(play, previous_plays, current_team_id)
                pass_play = pass_result.get('pass_play') if pass_result else None
                passer_id = pass_result.get('passer_id') if pass_result else None
                
                if pass_play:
                    has_pass_before_shot = 1
                    pass_details = pass_play.get('details', {})
                    pass_x = pass_details.get('xCoord', 0)
                    pass_y = pass_details.get('yCoord', 0)
                    
                    # Flip coordinates if needed (same as shot coordinates)
                    if pass_x < 0:
                        pass_x = -pass_x
                        pass_y = -pass_y
                    
                    # Calculate lateral distance (y-axis difference between pass and shot)
                    # This measures how far across the ice the pass traveled
                    pass_lateral_distance = abs(shot_coord_y - pass_y)
                    
                    # Calculate distance from pass location to net
                    # This measures how close the pass was to the net
                    pass_to_net_distance = math.sqrt((NET_X - pass_x)**2 + (NET_Y - pass_y)**2)
                    
                    # Calculate time before shot (for xA model)
                    time_before_shot = calculate_time_difference(pass_play, play)
                    if time_before_shot is None:
                        time_before_shot = 0.0
                    
                    # Calculate pass angle (for xA model) - angle from net center to pass location
                    pass_dx = abs(NET_X - pass_x)  # Horizontal distance from net
                    pass_dy = abs(pass_y - NET_Y)  # Vertical distance from center
                    
                    if pass_dx == 0:
                        pass_angle = 90.0  # Directly to the side
                    else:
                        pass_angle = math.degrees(math.atan2(pass_dy, pass_dx))
                    
                    # Ensure pass angle is in valid range (0-90 degrees)
                    pass_angle = max(0.0, min(90.0, pass_angle))
                    
                    # NEW PASS CONTEXT FEATURES (for enhanced xG model):
                    # Calculate pass zone classification
                    pass_zone = classify_pass_zone(pass_x, pass_y)
                    
                    # Calculate pass immediacy score
                    pass_immediacy_score = calculate_pass_immediacy_score(time_before_shot)
                    
                    # Calculate goalie movement score
                    goalie_movement_score = calculate_goalie_movement_score(pass_lateral_distance, pass_immediacy_score)
                    
                    # Calculate pass quality score (composite)
                    pass_quality_score = calculate_pass_quality_score(pass_zone, pass_immediacy_score, goalie_movement_score, pass_to_net_distance)
                    
                    # ZONE-AWARE DISTANCE METRICS (for better pass context understanding):
                    # Normalized lateral distance accounts for zone context (5ft in crease > 5ft from blue line)
                    normalized_lateral_distance = calculate_normalized_lateral_distance(pass_lateral_distance, pass_zone)
                    # Zone-relative distance (position within zone, 0 = start of zone, 1 = end of zone)
                    zone_relative_distance = calculate_zone_relative_distance(pass_to_net_distance, pass_zone)
                else:
                    passer_id = None
                    time_before_shot = 0.0
                    pass_angle = 0.0
                    # Default values for new pass context features when no pass detected
                    pass_zone = 'no_pass'
                    pass_immediacy_score = 0.0
                    goalie_movement_score = 0.0
                    pass_quality_score = 0.0
                    normalized_lateral_distance = 0.0
                    zone_relative_distance = 1.0  # Default to far (100% of zone)
                
                # Encode pass_zone for model (similar to shot_type encoding)
                if PASS_ZONE_ENCODER:
                    try:
                        if pass_zone in PASS_ZONE_ENCODER.classes_:
                            pass_zone_encoded = PASS_ZONE_ENCODER.transform([pass_zone])[0]
                        else:
                            # Default to 'no_pass' if zone not in training data
                            if 'no_pass' in PASS_ZONE_ENCODER.classes_:
                                pass_zone_encoded = PASS_ZONE_ENCODER.transform(['no_pass'])[0]
                            else:
                                pass_zone_encoded = 0  # Fallback to first class
                    except Exception as e:
                        pass_zone_encoded = 0  # Fallback on error
                else:
                    pass_zone_encoded = 0  # Fallback if encoder not loaded
                
                # Update previous_play for next iteration (only track shot-related plays)
                previous_play = play
                
                # Update previous_plays list (track all plays for pass detection)
                previous_plays.append(play)
                if len(previous_plays) > 15:  # Keep last 15 plays
                    previous_plays.pop(0)
                
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
                
                # ENHANCED: Parse situation_code for detailed situation info
                def parse_situation_code(situation_code, event_owner_team_id, home_team_id):
                    """Parse situation_code to extract skaters on ice, empty net, penalty info."""
                    home_skaters = 5
                    away_skaters = 5
                    is_empty_net = False
                    home_empty_net = False
                    away_empty_net = False
                    penalty_length = None
                    penalty_time_left = None
                    
                    if not situation_code or situation_code == '':
                        return home_skaters, away_skaters, is_empty_net, home_empty_net, away_empty_net, penalty_length, penalty_time_left
                    
                    # Parse format like "5-4" (5v4), "6-5" (6v5 empty net), etc.
                    # Format: "home-away" or "home-away-EN" for empty net
                    parts = situation_code.replace('v', '-').split('-')
                    
                    if len(parts) >= 2:
                        try:
                            home_skaters = int(parts[0])
                            away_skaters = int(parts[1])
                        except ValueError:
                            pass
                    
                    # Check for empty net indicators
                    if 'EN' in situation_code.upper():
                        is_empty_net = True
                        # Determine which team has empty net (team with 6 skaters)
                        if home_skaters == 6:
                            home_empty_net = True
                        elif away_skaters == 6:
                            away_empty_net = True
                    elif len(parts) >= 2:
                        # Check if either team has 6 skaters (empty net)
                        if home_skaters == 6:
                            is_empty_net = True
                            home_empty_net = True
                        elif away_skaters == 6:
                            is_empty_net = True
                            away_empty_net = True
                    
                    # Penalty info would need to be extracted from penalty events
                    # For now, we'll leave these as None
                    
                    return home_skaters, away_skaters, is_empty_net, home_empty_net, away_empty_net, penalty_length, penalty_time_left
                
                home_skaters_on_ice, away_skaters_on_ice, is_empty_net, home_empty_net, away_empty_net, penalty_length, penalty_time_left = parse_situation_code(
                    situation_code, 
                    details.get('eventOwnerTeamId'),
                    home_team_id
                )
                
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
                
                # ============================================================
                # ENHANCED FEATURES: Additional context matching MoneyPuck
                # ============================================================
                
                # LAST EVENT DETAILS
                last_event_category = None
                last_event_x = None
                last_event_y = None
                last_event_team = None
                distance_from_last_event = None
                time_since_last_event = None
                speed_from_last_event = None
                last_event_shot_angle = None
                last_event_shot_distance = None
                player_num_that_did_last_event = None
                
                if previous_play:
                    prev_type_code = previous_play.get('typeCode')
                    prev_details = previous_play.get('details', {})
                    prev_team_id = prev_details.get('eventOwnerTeamId')
                    
                    # Map type codes to event categories
                    type_code_to_category = {
                        505: 'GOAL', 506: 'SHOT', 507: 'MISS', 503: 'FAC', 504: 'HIT',
                        509: 'BLOCK', 516: 'PENL', 517: 'STOP', 520: 'GIVE', 521: 'TAKE',
                        502: 'TAKE', 518: 'CHL', 519: 'GIVE'
                    }
                    last_event_category = type_code_to_category.get(prev_type_code, 'OTHER')
                    
                    # Get last event coordinates
                    last_event_x = prev_details.get('xCoord')
                    last_event_y = prev_details.get('yCoord')
                    
                    # Flip coordinates if needed
                    if last_event_x and last_event_x < 0:
                        last_event_x = -last_event_x
                        last_event_y = -last_event_y if last_event_y else None
                    
                    # Determine last event team
                    if prev_team_id:
                        if prev_team_id == home_team_id:
                            last_event_team = 'HOME'
                        else:
                            last_event_team = 'AWAY'
                    
                    # Get player who did last event
                    if prev_type_code == 505:  # Goal
                        player_num_that_did_last_event = prev_details.get('scoringPlayerId')
                    elif prev_type_code in [506, 507]:  # Shot
                        player_num_that_did_last_event = prev_details.get('shootingPlayerId')
                    elif prev_type_code == 503:  # Faceoff
                        player_num_that_did_last_event = prev_details.get('winningPlayerId')
                    else:
                        player_num_that_did_last_event = prev_details.get('eventOwnerTeamId')  # Fallback
                    
                    # Calculate distance and time from last event
                    if last_event_x is not None and last_event_y is not None:
                        distance_from_last_event = math.sqrt(
                            (shot_coord_x - last_event_x)**2 + 
                            (shot_coord_y - last_event_y)**2
                        )
                    
                    time_since_last_event = calculate_time_difference(previous_play, play)
                    
                    # Calculate speed (distance per second)
                    if distance_from_last_event and time_since_last_event and time_since_last_event > 0:
                        speed_from_last_event = distance_from_last_event / time_since_last_event
                    
                    # Calculate last event shot metrics if it was a shot
                    if prev_type_code in [505, 506, 507] and last_event_x and last_event_y:
                        last_event_shot_angle, last_event_shot_distance = calculate_last_event_shot_metrics(
                            prev_type_code, last_event_x, last_event_y
                        )
                
                # GOALIE INFORMATION
                goalie_id = details.get('goalieInNetId')
                goalie_name = None  # Would need roster lookup for name
                
                # PERIOD/TIME CONTEXT
                period_descriptor = play.get('periodDescriptor', {})
                period = period_descriptor.get('number')
                time_in_period = play.get('timeInPeriod', '')
                time_remaining = play.get('timeRemaining', '')
                
                # Convert time string to seconds remaining
                time_remaining_seconds = None
                if time_remaining:
                    try:
                        parts = time_remaining.split(':')
                        if len(parts) == 2:
                            minutes, seconds = int(parts[0]), int(parts[1])
                            time_remaining_seconds = minutes * 60 + seconds
                    except (ValueError, AttributeError):
                        pass
                
                # Time since faceoff (find last faceoff)
                time_since_faceoff = None
                for prev_play in reversed(previous_plays[-20:]):  # Look back 20 plays
                    if prev_play.get('typeCode') == 503:  # Faceoff
                        time_since_faceoff = calculate_time_difference(prev_play, play)
                        break
                
                # TEAM CONTEXT
                team_code = None
                is_home_team = None
                zone = None
                home_score = home_score_at_event
                away_score = away_score_at_event
                
                if event_owner_team_id:
                    if event_owner_team_id == home_team_id:
                        is_home_team = True
                        team_code = raw_data.get('homeTeam', {}).get('abbrev')
                    else:
                        is_home_team = False
                        team_code = raw_data.get('awayTeam', {}).get('abbrev')
                
                # Determine zone from coordinates
                if shot_coord_x > 25:  # Offensive zone
                    zone = 'HOMEZONE' if is_home_team else 'AWAYZONE'
                elif shot_coord_x < -25:  # Defensive zone
                    zone = 'AWAYZONE' if is_home_team else 'HOMEZONE'
                else:  # Neutral zone
                    zone = 'NEUTRALZONE'
                
                # SHOT OUTCOMES (Look ahead to next play)
                shot_was_on_goal = (type_code == 506)  # Explicit flag
                shot_goalie_froze = False
                shot_generated_rebound = False
                shot_play_stopped = False
                shot_play_continued_in_zone = False
                shot_play_continued_outside_zone = False
                
                # Look ahead to next play to determine outcomes
                play_index = raw_data.get('plays', []).index(play) if play in raw_data.get('plays', []) else -1
                if play_index >= 0 and play_index < len(raw_data.get('plays', [])) - 1:
                    next_play = raw_data.get('plays', [])[play_index + 1]
                    next_type_code = next_play.get('typeCode')
                    next_details = next_play.get('details', {})
                    
                    # Check if goalie froze puck (next event is stoppage after save)
                    if next_type_code == 517:  # Stoppage
                        if time_since_last_event and time_since_last_event < 2.0:  # Within 2 seconds
                            shot_goalie_froze = True
                            shot_play_stopped = True
                    
                    # Check if generated rebound (next event is shot by same team)
                    if next_type_code in [505, 506, 507]:  # Shot/goal
                        next_team_id = next_details.get('eventOwnerTeamId')
                        if next_team_id == event_owner_team_id:
                            time_to_next = calculate_time_difference(play, next_play)
                            if time_to_next and time_to_next < 3.0:  # Within 3 seconds
                                shot_generated_rebound = True
                    
                    # Check zone continuation
                    next_coords = next_details.get('xCoord', 0)
                    if next_coords:
                        if zone in ['HOMEZONE', 'AWAYZONE']:
                            if (is_home_team and next_coords > 25) or (not is_home_team and next_coords < -25):
                                shot_play_continued_in_zone = True
                            else:
                                shot_play_continued_outside_zone = True
                
                # RUSH DETECTION
                is_rush = False
                # Rush: shot from neutral/defensive zone with quick transition
                if zone in ['NEUTRALZONE', 'AWAYZONE'] if is_home_team else ['NEUTRALZONE', 'HOMEZONE']:
                    # Check if we entered offensive zone recently
                    for prev_play in reversed(previous_plays[-10:]):  # Look back 10 plays
                        prev_details = prev_play.get('details', {})
                        prev_x = prev_details.get('xCoord', 0)
                        if prev_x:
                            if prev_x < 0:
                                prev_x = -prev_x
                            
                            # If previous play was in defensive/neutral zone and this is in offensive zone
                            if prev_x < 25 and shot_coord_x > 25:
                                time_to_shot = calculate_time_difference(prev_play, play)
                                if time_to_shot and time_to_shot < 3.0:  # Quick transition
                                    is_rush = True
                                    break

                # Store pass coordinates for raw_shots table
                pass_x_coord = None
                pass_y_coord = None
                if pass_play:
                    pass_details = pass_play.get('details', {})
                    pass_x_coord = pass_details.get('xCoord', 0)
                    pass_y_coord = pass_details.get('yCoord', 0)
                    # Flip coordinates if needed (same logic as shot coordinates)
                    if pass_x_coord < 0:
                        pass_x_coord = -pass_x_coord
                        pass_y_coord = -pass_y_coord
                
                # Append the features required by the model
                shot_record = {
                    'playerId': player_id,  # Shooter
                    'game_id': game_id,
                    # COORDINATES (for raw_shots table and visualization):
                    'shot_x': shot_coord_x,
                    'shot_y': shot_coord_y,
                    'pass_x': pass_x_coord if pass_play else None,
                    'pass_y': pass_y_coord if pass_play else None,
                    # THESE ARE THE FEATURES YOUR MODEL USES:
            'distance': distance,
            'angle': angle,
            'shot_angle_adjusted': shot_angle_adjusted,  # MoneyPuck feature: abs(angle)
            'is_rebound': is_rebound,
                    'is_slot_shot': is_slot_shot,  # NEW: High-danger zone flag
                    'shot_type_encoded': shot_type_encoded,
                    'is_power_play': is_power_play,
                    'score_differential': score_differential,
                    # EXISTING PASS FEATURES (for xG model):
                    'has_pass_before_shot': has_pass_before_shot,
                    'pass_lateral_distance': pass_lateral_distance,
                    'pass_to_net_distance': pass_to_net_distance,
                    # NEW PASS CONTEXT FEATURES (for enhanced xG model):
                    'pass_zone': pass_zone,  # Zone classification (string, for raw_shots table)
                    'pass_zone_encoded': pass_zone_encoded,  # Zone classification (encoded)
                    'pass_immediacy_score': pass_immediacy_score,  # 0-1, how immediate the shot is
                    'goalie_movement_score': goalie_movement_score,  # 0-1, goalie movement required
                    'pass_quality_score': pass_quality_score,  # 0-1, composite pass quality
                    # ZONE-AWARE METRICS (for better understanding of pass context):
                    'normalized_lateral_distance': normalized_lateral_distance,  # Zone-adjusted lateral distance (0-1)
                    'zone_relative_distance': zone_relative_distance,  # Position within zone (0-1)
                    # xA FEATURES (for Expected Assists model):
                    'passer_id': passer_id,  # Passer (None if no pass)
                    'pass_distance_to_net': pass_to_net_distance,  # Same as pass_to_net_distance, but named for xA
                    'pass_angle': pass_angle,
                    'time_before_shot': time_before_shot,
                    'shot_result': 1 if type_code == 505 else 0,  # 1 = goal, 0 = no goal (for xA training)
                    # ADDITIONAL FIELDS FOR RAW_SHOTS TABLE:
                    'shot_type_code': type_code,  # 505 = goal, 506 = shot on goal, 507 = missed shot
                    'shot_type': shot_type_standard,  # 'wrist', 'snap', etc.
                    'is_goal': 1 if type_code == 505 else 0,  # Boolean for goals
                    # ENHANCED FEATURES (matching MoneyPuck):
                    # Situation features
                    'home_skaters_on_ice': home_skaters_on_ice,
                    'away_skaters_on_ice': away_skaters_on_ice,
                    'is_empty_net': 1 if is_empty_net else 0,
                    'home_empty_net': 1 if home_empty_net else 0,  # MoneyPuck feature
                    'away_empty_net': 1 if away_empty_net else 0,  # MoneyPuck feature
                    'penalty_length': penalty_length,
                    'penalty_time_left': penalty_time_left,
                    # Last event features
                    'last_event_category': last_event_category,
                    'last_event_x': last_event_x,
                    'last_event_y': last_event_y,
                    'last_event_team': last_event_team,
                    'distance_from_last_event': distance_from_last_event,
                    'time_since_last_event': time_since_last_event,
                    'speed_from_last_event': speed_from_last_event,
                    'last_event_shot_angle': last_event_shot_angle,
                    'last_event_shot_distance': last_event_shot_distance,
                    'player_num_that_did_last_event': player_num_that_did_last_event,
                    # Goalie features
                    'goalie_id': goalie_id,
                    'goalie_name': goalie_name,
                    # Period/time features
                    'period': period,
                    'time_in_period': time_in_period,
                    'time_remaining_seconds': time_remaining_seconds,
                    'time_since_faceoff': time_since_faceoff,
                    # Team context features
                    'team_code': team_code,  # Shooting team code
                    'shooting_team_code': team_code,  # MoneyPuck feature: shootingTeamCode
                    'defending_team_code': away_team_abbrev if is_home_team else home_team_abbrev if is_home_team is not None else None,  # MoneyPuck feature: defendingTeamCode
                    'is_home_team': 1 if is_home_team else 0 if is_home_team is not None else None,
                    'zone': zone,
                    'home_score': home_score,
                    'away_score': away_score,
                    # Shot outcome features
                    'shot_was_on_goal': 1 if shot_was_on_goal else 0,
                    'shot_goalie_froze': 1 if shot_goalie_froze else 0,
                    'shot_generated_rebound': 1 if shot_generated_rebound else 0,
                    'shot_play_stopped': 1 if shot_play_stopped else 0,
                    'shot_play_continued_in_zone': 1 if shot_play_continued_in_zone else 0,
                    'shot_play_continued_outside_zone': 1 if shot_play_continued_outside_zone else 0,
                    # Rush detection
                    'is_rush': 1 if is_rush else 0,
                    # ADDITIONAL RAW DATA FIELDS (maximize extraction):
                    # Play identification
                    'event_id': event_id,
                    'sort_order': sort_order,
                    'type_desc': type_desc,
                    # Period/time (raw)
                    'period_type': period_type,
                    'time_remaining': time_remaining,
                    # Situation (raw)
                    'situation_code': situation_code,
                    'home_team_defending_side': home_team_defending_side,
                    # Coordinates (raw)
                    'zone_code': zone_code,
                    # Player IDs (raw)
                    'shooting_player_id': shooting_player_id,
                    'scoring_player_id': scoring_player_id,
                    'assist1_player_id': assist1_player_id,
                    'assist2_player_id': assist2_player_id,
                    # Goalie (raw)
                    'goalie_in_net_id': goalie_in_net_id,
                    # Team context (raw)
                    'event_owner_team_id': event_owner_team_id,
                    'home_team_id': home_team_id,
                    'away_team_id': away_team_id,
                    'home_team_abbrev': home_team_abbrev,
                    'away_team_abbrev': away_team_abbrev,
                    'away_sog': away_sog,
                    'home_sog': home_sog,
                    # Shot details (raw)
                    'shot_type_raw': shot_type_raw,
                    'miss_reason': miss_reason,
                }
                all_shot_data.append(shot_record)
                shots_in_game += 1
            
            games_processed += 1
            print(f"  ✅ Processed {shots_in_game} shots from Game {game_id}")
            
        except requests.exceptions.RequestException as e:
            games_failed += 1
            print(f"  ❌ Error fetching Game ID {game_id}: {e}")
            continue
        except Exception as e:
            games_failed += 1
            print(f"  ❌ Error processing Game ID {game_id}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print()
    print(f"📊 Processing Summary:")
    print(f"   Games processed: {games_processed}")
    print(f"   Games failed: {games_failed}")
    print(f"   Total shots collected: {len(all_shot_data)}")
    print()

    # ... (End of the loop where you collect all shot features into all_shot_data)

    # --- PREDICTION AND AGGREGATION ---
    if not all_shot_data:
        print("No shots found to process.")
        return None
        
    df_shots = pd.DataFrame(all_shot_data)
    
    # Apply calculated/derived features (matching MoneyPuck's calculated features)
    try:
        from feature_calculations import apply_calculated_features_to_dataframe
        print("  🔧 Applying calculated features (arena adjustments, etc.)...")
        initial_cols = len(df_shots.columns)
        df_shots = apply_calculated_features_to_dataframe(df_shots)
        new_cols = len(df_shots.columns) - initial_cols
        print(f"  ✅ Applied {new_cols} calculated features")
    except ImportError:
        print("  ⚠️  feature_calculations.py not found - skipping calculated features")
    except Exception as e:
        print(f"  ⚠️  Error applying calculated features: {e}")
        print("  Continuing with raw features only...")

    # 1. Prepare features for prediction
    # Handle last_event_category encoding if using MoneyPuck model
    if USE_MONEYPUCK_MODEL and 'last_event_category_encoded' in MODEL_FEATURES:
        # Need to encode last_event_category if it exists
        if 'last_event_category' in df_shots.columns and 'last_event_category_encoded' not in df_shots.columns:
            from sklearn.preprocessing import LabelEncoder
            if LAST_EVENT_CATEGORY_ENCODER is not None:
                # Use saved encoder
                df_shots['last_event_category_encoded'] = LAST_EVENT_CATEGORY_ENCODER.transform(
                    df_shots['last_event_category'].fillna('unknown').astype(str)
                )
            else:
                # Encode on-the-fly (fallback)
                le = LabelEncoder()
                df_shots['last_event_category_encoded'] = le.fit_transform(
                    df_shots['last_event_category'].fillna('unknown').astype(str)
                )
    
    # Select the exact features the model was trained on
    # First, ensure all required features exist in df_shots
    for feature in MODEL_FEATURES:
        if feature not in df_shots.columns:
            print(f"⚠️  Warning: Missing feature '{feature}' in data - creating with default value")
            if feature in ['home_empty_net', 'away_empty_net', 'is_empty_net', 
                          'has_pass_before_shot', 'is_rebound', 'is_slot_shot', 'is_power_play']:
                df_shots[feature] = 0  # Binary features default to 0
            elif feature == 'shot_angle_adjusted':
                if 'angle' in df_shots.columns:
                    df_shots[feature] = df_shots['angle'].abs()
                else:
                    df_shots[feature] = 0
            elif feature == 'last_event_category_encoded':
                df_shots[feature] = 0  # Will be encoded above if needed
            else:
                df_shots[feature] = 0  # Default to 0 for missing numeric features
    
    # Now select features (all should exist now)
    X_predict = df_shots[MODEL_FEATURES].copy()
    
    # Fill any missing values (NaN handling)
    for feature in MODEL_FEATURES:
        if feature in X_predict.columns and X_predict[feature].isna().any():
            if feature in ['pass_lateral_distance', 'pass_to_net_distance', 'pass_immediacy_score', 
                          'goalie_movement_score', 'pass_quality_score', 'pass_zone_encoded',
                          'has_pass_before_shot', 'is_rebound', 'is_slot_shot', 'is_power_play',
                          'is_empty_net', 'home_empty_net', 'away_empty_net']:
                X_predict[feature] = X_predict[feature].fillna(0)
            elif feature in ['time_since_last_event', 'distance_from_last_event', 'speed_from_last_event',
                            'last_event_shot_angle', 'last_event_shot_distance', 'last_event_category_encoded']:
                X_predict[feature] = X_predict[feature].fillna(0)
            elif feature == 'shot_angle_adjusted':
                if 'angle' in df_shots.columns:
                    X_predict[feature] = X_predict[feature].fillna(df_shots['angle'].abs())
                else:
                    X_predict[feature] = X_predict[feature].fillna(0)
            else:
                X_predict[feature] = X_predict[feature].fillna(X_predict[feature].median())
    
    # 2. Predict xG values
    if USE_MONEYPUCK_MODEL:
        # MoneyPuck model is a regression model (XGBRegressor) - use predict()
        # Model already outputs MoneyPuck-scale xG, no calibration needed
        df_shots['xG_Value'] = XG_MODEL.predict(X_predict)
        # Cap at reasonable maximum (MoneyPuck xG rarely exceeds 0.5)
        df_shots['xG_Value'] = df_shots['xG_Value'].clip(lower=0.0, upper=0.6)
    else:
        # Old model is classification (XGBClassifier) - use predict_proba()
        raw_xg = XG_MODEL.predict_proba(X_predict)[:, 1]
        # Apply calibration for old model
        CALIBRATION_FACTOR = 3.5
        df_shots['xG_Value'] = np.power(raw_xg, CALIBRATION_FACTOR)
        df_shots['xG_Value'] = df_shots['xG_Value'].clip(upper=0.50)
        SCALE_FACTOR = 0.19
        df_shots['xG_Value'] = df_shots['xG_Value'] * SCALE_FACTOR 

    # --- EXPECTED ASSISTS (xA) PREDICTION ---
    # Only calculate xA for shots that have passes before them
    df_shots['xA_Value'] = 0.0  # Initialize xA column
    
    if XA_MODEL and XA_MODEL_FEATURES:
        # Filter to only shots with passes
        passes_mask = df_shots['has_pass_before_shot'] == 1
        df_passes = df_shots[passes_mask].copy()
        
        if len(df_passes) > 0:
            # Select xA model features
            X_xa_predict = df_passes[XA_MODEL_FEATURES]
            
            # Predict xA probability
            # XA_MODEL.predict_proba returns [[Prob of No Goal, Prob of Goal]]
            # We take the second column [:, 1] because that's the probability of a GOAL (the xA value)
            raw_xa = XA_MODEL.predict_proba(X_xa_predict)[:, 1]
            
            # Calibrate xA values (similar to xG calibration)
            # xA values should be similar to xG but from pass perspective
            CALIBRATION_FACTOR_XA = 3.5  # Same as xG
            df_passes['xA_Value'] = np.power(raw_xa, CALIBRATION_FACTOR_XA)
            
            # Cap xA values (similar to xG)
            df_passes['xA_Value'] = df_passes['xA_Value'].clip(upper=0.50)
            
            # Scale down to match realistic xA ranges
            # xA should be slightly lower than xG on average (passes are less direct than shots)
            SCALE_FACTOR_XA = 0.15  # Slightly lower than xG scale factor
            df_passes['xA_Value'] = df_passes['xA_Value'] * SCALE_FACTOR_XA
            
            # Update xA values in main dataframe
            df_shots.loc[passes_mask, 'xA_Value'] = df_passes['xA_Value'].values
            
            print(f"Calculated xA for {len(df_passes)} passes that led to shots.")
        else:
            print("No passes found before shots. Skipping xA calculation.")
    else:
        print("xA model not loaded. Skipping Expected Assists calculation.")

    # --- SAVE RAW SHOTS TO DATABASE FOR VISUALIZATION ---
    print(f"\n💾 Saving {len(df_shots)} individual shot records to raw_shots table...")
    try:
        # Check if table exists by trying to query it
        try:
            test_query = supabase.table('raw_shots').select('id').limit(1).execute()
            has_raw_shots_table = True
        except Exception:
            has_raw_shots_table = False
            print("⚠️  raw_shots table not found. Skipping raw shots save.")
            print("   Run migration: supabase/migrations/20250120000000_create_raw_shots_table.sql")
        
        if not has_raw_shots_table:
            print(f"⚠️  Skipped saving {len(df_shots)} shot records (table not found).")
        elif len(df_shots) == 0:
            print("⚠️  No raw shots records to save.")
        else:
            # Prepare raw_shots records with all data
            raw_shots_records = []
            for idx, row in df_shots.iterrows():
                record = {
                    'game_id': int(row['game_id']),
                    'player_id': int(row['playerId']),
                    'passer_id': int(row['passer_id']) if pd.notna(row['passer_id']) and row['passer_id'] is not None else None,
                    'shot_x': float(row['shot_x']),
                    'shot_y': float(row['shot_y']),
                    'pass_x': float(row['pass_x']) if pd.notna(row['pass_x']) and row['pass_x'] is not None else None,
                    'pass_y': float(row['pass_y']) if pd.notna(row['pass_y']) and row['pass_y'] is not None else None,
                    'shot_type_code': int(row['shot_type_code']),
                    'shot_type': str(row['shot_type']),
                    'is_goal': bool(row['is_goal']),
                    'distance': float(row['distance']),
                    'angle': float(row['angle']),
                    'is_rebound': bool(row['is_rebound']),
                    'is_power_play': bool(row['is_power_play']),
                    'score_differential': int(row['score_differential']) if pd.notna(row['score_differential']) else None,
                    'has_pass_before_shot': bool(row['has_pass_before_shot']),
                    'pass_lateral_distance': float(row['pass_lateral_distance']) if pd.notna(row['pass_lateral_distance']) else None,
                    'pass_to_net_distance': float(row['pass_to_net_distance']) if pd.notna(row['pass_to_net_distance']) else None,
                    'pass_zone': str(row['pass_zone']) if pd.notna(row['pass_zone']) else None,
                    'pass_immediacy_score': float(row['pass_immediacy_score']) if pd.notna(row['pass_immediacy_score']) else None,
                    'goalie_movement_score': float(row['goalie_movement_score']) if pd.notna(row['goalie_movement_score']) else None,
                    'pass_quality_score': float(row['pass_quality_score']) if pd.notna(row['pass_quality_score']) else None,
                    'time_before_shot': float(row['time_before_shot']) if pd.notna(row['time_before_shot']) else None,
                    'pass_angle': float(row['pass_angle']) if pd.notna(row['pass_angle']) else None,
                    'normalized_lateral_distance': float(row['normalized_lateral_distance']) if pd.notna(row['normalized_lateral_distance']) else None,
                    'zone_relative_distance': float(row['zone_relative_distance']) if pd.notna(row['zone_relative_distance']) else None,
                    'xg_value': float(row['xG_Value']),
                    'xa_value': float(row['xA_Value']) if pd.notna(row['xA_Value']) and row['xA_Value'] > 0 else None,
                    'shot_type_encoded': int(row['shot_type_encoded']),
                    'pass_zone_encoded': int(row['pass_zone_encoded']) if pd.notna(row['pass_zone_encoded']) else None,
                    # ENHANCED FEATURES (matching MoneyPuck)
                    # Situation features
                    'home_skaters_on_ice': int(row['home_skaters_on_ice']) if pd.notna(row.get('home_skaters_on_ice')) else None,
                    'away_skaters_on_ice': int(row['away_skaters_on_ice']) if pd.notna(row.get('away_skaters_on_ice')) else None,
                    'is_empty_net': bool(row.get('is_empty_net', 0)) if pd.notna(row.get('is_empty_net')) else False,
                    'penalty_length': int(row['penalty_length']) if pd.notna(row.get('penalty_length')) else None,
                    'penalty_time_left': int(row['penalty_time_left']) if pd.notna(row.get('penalty_time_left')) else None,
                    # Last event features
                    'last_event_category': str(row['last_event_category']) if pd.notna(row.get('last_event_category')) else None,
                    'last_event_x': float(row['last_event_x']) if pd.notna(row.get('last_event_x')) else None,
                    'last_event_y': float(row['last_event_y']) if pd.notna(row.get('last_event_y')) else None,
                    'last_event_team': str(row['last_event_team']) if pd.notna(row.get('last_event_team')) else None,
                    'distance_from_last_event': float(row['distance_from_last_event']) if pd.notna(row.get('distance_from_last_event')) else None,
                    'time_since_last_event': float(row['time_since_last_event']) if pd.notna(row.get('time_since_last_event')) else None,
                    'speed_from_last_event': float(row['speed_from_last_event']) if pd.notna(row.get('speed_from_last_event')) else None,
                    # Goalie features
                    'goalie_id': int(row['goalie_id']) if pd.notna(row.get('goalie_id')) else None,
                    'goalie_name': str(row['goalie_name']) if pd.notna(row.get('goalie_name')) else None,
                    # Period/time features
                    'period': int(row['period']) if pd.notna(row.get('period')) else None,
                    'time_in_period': str(row['time_in_period']) if pd.notna(row.get('time_in_period')) else None,
                    'time_remaining_seconds': int(row['time_remaining_seconds']) if pd.notna(row.get('time_remaining_seconds')) else None,
                    'time_since_faceoff': float(row['time_since_faceoff']) if pd.notna(row.get('time_since_faceoff')) else None,
                    # Team context features
                    'team_code': str(row['team_code']) if pd.notna(row.get('team_code')) else None,
                    'shooting_team_code': str(row['shooting_team_code']) if pd.notna(row.get('shooting_team_code')) else None,  # MoneyPuck feature
                    'defending_team_code': str(row['defending_team_code']) if pd.notna(row.get('defending_team_code')) else None,  # MoneyPuck feature
                    'is_home_team': bool(row.get('is_home_team', 0)) if pd.notna(row.get('is_home_team')) else None,
                    'zone': str(row['zone']) if pd.notna(row.get('zone')) else None,
                    'home_score': int(row['home_score']) if pd.notna(row.get('home_score')) else None,
                    'away_score': int(row['away_score']) if pd.notna(row.get('away_score')) else None,
                    # Shot outcome features
                    'shot_was_on_goal': bool(row.get('shot_was_on_goal', 0)) if pd.notna(row.get('shot_was_on_goal')) else False,
                    'shot_goalie_froze': bool(row.get('shot_goalie_froze', 0)) if pd.notna(row.get('shot_goalie_froze')) else False,
                    'shot_generated_rebound': bool(row.get('shot_generated_rebound', 0)) if pd.notna(row.get('shot_generated_rebound')) else False,
                    'shot_play_stopped': bool(row.get('shot_play_stopped', 0)) if pd.notna(row.get('shot_play_stopped')) else False,
                    'shot_play_continued_in_zone': bool(row.get('shot_play_continued_in_zone', 0)) if pd.notna(row.get('shot_play_continued_in_zone')) else False,
                    'shot_play_continued_outside_zone': bool(row.get('shot_play_continued_outside_zone', 0)) if pd.notna(row.get('shot_play_continued_outside_zone')) else False,
                    # Rush detection
                    'is_rush': bool(row.get('is_rush', 0)) if pd.notna(row.get('is_rush')) else False,
                    # ADDITIONAL RAW DATA FIELDS (maximize extraction)
                    'event_id': int(row['event_id']) if pd.notna(row.get('event_id')) else None,
                    'sort_order': int(row['sort_order']) if pd.notna(row.get('sort_order')) else None,
                    'type_desc': str(row['type_desc']) if pd.notna(row.get('type_desc')) else None,
                    'period_type': str(row['period_type']) if pd.notna(row.get('period_type')) else None,
                    'time_remaining': str(row['time_remaining']) if pd.notna(row.get('time_remaining')) else None,
                    'situation_code': str(row['situation_code']) if pd.notna(row.get('situation_code')) else None,
                    'home_team_defending_side': str(row['home_team_defending_side']) if pd.notna(row.get('home_team_defending_side')) else None,
                    'zone_code': str(row['zone_code']) if pd.notna(row.get('zone_code')) else None,
                    'shooting_player_id': int(row['shooting_player_id']) if pd.notna(row.get('shooting_player_id')) else None,
                    'scoring_player_id': int(row['scoring_player_id']) if pd.notna(row.get('scoring_player_id')) else None,
                    'assist1_player_id': int(row['assist1_player_id']) if pd.notna(row.get('assist1_player_id')) else None,
                    'assist2_player_id': int(row['assist2_player_id']) if pd.notna(row.get('assist2_player_id')) else None,
                    'goalie_in_net_id': int(row['goalie_in_net_id']) if pd.notna(row.get('goalie_in_net_id')) else None,
                    'event_owner_team_id': int(row['event_owner_team_id']) if pd.notna(row.get('event_owner_team_id')) else None,
                    'home_team_id': int(row['home_team_id']) if pd.notna(row.get('home_team_id')) else None,
                    'away_team_id': int(row['away_team_id']) if pd.notna(row.get('away_team_id')) else None,
                    'home_team_abbrev': str(row['home_team_abbrev']) if pd.notna(row.get('home_team_abbrev')) else None,
                    'away_team_abbrev': str(row['away_team_abbrev']) if pd.notna(row.get('away_team_abbrev')) else None,
                    'away_sog': int(row['away_sog']) if pd.notna(row.get('away_sog')) else None,
                    'home_sog': int(row['home_sog']) if pd.notna(row.get('home_sog')) else None,
                    'shot_type_raw': str(row['shot_type_raw']) if pd.notna(row.get('shot_type_raw')) else None,
                    'miss_reason': str(row['miss_reason']) if pd.notna(row.get('miss_reason')) else None,
                    # CALCULATED FEATURES (from feature_calculations.py)
                    'last_event_shot_angle': float(row['last_event_shot_angle']) if pd.notna(row.get('last_event_shot_angle')) else None,
                    'last_event_shot_distance': float(row['last_event_shot_distance']) if pd.notna(row.get('last_event_shot_distance')) else None,
                    'player_num_that_did_last_event': int(row['player_num_that_did_last_event']) if pd.notna(row.get('player_num_that_did_last_event')) else None,
                    'arena_adjusted_x': float(row['arena_adjusted_x']) if pd.notna(row.get('arena_adjusted_x')) else None,
                    'arena_adjusted_y': float(row['arena_adjusted_y']) if pd.notna(row.get('arena_adjusted_y')) else None,
                    'arena_adjusted_x_abs': float(row['arena_adjusted_x_abs']) if pd.notna(row.get('arena_adjusted_x_abs')) else None,
                    'arena_adjusted_y_abs': float(row['arena_adjusted_y_abs']) if pd.notna(row.get('arena_adjusted_y_abs')) else None,
                    'arena_adjusted_shot_distance': float(row['arena_adjusted_shot_distance']) if pd.notna(row.get('arena_adjusted_shot_distance')) else None,
                    'shot_angle_plus_rebound': float(row['shot_angle_plus_rebound']) if pd.notna(row.get('shot_angle_plus_rebound')) else None,
                    'shot_angle_plus_rebound_speed': float(row['shot_angle_plus_rebound_speed']) if pd.notna(row.get('shot_angle_plus_rebound_speed')) else None,
                }
                # Remove None values to avoid database issues (but keep nullable fields)
                nullable_fields = ['passer_id', 'pass_x', 'pass_y', 'pass_lateral_distance', 'pass_to_net_distance', 
                                 'pass_zone', 'pass_immediacy_score', 'goalie_movement_score', 'pass_quality_score', 
                                 'time_before_shot', 'pass_angle', 'xa_value', 'pass_zone_encoded', 
                                 'normalized_lateral_distance', 'zone_relative_distance', 'score_differential',
                                 # Enhanced features (nullable)
                                 'home_skaters_on_ice', 'away_skaters_on_ice', 'penalty_length', 'penalty_time_left',
                                 'last_event_category', 'last_event_x', 'last_event_y', 'last_event_team',
                                 'distance_from_last_event', 'time_since_last_event', 'speed_from_last_event',
                                 'goalie_id', 'goalie_name', 'period', 'time_in_period', 'time_remaining_seconds',
                                 'time_since_faceoff', 'team_code', 'shooting_team_code', 'defending_team_code', 'is_home_team', 'zone', 'home_score', 'away_score',
                                 # Additional raw data fields (nullable)
                                 'event_id', 'sort_order', 'type_desc', 'period_type', 'time_remaining',
                                 'situation_code', 'home_team_defending_side', 'zone_code', 'shooting_player_id',
                                 'scoring_player_id', 'assist1_player_id', 'assist2_player_id', 'goalie_in_net_id',
                                 'event_owner_team_id', 'home_team_id', 'away_team_id', 'home_team_abbrev',
                                 'away_team_abbrev', 'away_sog', 'home_sog', 'shot_type_raw', 'miss_reason',
                                 # Calculated features (nullable)
                                 'last_event_shot_angle', 'last_event_shot_distance', 'player_num_that_did_last_event',
                                 'arena_adjusted_x', 'arena_adjusted_y', 'arena_adjusted_x_abs', 'arena_adjusted_y_abs',
                                 'arena_adjusted_shot_distance', 'shot_angle_plus_rebound', 'shot_angle_plus_rebound_speed']
                record = {k: v for k, v in record.items() if v is not None or k in nullable_fields}
                raw_shots_records.append(record)
            
            # CRITICAL FIX: Filter out duplicates based on unique constraint BEFORE batching
            # The unique constraint is: (game_id, player_id, shot_x, shot_y, shot_type_code)
            # This prevents "ON CONFLICT DO UPDATE command cannot affect row a second time" errors
            print(f"  🔍 Deduplicating {len(raw_shots_records)} shot records...")
            df_shots_to_save = pd.DataFrame(raw_shots_records)
            
            # Drop duplicates based on the unique constraint columns
            initial_count = len(df_shots_to_save)
            df_shots_to_save = df_shots_to_save.drop_duplicates(
                subset=['game_id', 'player_id', 'shot_x', 'shot_y', 'shot_type_code'],
                keep='first',  # Keep first occurrence of duplicates
                inplace=False
            )
            duplicates_removed = initial_count - len(df_shots_to_save)
            
            if duplicates_removed > 0:
                print(f"  ⚠️  Removed {duplicates_removed} duplicate shot record(s) before upload")
            
            # Convert back to list of records for batching
            cleaned_shot_records = df_shots_to_save.to_dict(orient='records')
            
            # Clean NaN values and ensure proper types - replace with None for JSON compatibility
            # Integer fields that must be actual ints, not floats
            integer_fields = ['game_id', 'player_id', 'passer_id', 'shot_type_code', 
                            'score_differential', 'shot_type_encoded', 'pass_zone_encoded',
                            'event_id', 'sort_order', 'shooting_player_id', 'scoring_player_id',
                            'assist1_player_id', 'assist2_player_id', 'goalie_in_net_id',
                            'event_owner_team_id', 'home_team_id', 'away_team_id',
                            'away_sog', 'home_sog', 'home_skaters_on_ice', 'away_skaters_on_ice',
                            'penalty_length', 'penalty_time_left', 'goalie_id', 'period',
                            'time_remaining_seconds', 'home_score', 'away_score',
                            'player_num_that_did_last_event']
            
            def clean_nan_values(record):
                """Replace NaN values with None and ensure integer fields are actual ints"""
                cleaned = {}
                for k, v in record.items():
                    # Handle NaN values
                    if isinstance(v, float) and (math.isnan(v) or pd.isna(v)):
                        cleaned[k] = None
                    elif pd.isna(v):
                        cleaned[k] = None
                    # Ensure integer fields are actual integers (not floats like 13.0)
                    elif k in integer_fields and v is not None:
                        try:
                            # Convert to int if it's a float that represents a whole number
                            if isinstance(v, float):
                                if math.isnan(v) or pd.isna(v):
                                    cleaned[k] = None
                                elif v.is_integer():
                                    cleaned[k] = int(v)
                                else:
                                    # Float that's not a whole number - might be an ID that got converted
                                    # Try to convert anyway (some IDs might be stored as floats)
                                    cleaned[k] = int(v)
                            elif isinstance(v, (int, str)):
                                # Try to convert string to int
                                if isinstance(v, str) and v.replace('.', '').replace('-', '').isdigit():
                                    cleaned[k] = int(float(v))
                                else:
                                    cleaned[k] = int(v) if isinstance(v, int) else v
                            else:
                                cleaned[k] = v
                        except (ValueError, TypeError, OverflowError) as e:
                            # If conversion fails, set to None
                            print(f"  ⚠️  Warning: Could not convert {k}: {v} ({type(v)}) to int: {e}")
                            cleaned[k] = None
                    else:
                        cleaned[k] = v
                return cleaned
            
            cleaned_shot_records = [clean_nan_values(record) for record in cleaned_shot_records]
            print(f"  ✅ {len(cleaned_shot_records)} unique shot records ready for upload")
            
            # Upload to raw_shots table using upsert with batch processing
            # Process in chunks of 1000 to avoid memory issues and improve reliability
            BATCH_SIZE = 1000
            total_saved = 0
            
            for i in range(0, len(cleaned_shot_records), BATCH_SIZE):
                batch = cleaned_shot_records[i:i + BATCH_SIZE]
                batch_num = (i // BATCH_SIZE) + 1
                total_batches = (len(cleaned_shot_records) + BATCH_SIZE - 1) // BATCH_SIZE
                
                try:
                    # Use upsert with unique constraint: game_id, player_id, shot_x, shot_y, shot_type_code
                    # This will update existing records or insert new ones
                    # Note: Supabase requires the constraint to exist. If it doesn't, this will fail.
                    response = supabase.table('raw_shots').upsert(
                        batch,
                        on_conflict='game_id,player_id,shot_x,shot_y,shot_type_code'
                    ).execute()
                    
                    # Note: Supabase upsert doesn't return count of updated vs inserted
                    # We'll just track total records processed
                    total_saved += len(batch)
                    print(f"  📦 Batch {batch_num}/{total_batches}: Processed {len(batch)} records...")
                    
                except Exception as batch_error:
                    error_msg = str(batch_error)
                    # Check if error is due to missing constraint
                    if 'constraint' in error_msg.lower() or 'unique' in error_msg.lower():
                        print(f"  ⚠️  Error: Unique constraint not found. Run migration:")
                        print(f"     supabase/migrations/20250120000001_add_raw_shots_unique_constraint.sql")
                        print(f"  Attempting fallback insert (may create duplicates)...")
                        # Fallback to regular insert (will fail on duplicates, but that's okay)
                        try:
                            supabase.table('raw_shots').insert(batch).execute()
                            total_saved += len(batch)
                            print(f"  📦 Batch {batch_num}/{total_batches}: Inserted {len(batch)} records (fallback mode)...")
                        except Exception as insert_error:
                            print(f"  ❌ Fallback insert also failed: {insert_error}")
                            # Try individual inserts as last resort
                            for record in batch:
                                try:
                                    supabase.table('raw_shots').insert([record]).execute()
                                    total_saved += 1
                                except Exception:
                                    pass  # Skip duplicates silently
                    else:
                        print(f"  ⚠️  Error processing batch {batch_num}: {batch_error}")
                        # Try individual inserts for this batch as fallback
                        for record in batch:
                            try:
                                supabase.table('raw_shots').upsert(
                                    [record],
                                    on_conflict='game_id,player_id,shot_x,shot_y,shot_type_code'
                                ).execute()
                                total_saved += 1
                            except Exception as record_error:
                                # Last resort: try insert (will fail on duplicates)
                                try:
                                    supabase.table('raw_shots').insert([record]).execute()
                                    total_saved += 1
                                except Exception:
                                    pass  # Skip duplicates silently
            
            print(f"✅ Successfully saved/updated {total_saved} shot records to raw_shots table.")
            
    except Exception as e:
        print(f"⚠️  Error saving raw shots to database: {e}")
        import traceback
        traceback.print_exc()
        print("   Continuing with aggregation...")

    # 3. Aggregate xG per player (shooter) for the final stats table
    # This groups all the calculated xG values and sums them up per player and per game.
    final_stats_df_xg = df_shots.groupby(['playerId', 'game_id']).agg(
        # I_F_xGoals (Individual For Expected Goals) is the sum of all xG values for the player's shots
        I_F_xGoals=('xG_Value', 'sum')
        # NOTE: This is where you would add the complex logic for GSAx, OnIce_xGoalsPercentage, etc.
        # Removed total_shots as it's not in the database schema
    ).reset_index()

    print(f"Calculated xG for {len(final_stats_df_xg)} unique player/game combinations.")
    
    # 4. Aggregate xA per passer for the final stats table
    # Only aggregate for passes that led to shots (passer_id is not None)
    if XA_MODEL and XA_MODEL_FEATURES:
        passes_with_xa = df_shots[df_shots['passer_id'].notna() & (df_shots['xA_Value'] > 0)].copy()
        
        if len(passes_with_xa) > 0:
            final_stats_df_xa = passes_with_xa.groupby(['passer_id', 'game_id']).agg(
                # I_F_xAssists (Individual For Expected Assists) is the sum of all xA values for the player's passes
                I_F_xAssists=('xA_Value', 'sum')
            ).reset_index()
            
            # Rename passer_id to playerId for consistency with database schema
            final_stats_df_xa = final_stats_df_xa.rename(columns={'passer_id': 'playerId'})
            
            print(f"Calculated xA for {len(final_stats_df_xa)} unique passer/game combinations.")
            
            # Merge xG and xA dataframes
            # Some players may have both xG (as shooters) and xA (as passers)
            final_stats_df = final_stats_df_xg.merge(
                final_stats_df_xa,
                on=['playerId', 'game_id'],
                how='outer',
                suffixes=('', '_xa')
            )
            
            # Fill NaN values with 0 (players who only shot or only passed)
            final_stats_df['I_F_xGoals'] = final_stats_df['I_F_xGoals'].fillna(0.0)
            final_stats_df['I_F_xAssists'] = final_stats_df['I_F_xAssists'].fillna(0.0)
            
            return final_stats_df
        else:
            print("No passes with xA values found. Returning only xG data.")
            # Add I_F_xAssists column with 0 values for consistency
            final_stats_df_xg['I_F_xAssists'] = 0.0
            return final_stats_df_xg
    else:
        # No xA model, return only xG data
        # Add I_F_xAssists column with 0 values for consistency
        final_stats_df_xg['I_F_xAssists'] = 0.0
        return final_stats_df_xg




# --- 2. MAIN EXECUTION ---
if __name__ == "__main__":
    import sys
    
    # Allow date to be passed as command-line argument
    date_str = '2025-12-07'  # Default date
    if len(sys.argv) > 1:
        date_str = sys.argv[1]
        print(f"Using date from command line: {date_str}")
    else:
        print(f"Using default date: {date_str}")
        print("  (To specify a different date, run: python data_acquisition.py YYYY-MM-DD)")
    
    print("Starting Advanced Stats Pipeline...")
    print()
    final_stats_df = scrape_pbp_and_process(date_str=date_str)
    
    if final_stats_df is not None and not final_stats_df.empty:
        print(f"Data processing complete. {len(final_stats_df)} records ready for upload.")
        
        # --- UPLOAD TO SUPABASE ---
        # Check if I_F_xAssists column exists by trying a test query
        try:
            test_query = supabase.table('raw_player_stats').select('I_F_xAssists').limit(1).execute()
            has_xa_column = True
        except Exception:
            # Column doesn't exist, remove it from upload data
            has_xa_column = False
            if 'I_F_xAssists' in final_stats_df.columns:
                print("⚠️  I_F_xAssists column not found in database. Uploading xG data only.")
                final_stats_df = final_stats_df.drop(columns=['I_F_xAssists'])
        
        # Ensure proper data types for database upload
        # playerId and game_id should be integers (not floats)
        final_stats_df['playerId'] = final_stats_df['playerId'].astype(int)
        final_stats_df['game_id'] = final_stats_df['game_id'].astype(int)
        # I_F_xGoals should be numeric (float is fine)
        final_stats_df['I_F_xGoals'] = final_stats_df['I_F_xGoals'].astype(float)
        
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

