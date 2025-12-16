#!/usr/bin/env python3
"""
calculate_player_toi.py
Calculate Time On Ice (TOI) for each player by game situation (5v5, PP, PK).

This script:
1. Loads play-by-play data from NHL API or processes stored game data
2. Tracks player shifts (line changes, period starts, goals, penalties)
3. Identifies game situations (5v5, PP, PK) for each shift
4. Calculates TOI per situation for each player
5. Stores results in player_toi_by_situation and player_shifts tables

Note: This is a foundational script for GAR calculations. It requires access to
play-by-play data with shift/line change information.
"""

import pandas as pd
import numpy as np
import os
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime
from typing import Dict, List, Set, Optional, Tuple
import time

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

# NHL API base URLs
NHL_BASE_URL = "https://api-web.nhle.com/v1"  # Modern API for PBP
NHL_LEGACY_BASE_URL = "https://api.nhle.com/stats/rest/en"  # Legacy API for shifts

# Situation identification constants
SITUATION_5V5 = "5v5"
SITUATION_PP = "PP"  # Power Play
SITUATION_PK = "PK"  # Penalty Kill


def parse_time_to_seconds(time_str: str) -> float:
    """
    Parse time string (MM:SS) to seconds.
    
    Args:
        time_str: Time string in format "MM:SS" or "M:SS"
    
    Returns:
        Time in seconds as float
    """
    if not time_str or time_str == '':
        return 0.0
    
    try:
        parts = time_str.split(':')
        if len(parts) == 2:
            minutes = int(parts[0])
            seconds = int(parts[1])
            return minutes * 60.0 + seconds
        return 0.0
    except (ValueError, IndexError):
        return 0.0


def parse_shift_time(time_str: str) -> Optional[float]:
    """
    Parse MM:SS format to seconds (for shift data).
    Handles period-end shifts (20:00).
    
    Args:
        time_str: Time string in "MM:SS" format (e.g., "01:36" or "20:00")
    
    Returns:
        Seconds as float, or None if invalid
    """
    if not time_str or not isinstance(time_str, str):
        return None
    
    try:
        parts = time_str.split(':')
        if len(parts) != 2:
            return None
        minutes = int(parts[0])
        seconds = int(parts[1])
        
        # Special case: "20:00" is valid (period end)
        if minutes == 20 and seconds == 0:
            return 20 * 60.0  # 1200 seconds = 20 minutes
        
        # Validate range (0-19 minutes, 0-59 seconds)
        if minutes < 0 or minutes > 19 or seconds < 0 or seconds > 59:
            return None
        
        return minutes * 60.0 + seconds
    except (ValueError, IndexError, AttributeError):
        return None


def calculate_running_game_clock(period: int, time_in_period_seconds: float) -> Optional[float]:
    """
    Convert period + time to running game clock.
    
    Args:
        period: Period number (1, 2, 3, 4+)
        time_in_period_seconds: Time in period in seconds
    
    Returns:
        Running game clock in seconds, or None if invalid
    """
    if period < 1 or period > 10:  # Reasonable max (overtime periods)
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


def fetch_official_shifts(game_id: int) -> Tuple[bool, List[Dict], List[str]]:
    """
    Fetch official shift data from NHL Legacy API with validation.
    
    Args:
        game_id: NHL game ID
    
    Returns:
        Tuple of (success, shifts_list, error_messages)
    """
    url = f"{NHL_LEGACY_BASE_URL}/shiftcharts?cayenneExp=gameId={game_id}"
    
    errors = []
    
    try:
        response = requests.get(url, timeout=15)
        
        if response.status_code != 200:
            errors.append(f"API returned status code {response.status_code}")
            return False, [], errors
        
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            errors.append(f"Invalid JSON response: {e}")
            return False, [], errors
        
        # Check response structure
        if not isinstance(data, dict):
            errors.append(f"Expected dict response, got {type(data)}")
            return False, [], errors
        
        if 'data' not in data:
            errors.append("Response missing 'data' key")
            return False, [], errors
        
        shifts = data.get('data', [])
        
        if not isinstance(shifts, list):
            errors.append(f"Expected list in 'data', got {type(shifts)}")
            return False, [], errors
        
        # Validate shifts (basic validation - full validation happens later)
        valid_shifts = []
        for shift in shifts:
            # Basic field check
            if all(key in shift for key in ['playerId', 'gameId', 'period', 'startTime', 'endTime']):
                # Parse times to validate
                start_seconds = parse_shift_time(shift.get('startTime'))
                end_seconds = parse_shift_time(shift.get('endTime'))
                if start_seconds is not None and end_seconds is not None:
                    if end_seconds > start_seconds or end_seconds == 1200.0:  # Allow period-end
                        valid_shifts.append(shift)
        
        return True, valid_shifts, errors
        
    except requests.exceptions.Timeout:
        errors.append("Request timeout (15s)")
        return False, [], errors
    
    except requests.exceptions.RequestException as e:
        errors.append(f"Request error: {e}")
        return False, [], errors
    
    except Exception as e:
        errors.append(f"Unexpected error: {e}")
        return False, [], errors


def parse_situation_code(situation_code: str, event_owner_team_id: int, 
                         home_team_id: int) -> Tuple[int, int, bool]:
    """
    Parse situation_code to extract skaters on ice.
    
    Args:
        situation_code: Situation code from NHL API (e.g., "5-4", "5v4", "1551")
        event_owner_team_id: Team ID that owns the event
        home_team_id: Home team ID
    
    Returns:
        Tuple of (home_skaters, away_skaters, is_empty_net)
    """
    home_skaters = 5
    away_skaters = 5
    is_empty_net = False
    
    if not situation_code or situation_code == '':
        return home_skaters, away_skaters, is_empty_net
    
    situation_str = str(situation_code).strip()
    
    # Try parsing as string first (format: "5-4" or "5v4")
    if '-' in situation_str or 'v' in situation_str or 'V' in situation_str:
        parts = situation_str.replace('v', '-').replace('V', '-').split('-')
        if len(parts) >= 2:
            try:
                home_skaters = int(parts[0])
                away_skaters = int(parts[1])
            except ValueError:
                pass
    else:
        # Parse numeric format (e.g., 1551, 541, 641)
        try:
            code_int = int(situation_str)
            code_str = str(code_int)
            
            if len(code_str) == 3:
                # 3-digit: ABC -> A=home, B=away
                home_skaters = int(code_str[0])
                away_skaters = int(code_str[1])
            elif len(code_str) == 4:
                # 4-digit: ABCD -> B=home, C=away (digits 1-2)
                home_skaters = int(code_str[1])
                away_skaters = int(code_str[2])
            elif len(code_str) == 2:
                # 2-digit: AB -> A=home, B=away
                home_skaters = int(code_str[0])
                away_skaters = int(code_str[1])
        except (ValueError, IndexError):
            pass
    
    # Check for empty net (either team has 6 skaters)
    if home_skaters == 6 or away_skaters == 6:
        is_empty_net = True
    
    return home_skaters, away_skaters, is_empty_net


def identify_situation(home_skaters: int, away_skaters: int, 
                      is_empty_net: bool, shooting_team_id: int,
                      home_team_id: int) -> str:
    """
    Identify game situation (5v5, PP, PK) based on skaters on ice.
    
    Args:
        home_skaters: Number of home team skaters on ice
        away_skaters: Number of away team skaters on ice
        is_empty_net: Whether empty net situation
        shooting_team_id: Team ID that is shooting (or event owner)
        home_team_id: Home team ID
    
    Returns:
        Situation string: "5v5", "PP", or "PK"
    """
    # Empty net situations are typically 5v5 conceptually (but with goalie pulled)
    if is_empty_net:
        return SITUATION_5V5  # Treat empty net as 5v5 for now
    
    # Even strength
    if home_skaters == 5 and away_skaters == 5:
        return SITUATION_5V5
    
    # Determine if shooting team has man advantage (PP) or disadvantage (PK)
    is_home_shooting = (shooting_team_id == home_team_id) if shooting_team_id and home_team_id else None
    
    if is_home_shooting is not None:
        if is_home_shooting:
            # Home team shooting
            if home_skaters > away_skaters:
                return SITUATION_PP  # Home team on power play
            elif home_skaters < away_skaters:
                return SITUATION_PK  # Home team on penalty kill
        else:
            # Away team shooting
            if away_skaters > home_skaters:
                return SITUATION_PP  # Away team on power play
            elif away_skaters < home_skaters:
                return SITUATION_PK  # Away team on penalty kill
    
    # Default to 5v5 if unclear
    return SITUATION_5V5


class ShiftTracker:
    """
    Tracks player shifts and calculates TOI by situation.
    """
    
    def __init__(self, game_id: int, home_team_id: int, away_team_id: int):
        self.game_id = game_id
        self.home_team_id = home_team_id
        self.away_team_id = away_team_id
        
        # Track active shifts: {player_id: {period: (start_time, situation)}}
        self.active_shifts: Dict[int, Dict[int, Tuple[float, str]]] = {}
        
        # Store completed shifts
        self.completed_shifts: List[Dict] = []
        
        # Track current situation per period
        self.current_situation: Dict[int, str] = {}  # {period: situation}
        
        # Track players on ice per team per period
        self.players_on_ice: Dict[int, Dict[int, Set[int]]] = {}  # {team_id: {period: set(player_ids)}}
    
    def start_shift(self, player_id: int, team_id: int, period: int, 
                   time_seconds: float, situation: str):
        """Start a new shift for a player."""
        # End any existing shift for this player in this period
        self.end_shift(player_id, team_id, period, time_seconds)
        
        # Initialize if needed
        if player_id not in self.active_shifts:
            self.active_shifts[player_id] = {}
        if team_id not in self.players_on_ice:
            self.players_on_ice[team_id] = {}
        if period not in self.players_on_ice[team_id]:
            self.players_on_ice[team_id][period] = set()
        
        # Start new shift
        self.active_shifts[player_id][period] = (time_seconds, situation)
        self.players_on_ice[team_id][period].add(player_id)
        self.current_situation[period] = situation
    
    def end_shift(self, player_id: int, team_id: int, period: int, 
                 time_seconds: float):
        """End an active shift for a player."""
        if player_id not in self.active_shifts:
            return
        if period not in self.active_shifts[player_id]:
            return
        
        start_time, situation = self.active_shifts[player_id][period]
        shift_duration = max(0, time_seconds - start_time)
        
        # Only record shifts with positive duration
        if shift_duration > 0:
            shift_record = {
                'player_id': player_id,
                'game_id': self.game_id,
                'period': period,
                'shift_start_time_seconds': start_time,
                'shift_end_time_seconds': time_seconds,
                'situation': situation,
                'team_id': team_id
            }
            self.completed_shifts.append(shift_record)
        
        # Remove from active shifts
        del self.active_shifts[player_id][period]
        
        # Remove from players on ice
        if team_id in self.players_on_ice and period in self.players_on_ice[team_id]:
            self.players_on_ice[team_id][period].discard(player_id)
    
    def update_situation(self, period: int, situation: str, time_seconds: float):
        """Update situation for a period (e.g., 5v5 -> PP)."""
        self.current_situation[period] = situation
        
        # Update all active shifts to new situation
        for player_id, periods in list(self.active_shifts.items()):
            if period in periods:
                start_time, _ = periods[period]
                # End old shift and start new one with new situation
                # We need team_id - get from players_on_ice
                team_id = None
                for tid, periods_dict in self.players_on_ice.items():
                    if period in periods_dict and player_id in periods_dict[period]:
                        team_id = tid
                        break
                
                if team_id:
                    self.end_shift(player_id, team_id, period, time_seconds)
                    self.start_shift(player_id, team_id, period, time_seconds, situation)
    
    def end_all_shifts_period(self, period: int, time_seconds: float):
        """End all active shifts at end of period."""
        for player_id, periods in list(self.active_shifts.items()):
            if period in periods:
                # Find team_id
                team_id = None
                for tid, periods_dict in self.players_on_ice.items():
                    if period in periods_dict and player_id in periods_dict[period]:
                        team_id = tid
                        break
                
                if team_id:
                    self.end_shift(player_id, team_id, period, time_seconds)
    
    def get_completed_shifts(self) -> List[Dict]:
        """Get all completed shifts."""
        return self.completed_shifts


def extract_players_from_event(play: Dict, home_team_id: int, away_team_id: int) -> Dict[int, int]:
    """
    Extract player IDs and their team IDs from a play event.
    
    Args:
        play: Play event dictionary
        home_team_id: Home team ID
        away_team_id: Away team ID
    
    Returns:
        Dictionary mapping player_id -> team_id
    """
    players = {}
    details = play.get('details', {})
    
    # Extract players from various event fields
    # Shooter/scorer
    if 'scoringPlayerId' in details:
        player_id = details['scoringPlayerId']
        team_id = details.get('eventOwnerTeamId')
        if player_id and team_id:
            players[player_id] = team_id
    
    if 'shootingPlayerId' in details:
        player_id = details['shootingPlayerId']
        team_id = details.get('eventOwnerTeamId')
        if player_id and team_id:
            players[player_id] = team_id
    
    # Assist players
    for i in range(1, 4):  # Up to 3 assists
        assist_key = f'assist{i}PlayerId'
        if assist_key in details:
            player_id = details[assist_key]
            team_id = details.get('eventOwnerTeamId')
            if player_id and team_id:
                players[player_id] = team_id
    
    # Penalty players
    if 'committingPlayerId' in details:
        player_id = details['committingPlayerId']
        # Committing player is on the team that committed the penalty
        # This might need to be inferred from context, but for now use eventOwnerTeamId
        team_id = details.get('eventOwnerTeamId')
        if player_id and team_id:
            players[player_id] = team_id
    
    if 'drawnByPlayerId' in details:
        player_id = details['drawnByPlayerId']
        # Drawn by player is on the team that drew the penalty (opposite of committing team)
        event_owner = details.get('eventOwnerTeamId')
        if event_owner:
            if event_owner == home_team_id:
                team_id = away_team_id
            else:
                team_id = home_team_id
            if player_id and team_id:
                players[player_id] = team_id
    
    # Goalie (save) - goalie is on the defending team
    if 'goalieInNetId' in details:
        player_id = details['goalieInNetId']
        # Goalie is on the team that was defending (opposite of event owner for shots/goals)
        event_owner = details.get('eventOwnerTeamId')
        if event_owner:
            if event_owner == home_team_id:
                team_id = away_team_id  # Away goalie defending
            else:
                team_id = home_team_id  # Home goalie defending
            if player_id and team_id:
                players[player_id] = team_id
    
    # Hit players - need to infer team from event context
    if 'hittingPlayerId' in details:
        player_id = details['hittingPlayerId']
        # Hitting player is typically on the event owner team
        team_id = details.get('eventOwnerTeamId')
        if player_id and team_id:
            players[player_id] = team_id
    
    if 'hitteePlayerId' in details:
        player_id = details['hitteePlayerId']
        # Hittee is on the opposite team
        event_owner = details.get('eventOwnerTeamId')
        if event_owner:
            if event_owner == home_team_id:
                team_id = away_team_id
            else:
                team_id = home_team_id
            if player_id and team_id:
                players[player_id] = team_id
    
    return players


def process_game_shifts(game_id: int) -> Tuple[List[Dict], List[Dict]]:
    """
    Process official shift data for a game and calculate TOI by situation.
    Uses official NHL shift data instead of heuristic inference.
    
    Args:
        game_id: NHL game ID
    
    Returns:
        Tuple of (shifts_list, toi_by_situation_list)
    """
    print(f"Processing shifts for game {game_id}...")
    
    # Step 1: Fetch official shift data
    print(f"  Fetching official shift data...")
    success, raw_shifts, errors = fetch_official_shifts(game_id)
    
    if not success or not raw_shifts:
        print(f"  ERROR: Could not fetch shift data: {errors}")
        return [], []
    
    print(f"  ✅ Fetched {len(raw_shifts)} official shifts")
    
    # Step 2: Fetch play-by-play data for situation information
    print(f"  Fetching play-by-play data for situation tracking...")
    pbp_url = f"{NHL_BASE_URL}/gamecenter/{game_id}/play-by-play"
    
    try:
        response = requests.get(pbp_url, timeout=30)
        response.raise_for_status()
        pbp_data = response.json()
    except Exception as e:
        print(f"  ERROR: Error fetching PBP for game {game_id}: {e}")
        return [], []
    
    # Extract game info
    home_team_id = pbp_data.get('homeTeam', {}).get('id')
    away_team_id = pbp_data.get('awayTeam', {}).get('id')
    
    if not home_team_id or not away_team_id:
        print(f"  ERROR: Could not extract team IDs for game {game_id}")
        return [], []
    
    # Step 3: Build situation timeline from PBP
    print(f"  Building situation timeline from PBP...")
    situation_timeline = build_situation_timeline(pbp_data, home_team_id, away_team_id)
    
    # Step 4: Process shifts with running game clock and situation splitting
    print(f"  Processing shifts with situation splitting...")
    processed_shifts = []
    shifts_split = 0
    total_segments = 0
    
    for raw_shift in raw_shifts:
        player_id = raw_shift.get('playerId')
        period = raw_shift.get('period')
        start_time_str = raw_shift.get('startTime')
        end_time_str = raw_shift.get('endTime')
        team_id = raw_shift.get('teamId')
        
        # Parse times
        start_seconds = parse_shift_time(start_time_str)
        end_seconds = parse_shift_time(end_time_str)
        
        if start_seconds is None or end_seconds is None:
            continue  # Skip invalid shifts
        
        # Calculate running game clock
        start_game_clock = calculate_running_game_clock(period, start_seconds)
        end_game_clock = calculate_running_game_clock(period, end_seconds)
        
        if start_game_clock is None or end_game_clock is None:
            continue  # Skip invalid shifts
        
        # Create initial shift record
        shift_record = {
            'player_id': player_id,
            'game_id': game_id,
            'team_id': team_id,
            'period': period,
            'shift_start_time_seconds': start_seconds,
            'shift_end_time_seconds': end_seconds,
            'shift_start_game_clock': start_game_clock,
            'shift_end_game_clock': end_game_clock,
            'situation': '5v5',  # Will be set correctly by splitting
            'duration_seconds': end_game_clock - start_game_clock
        }
        
        # Split shift at situation boundaries
        shift_segments = split_shift_by_situation(shift_record, situation_timeline)
        
        if len(shift_segments) > 1:
            shifts_split += 1
        
        total_segments += len(shift_segments)
        processed_shifts.extend(shift_segments)
    
    print(f"  ✅ Processed {len(raw_shifts)} shifts into {total_segments} segments")
    if shifts_split > 0:
        print(f"  📊 Split {shifts_split} shifts at situation boundaries")
    
    # Step 5: Aggregate TOI by situation
    toi_by_situation = aggregate_toi_by_situation(processed_shifts)
    
    print(f"  ✅ Generated {len(toi_by_situation)} TOI records")
    
    return processed_shifts, toi_by_situation


def build_situation_timeline(pbp_data: Dict, home_team_id: int, away_team_id: int) -> List[Dict]:
    """
    Build a timeline of situation changes from play-by-play data.
    Only includes events where the situation actually changes.
    
    Args:
        pbp_data: Play-by-play data from NHL API
        home_team_id: Home team ID
        away_team_id: Away team ID
    
    Returns:
        List of situation change events with game clock times (sorted chronologically)
    """
    timeline = []
    plays = pbp_data.get('plays', [])
    previous_situation = None
    
    for play in plays:
        period_desc = play.get('periodDescriptor', {})
        period = period_desc.get('number', 1)
        time_str = play.get('timeInPeriod', '')
        time_seconds = parse_time_to_seconds(time_str)
        
        # Calculate running game clock
        game_clock = calculate_running_game_clock(period, time_seconds)
        if game_clock is None:
            continue
        
        # Parse situation
        situation_code = str(play.get('situationCode', ''))
        details = play.get('details', {})
        event_owner_team_id = details.get('eventOwnerTeamId')
        
        home_skaters, away_skaters, is_empty_net = parse_situation_code(
            situation_code, event_owner_team_id, home_team_id
        )
        
        situation = identify_situation(
            home_skaters, away_skaters, is_empty_net,
            event_owner_team_id, home_team_id
        )
        
        # Only add to timeline if situation changed
        if situation != previous_situation:
            timeline.append({
                'game_clock': game_clock,
                'period': period,
                'situation': situation,
                'time_seconds': time_seconds
            })
            previous_situation = situation
    
    # Sort by game clock to ensure chronological order
    timeline.sort(key=lambda x: x['game_clock'])
    
    return timeline


def get_situation_at_time(timeline: List[Dict], game_clock: float, period: int) -> str:
    """
    Get the situation at a specific game clock time.
    
    Args:
        timeline: Situation timeline from PBP
        game_clock: Running game clock time in seconds
        period: Period number
    
    Returns:
        Situation string ("5v5", "PP", or "PK")
    """
    # Find the most recent situation change before or at this time
    current_situation = "5v5"  # Default
    
    for event in timeline:
        if event['game_clock'] <= game_clock and event['period'] == period:
            current_situation = event['situation']
        elif event['game_clock'] > game_clock:
            break
    
    return current_situation


def split_shift_by_situation(shift: Dict, situation_timeline: List[Dict]) -> List[Dict]:
    """
    Split a shift into multiple segments based on situation changes.
    
    For any shift that overlaps a situation change event, split the single shift
    record into two or more adjacent shift segments, each attributed to the correct,
    non-overlapping situation.
    
    Args:
        shift: Shift record with shift_start_game_clock, shift_end_game_clock, period
        situation_timeline: Chronological list of situation change events
    
    Returns:
        List of shift segments, each with correct situation attribution
    """
    start_clock = shift['shift_start_game_clock']
    end_clock = shift['shift_end_game_clock']
    period = shift['period']
    
    # Find all situation changes that occur within this shift's duration
    # Condition: Shift_S < C_T < Shift_E
    situation_changes = []
    for event in situation_timeline:
        event_clock = event['game_clock']
        event_period = event['period']
        
        # Only consider events in the same period and within shift bounds
        if (event_period == period and 
            start_clock < event_clock < end_clock):
            situation_changes.append(event)
    
    # If no situation changes, return original shift
    if not situation_changes:
        return [shift]
    
    # Sort situation changes by game clock (should already be sorted, but ensure)
    situation_changes.sort(key=lambda x: x['game_clock'])
    
    # Determine initial situation (situation before shift started)
    initial_situation = get_situation_at_time(situation_timeline, start_clock, period)
    
    # Split the shift at each situation change
    segments = []
    segment_start = start_clock
    current_situation = initial_situation
    
    for change_event in situation_changes:
        change_clock = change_event['game_clock']
        new_situation = change_event['situation']
        
        # Create segment from segment_start to change_clock
        if segment_start < change_clock:
            segment = shift.copy()
            segment['shift_start_game_clock'] = segment_start
            segment['shift_end_game_clock'] = change_clock
            segment['situation'] = current_situation
            segment['duration_seconds'] = change_clock - segment_start
            
            # Recalculate period time for segment start/end
            # Find period and time for segment start
            segment_start_period = period
            segment_start_period_time = segment_start - ((period - 1) * 1200.0)
            if period > 3:
                segment_start_period_time = segment_start - 3600.0 - ((period - 4) * 300.0)
            
            segment_end_period_time = change_clock - ((period - 1) * 1200.0)
            if period > 3:
                segment_end_period_time = change_clock - 3600.0 - ((period - 4) * 300.0)
            
            segment['shift_start_time_seconds'] = segment_start_period_time
            segment['shift_end_time_seconds'] = segment_end_period_time
            
            segments.append(segment)
        
        # Update for next segment
        segment_start = change_clock
        current_situation = new_situation
    
    # Create final segment from last change to shift end
    if segment_start < end_clock:
        segment = shift.copy()
        segment['shift_start_game_clock'] = segment_start
        segment['shift_end_game_clock'] = end_clock
        segment['situation'] = current_situation
        segment['duration_seconds'] = end_clock - segment_start
        
        # Recalculate period time for segment start/end
        segment_start_period_time = segment_start - ((period - 1) * 1200.0)
        if period > 3:
            segment_start_period_time = segment_start - 3600.0 - ((period - 4) * 300.0)
        
        segment_end_period_time = end_clock - ((period - 1) * 1200.0)
        if period > 3:
            segment_end_period_time = end_clock - 3600.0 - ((period - 4) * 300.0)
        
        segment['shift_start_time_seconds'] = segment_start_period_time
        segment['shift_end_time_seconds'] = segment_end_period_time
        
        segments.append(segment)
    
    return segments


def aggregate_toi_by_situation(shifts: List[Dict]) -> List[Dict]:
    """
    Aggregate shifts into TOI by player, game, and situation.
    
    Args:
        shifts: List of shift dictionaries with game_clock times
    
    Returns:
        List of TOI records
    """
    if not shifts:
        return []
    
    # Group by player_id, game_id, situation
    toi_dict: Dict[Tuple[int, int, str], float] = {}
    
    for shift in shifts:
        key = (shift['player_id'], shift['game_id'], shift['situation'])
        # Use game clock duration for accuracy
        duration = shift.get('duration_seconds', 
                           shift['shift_end_game_clock'] - shift['shift_start_game_clock'])
        
        if key not in toi_dict:
            toi_dict[key] = 0.0
        toi_dict[key] += duration
    
    # Convert to list of records
    toi_records = []
    for (player_id, game_id, situation), toi_seconds in toi_dict.items():
        toi_records.append({
            'player_id': player_id,
            'game_id': game_id,
            'situation': situation,
            'toi_seconds': toi_seconds,
            'toi_minutes': toi_seconds / 60.0
        })
    
    return toi_records


def store_shifts_and_toi(shifts: List[Dict], toi_records: List[Dict]):
    """
    Store shifts and TOI data in Supabase.
    
    Args:
        shifts: List of shift records
        toi_records: List of TOI records
    """
    if not shifts and not toi_records:
        return
    
    print("=" * 80)
    print("STORING SHIFTS AND TOI DATA")
    print("=" * 80)
    
    # Store shifts (batch insert)
    if shifts:
        print(f"Storing {len(shifts)} shift records...")
        try:
            # Batch insert in chunks of 1000
            chunk_size = 1000
            for i in range(0, len(shifts), chunk_size):
                chunk = shifts[i:i + chunk_size]
                result = supabase.table('player_shifts').upsert(
                    chunk,
                    on_conflict='id'
                ).execute()
                print(f"  Stored shifts {i+1}-{min(i+chunk_size, len(shifts))}")
        except Exception as e:
            print(f"  ERROR: Error storing shifts: {e}")
    
    # Store TOI records (upsert)
    if toi_records:
        print(f"Storing {len(toi_records)} TOI records...")
        try:
            # Batch upsert in chunks of 1000
            chunk_size = 1000
            for i in range(0, len(toi_records), chunk_size):
                chunk = toi_records[i:i + chunk_size]
                result = supabase.table('player_toi_by_situation').upsert(
                    chunk,
                    on_conflict='player_id,game_id,situation'
                ).execute()
                print(f"  Stored TOI records {i+1}-{min(i+chunk_size, len(toi_records))}")
        except Exception as e:
            print(f"  ERROR: Error storing TOI records: {e}")


def get_game_ids_from_shots() -> List[int]:
    """
    Get list of game IDs from raw_shots table.
    
    Returns:
        List of unique game IDs
    """
    print("Loading game IDs from raw_shots table...")
    
    try:
        # Get distinct game_ids
        result = supabase.table('raw_shots').select('game_id').execute()
        
        if not result.data:
            print("  ⚠️  No games found in raw_shots table")
            return []
        
        game_ids = list(set([row['game_id'] for row in result.data]))
        game_ids.sort()
        
        print(f"  Found {len(game_ids)} unique games")
        return game_ids
    
    except Exception as e:
        print(f"  Error loading game IDs: {e}")
        return []


def main():
    """
    Main function to calculate and store TOI data.
    """
    print("=" * 80)
    print("CALCULATE PLAYER TOI BY SITUATION")
    print("=" * 80)
    print()
    
    # Get game IDs to process
    game_ids = get_game_ids_from_shots()
    
    if not game_ids:
        print("ERROR: No games found. Please ensure raw_shots table has data.")
        return
    
    print(f"Processing {len(game_ids)} games...")
    print()
    
    # Process each game
    all_shifts = []
    all_toi_records = []
    
    for idx, game_id in enumerate(game_ids, 1):
        print(f"[{idx}/{len(game_ids)}] Game {game_id}")
        
        shifts, toi_records = process_game_shifts(game_id)
        all_shifts.extend(shifts)
        all_toi_records.extend(toi_records)
        
        # Small delay to avoid rate limiting
        if idx < len(game_ids):
            time.sleep(0.5)
    
    # Store all data
    if all_shifts or all_toi_records:
        store_shifts_and_toi(all_shifts, all_toi_records)
    
    print()
    print("=" * 80)
    print("COMPLETE")
    print("=" * 80)
    print(f"Total shifts: {len(all_shifts)}")
    print(f"Total TOI records: {len(all_toi_records)}")


if __name__ == "__main__":
    main()

