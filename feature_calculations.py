#!/usr/bin/env python3
"""
feature_calculations.py
Calculation functions for derived features that MoneyPuck computes.
These functions take raw extracted data and compute additional features.
"""

import math
import pandas as pd
import numpy as np

# Arena adjustment mappings (some arenas have different coordinate systems)
# This is a simplified version - MoneyPuck likely has more sophisticated arena adjustments
ARENA_ADJUSTMENTS = {
    # Most arenas use standard NHL coordinates, but some may need adjustment
    # Format: {arena_id or team_abbrev: {'x_offset': 0, 'y_offset': 0, 'x_flip': False, 'y_flip': False}}
    # For now, we'll use standard coordinates (no adjustment)
    # This can be enhanced later with actual arena-specific adjustments
}

def calculate_arena_adjusted_coordinates(x, y, team_abbrev=None, arena_id=None):
    """
    Calculate arena-adjusted coordinates.
    
    Args:
        x: Raw X coordinate
        y: Raw Y coordinate
        team_abbrev: Team abbreviation (for arena lookup)
        arena_id: Arena ID (if available)
    
    Returns:
        Tuple of (adjusted_x, adjusted_y, adjusted_x_abs, adjusted_y_abs)
    """
    # For now, return standard coordinates (no adjustment)
    # This can be enhanced with actual arena-specific logic
    adjusted_x = x
    adjusted_y = y
    adjusted_x_abs = abs(x)
    adjusted_y_abs = abs(y)
    
    return adjusted_x, adjusted_y, adjusted_x_abs, adjusted_y_abs

def calculate_arena_adjusted_distance(x, y, adjusted_x, adjusted_y):
    """
    Calculate distance using arena-adjusted coordinates.
    
    Args:
        x, y: Original coordinates
        adjusted_x, adjusted_y: Arena-adjusted coordinates
    
    Returns:
        Arena-adjusted distance to net
    """
    NET_X = 89
    NET_Y = 0
    
    return math.sqrt((NET_X - adjusted_x)**2 + (NET_Y - adjusted_y)**2)

def calculate_last_event_shot_metrics(last_event_type_code, last_event_x, last_event_y):
    """
    Calculate shot-specific metrics for last event if it was a shot.
    
    Args:
        last_event_type_code: Type code of last event
        last_event_x: X coordinate of last event
        last_event_y: Y coordinate of last event
    
    Returns:
        Tuple of (last_event_shot_angle, last_event_shot_distance) or (None, None)
    """
    # Only calculate if last event was a shot (505, 506, 507)
    if last_event_type_code not in [505, 506, 507]:
        return None, None
    
    NET_X = 89
    NET_Y = 0
    
    # Calculate distance
    distance = math.sqrt((NET_X - last_event_x)**2 + (NET_Y - last_event_y)**2)
    
    # Calculate angle
    dx = abs(NET_X - last_event_x)
    dy = abs(last_event_y - NET_Y)
    
    if dx == 0:
        angle = 90.0
    else:
        angle = math.degrees(math.atan2(dy, dx))
    
    angle = max(0.0, min(90.0, angle))
    
    return angle, distance

def calculate_shot_angle_plus_rebound(shot_angle, is_rebound, shot_angle_rebound_royal_road=0):
    """
    Calculate enhanced shot angle metrics that account for rebounds.
    
    Args:
        shot_angle: Base shot angle
        is_rebound: Whether shot is a rebound
        shot_angle_rebound_royal_road: Royal road rebound angle (if available)
    
    Returns:
        Tuple of (shot_angle_plus_rebound, shot_angle_plus_rebound_speed)
    """
    # Simplified calculation - MoneyPuck likely has more sophisticated logic
    if is_rebound:
        # Rebound shots typically have better angles (goalie out of position)
        shot_angle_plus_rebound = shot_angle * 0.9  # Slight boost
        shot_angle_plus_rebound_speed = shot_angle_plus_rebound  # Simplified
    else:
        shot_angle_plus_rebound = shot_angle
        shot_angle_plus_rebound_speed = shot_angle
    
    return shot_angle_plus_rebound, shot_angle_plus_rebound_speed

def calculate_time_on_ice_metrics(plays, current_play_index, player_id, team_id, period):
    """
    Calculate time on ice metrics for a player.
    This requires tracking shifts from the play-by-play data.
    
    Args:
        plays: List of all plays in the game
        current_play_index: Index of current play
        player_id: Player ID to calculate TOI for
        team_id: Team ID
        period: Period number
    
    Returns:
        Dictionary with TOI metrics (simplified - would need shift tracking)
    """
    # This is a placeholder - actual TOI calculation requires:
    # 1. Tracking shift changes (typeCode for line changes)
    # 2. Calculating time between shift start and current play
    # 3. Aggregating across all shifts
    
    # For now, return None values - this would need shift tracking implementation
    return {
        'shooter_time_on_ice': None,
        'shooter_time_on_ice_since_faceoff': None,
        'shooting_team_average_time_on_ice': None,
        'shooting_team_max_time_on_ice': None,
        'shooting_team_min_time_on_ice': None,
        'defending_team_average_time_on_ice': None,
        'defending_team_max_time_on_ice': None,
        'defending_team_min_time_on_ice': None,
    }

def calculate_off_wing(shot_x, shot_y, shooter_left_right, is_home_team):
    """
    Determine if shot is from off-wing (shooter on opposite side of ice from handedness).
    
    Args:
        shot_x: X coordinate
        shot_y: Y coordinate
        shooter_left_right: 'L' or 'R' for shooter handedness
        is_home_team: Whether shooting team is home
    
    Returns:
        Boolean: True if off-wing shot
    """
    # Off-wing: Right-handed shooter on left side, or left-handed on right side
    # Simplified logic - would need actual shooter handedness data
    if not shooter_left_right:
        return None
    
    # Determine which side of ice shooter is on
    on_left_side = shot_y < 0 if is_home_team else shot_y > 0
    
    if shooter_left_right == 'R':
        # Right-handed shooter
        return on_left_side  # Off-wing if on left side
    else:
        # Left-handed shooter
        return not on_left_side  # Off-wing if on right side

def calculate_average_rest_difference(shooting_team_toi, defending_team_toi):
    """
    Calculate average rest difference between teams.
    
    Args:
        shooting_team_toi: Average TOI for shooting team
        defending_team_toi: Average TOI for defending team
    
    Returns:
        Rest difference (positive = shooting team more rested)
    """
    if shooting_team_toi is None or defending_team_toi is None:
        return None
    
    return defending_team_toi - shooting_team_toi  # How much more tired defending team is

def apply_calculated_features_to_dataframe(df):
    """
    Apply all calculated features to a DataFrame of shot records.
    
    Args:
        df: DataFrame with raw extracted shot data
    
    Returns:
        DataFrame with calculated features added
    """
    df = df.copy()
    
    # Arena-adjusted coordinates
    if 'shot_x' in df.columns and 'shot_y' in df.columns:
        adjusted_coords = df.apply(
            lambda row: calculate_arena_adjusted_coordinates(
                row['shot_x'], row['shot_y'],
                team_abbrev=row.get('team_code')
            ),
            axis=1
        )
        df['arena_adjusted_x'] = [c[0] for c in adjusted_coords]
        df['arena_adjusted_y'] = [c[1] for c in adjusted_coords]
        df['arena_adjusted_x_abs'] = [c[2] for c in adjusted_coords]
        df['arena_adjusted_y_abs'] = [c[3] for c in adjusted_coords]
        
        # Arena-adjusted distance
        df['arena_adjusted_shot_distance'] = df.apply(
            lambda row: calculate_arena_adjusted_distance(
                row['shot_x'], row['shot_y'],
                row['arena_adjusted_x'], row['arena_adjusted_y']
            ),
            axis=1
        )
    
    # Shot angle plus rebound
    if 'angle' in df.columns and 'is_rebound' in df.columns:
        angle_metrics = df.apply(
            lambda row: calculate_shot_angle_plus_rebound(
                row['angle'], row['is_rebound']
            ),
            axis=1
        )
        df['shot_angle_plus_rebound'] = [m[0] for m in angle_metrics]
        df['shot_angle_plus_rebound_speed'] = [m[1] for m in angle_metrics]
    
    # Off-wing (if we have shooter handedness)
    if 'shot_x' in df.columns and 'shot_y' in df.columns:
        # This would need shooter_left_right from player data
        # For now, skip - would need player roster lookup
        pass
    
    return df

