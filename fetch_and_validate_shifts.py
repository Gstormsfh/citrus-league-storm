#!/usr/bin/env python3
"""
Phase 1B: Fetch and Validate Official Shift Data

Fetches shift data from NHL Legacy API and validates it immediately.
Catches errors and data quality issues as they occur.
"""

import requests
import json
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# NHL Legacy API for shifts
NHL_LEGACY_BASE_URL = "https://api.nhle.com/stats/rest/en"


def parse_shift_time(time_str: str) -> Optional[float]:
    """
    Parse MM:SS format to seconds.
    
    Args:
        time_str: Time string in "MM:SS" format (e.g., "01:36" or "20:00" for period end)
    
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


def validate_shift_record(shift: Dict, shift_index: int) -> Tuple[bool, List[str]]:
    """
    Validate a single shift record.
    
    Args:
        shift: Shift record dictionary
        shift_index: Index in the list (for error reporting)
    
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    required_fields = ['playerId', 'gameId', 'period', 'startTime', 'endTime', 'duration']
    
    # Check required fields
    for field in required_fields:
        if field not in shift:
            errors.append(f"Missing required field: {field}")
    
    if errors:
        return False, errors
    
    # Validate field types and values
    player_id = shift.get('playerId')
    if not isinstance(player_id, int) or player_id <= 0:
        errors.append(f"Invalid playerId: {player_id}")
    
    game_id = shift.get('gameId')
    if not isinstance(game_id, int) or game_id <= 0:
        errors.append(f"Invalid gameId: {game_id}")
    
    period = shift.get('period')
    if not isinstance(period, int) or period < 1 or period > 10:
        errors.append(f"Invalid period: {period} (must be 1-10)")
    
    # Parse and validate times
    start_time_str = shift.get('startTime')
    end_time_str = shift.get('endTime')
    duration_str = shift.get('duration')
    
    start_seconds = parse_shift_time(start_time_str)
    end_seconds = parse_shift_time(end_time_str)
    duration_seconds = parse_shift_time(duration_str)
    
    if start_seconds is None:
        errors.append(f"Invalid startTime: {start_time_str}")
    if end_seconds is None:
        errors.append(f"Invalid endTime: {end_time_str}")
    if duration_seconds is None:
        errors.append(f"Invalid duration: {duration_str}")
    
    # Validate time logic
    if start_seconds is not None and end_seconds is not None:
        calculated_duration = end_seconds - start_seconds
        
        # Special case: Period-end shifts (endTime = 20:00, startTime could be anywhere)
        # These are valid - the shift lasted until period end
        is_period_end = end_seconds == 1200.0  # 20:00 = 1200 seconds
        
        if not is_period_end:
            if end_seconds <= start_seconds:
                errors.append(f"endTime ({end_time_str}) must be after startTime ({start_time_str})")
        
        # Check if duration matches (skip for period-end shifts as duration may not account for full period)
        if duration_seconds is not None and not is_period_end:
            duration_diff = abs(calculated_duration - duration_seconds)
            if duration_diff > 1.0:  # Allow 1 second tolerance
                errors.append(f"Duration mismatch: calculated={calculated_duration:.1f}s, recorded={duration_seconds:.1f}s")
    
    # Validate shift duration (realistic range: 3-125 seconds, or 1200s for period-end)
    # Note: Very short shifts (3-4s) can occur during line changes
    # Very long shifts (up to 125s) can occur during extended offensive zone pressure
    # 1200s (20 minutes) indicates a period-end shift (player on ice for entire period)
    if duration_seconds is not None:
        if duration_seconds == 1200.0:
            # Period-end shift - validate that endTime is 20:00
            if end_seconds != 1200.0:
                errors.append(f"Period-end shift (1200s) but endTime is not 20:00")
        else:
            if duration_seconds < 3:
                errors.append(f"Unrealistically short shift: {duration_seconds:.1f}s")
            # Allow up to 180s (3 minutes) for extended power plays or unusual game situations
            if duration_seconds > 180:
                errors.append(f"Unrealistically long shift: {duration_seconds:.1f}s (max 180s)")
    
    # Validate running game clock calculation
    if start_seconds is not None and period is not None:
        start_clock = calculate_running_game_clock(period, start_seconds)
        if start_clock is None:
            errors.append(f"Failed to calculate running game clock for start time")
    
    return len(errors) == 0, errors


def fetch_official_shifts(game_id: int) -> Tuple[bool, List[Dict], List[str]]:
    """
    Fetch official shift data from NHL Legacy API with validation.
    
    Args:
        game_id: NHL game ID
    
    Returns:
        Tuple of (success, shifts_list, error_messages)
    """
    url = f"{NHL_LEGACY_BASE_URL}/shiftcharts?cayenneExp=gameId={game_id}"
    
    print(f"\n{'='*80}")
    print(f"Fetching shifts for game {game_id}")
    print(f"URL: {url}")
    print(f"{'='*80}")
    
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
        total = data.get('total', len(shifts))
        
        if not isinstance(shifts, list):
            errors.append(f"Expected list in 'data', got {type(shifts)}")
            return False, [], errors
        
        print(f"✅ Received {len(shifts)} shifts (total reported: {total})")
        
        # Validate each shift
        print(f"\nValidating shifts...")
        valid_shifts = []
        validation_errors = []
        
        for i, shift in enumerate(shifts):
            is_valid, shift_errors = validate_shift_record(shift, i)
            
            if is_valid:
                valid_shifts.append(shift)
            else:
                validation_errors.append(f"Shift {i}: {', '.join(shift_errors)}")
                if len(validation_errors) <= 10:  # Show first 10 errors
                    print(f"  ❌ Shift {i}: {', '.join(shift_errors)}")
        
        if validation_errors:
            print(f"\n⚠️  Validation Summary:")
            print(f"   Valid shifts: {len(valid_shifts)}/{len(shifts)}")
            print(f"   Invalid shifts: {len(validation_errors)}")
            if len(validation_errors) > 10:
                print(f"   (Showing first 10 errors, {len(validation_errors) - 10} more...)")
        else:
            print(f"✅ All {len(valid_shifts)} shifts passed validation")
        
        # Calculate statistics
        if valid_shifts:
            durations = []
            for shift in valid_shifts:
                duration = parse_shift_time(shift.get('duration'))
                if duration:
                    durations.append(duration)
            
            if durations:
                avg_duration = sum(durations) / len(durations)
                min_duration = min(durations)
                max_duration = max(durations)
                print(f"\n📊 Shift Statistics:")
                print(f"   Average duration: {avg_duration:.1f}s")
                print(f"   Min duration: {min_duration:.1f}s")
                print(f"   Max duration: {max_duration:.1f}s")
        
        # Combine API errors with validation errors
        all_errors = errors + validation_errors
        
        return True, valid_shifts, all_errors
        
    except requests.exceptions.Timeout:
        errors.append("Request timeout (15s)")
        return False, [], errors
    
    except requests.exceptions.RequestException as e:
        errors.append(f"Request error: {e}")
        return False, [], errors
    
    except Exception as e:
        errors.append(f"Unexpected error: {e}")
        return False, [], errors


def test_shift_fetching():
    """Test shift fetching with a sample game."""
    # Use the game_id from our API test
    test_game_id = 2025020021
    
    print("="*80)
    print("PHASE 1B: SHIFT DATA FETCHING AND VALIDATION TEST")
    print("="*80)
    print(f"Test Game ID: {test_game_id}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    success, shifts, errors = fetch_official_shifts(test_game_id)
    
    if success:
        print(f"\n✅ SUCCESS: Fetched {len(shifts)} valid shifts")
        
        # Show sample shift
        if shifts:
            print(f"\n📋 Sample Shift (first of {len(shifts)}):")
            sample = shifts[0]
            print(f"   Player: {sample.get('firstName')} {sample.get('lastName')} (ID: {sample.get('playerId')})")
            print(f"   Period: {sample.get('period')}")
            print(f"   Start: {sample.get('startTime')}")
            print(f"   End: {sample.get('endTime')}")
            print(f"   Duration: {sample.get('duration')}")
            
            # Test running game clock
            start_seconds = parse_shift_time(sample.get('startTime'))
            if start_seconds is not None:
                game_clock = calculate_running_game_clock(sample.get('period'), start_seconds)
                print(f"   Running Game Clock: {game_clock:.1f}s ({game_clock/60:.2f} minutes)")
        
        if errors:
            print(f"\n⚠️  Warnings/Errors ({len(errors)}):")
            for error in errors[:5]:  # Show first 5
                print(f"   - {error}")
    else:
        print(f"\n❌ FAILED: Could not fetch shifts")
        print(f"Errors:")
        for error in errors:
            print(f"   - {error}")
    
    return success, shifts, errors


if __name__ == "__main__":
    test_shift_fetching()

