#!/usr/bin/env python3
"""
season_utils.py
Utility functions for deriving NHL seasons from game IDs and dates.

NHL seasons run from October (month 10) through June (month 6) of the next calendar year.
Season is identified by the year the season starts (e.g., 2024 for 2024-25 season).
"""

from datetime import datetime
from typing import Optional


def derive_season_from_game_id(game_id: int) -> Optional[int]:
    """
    Derive NHL season from game_id.
    
    NHL game_id format: YYYYMMDDNN (e.g., 2024020123)
    - First 4 digits: Year
    - Next 2 digits: Month
    - Next 2 digits: Day
    - Last 2 digits: Game number
    
    Season logic:
    - If month >= 10 (October+), season starts in that year
    - If month < 10 (January-September), season started in previous year
    
    Args:
        game_id: NHL game ID (integer)
    
    Returns:
        Season year (e.g., 2024 for 2024-25 season), or None if invalid
    """
    if game_id is None:
        return None
    
    try:
        game_id_str = str(game_id)
        
        if len(game_id_str) < 6:
            return None
        
        # Extract year (first 4 digits)
        year = int(game_id_str[:4])
        
        # Extract month (digits 5-6)
        month = int(game_id_str[4:6])
        
        # NHL seasons: October (10) through June (06) of next year
        if month >= 10:
            return year
        else:
            return year - 1
            
    except (ValueError, IndexError):
        return None


def derive_season_from_date(game_date) -> Optional[int]:
    """
    Derive NHL season from game date.
    
    Args:
        game_date: Date object, datetime object, or date string (YYYY-MM-DD)
    
    Returns:
        Season year (e.g., 2024 for 2024-25 season), or None if invalid
    """
    if game_date is None:
        return None
    
    try:
        # Convert to datetime if string
        if isinstance(game_date, str):
            dt = datetime.strptime(game_date, '%Y-%m-%d')
        elif isinstance(game_date, datetime):
            dt = game_date
        else:
            # Assume it's a date object
            dt = datetime.combine(game_date, datetime.min.time())
        
        year = dt.year
        month = dt.month
        
        # NHL seasons: October (10) through June (06) of next year
        if month >= 10:
            return year
        else:
            return year - 1
            
    except (ValueError, AttributeError, TypeError):
        return None


def get_season_date_range(season: int) -> tuple:
    """
    Get the date range for an NHL season.
    
    Args:
        season: Season year (e.g., 2024 for 2024-25 season)
    
    Returns:
        Tuple of (start_date, end_date) as strings (YYYY-MM-DD)
    """
    start_date = f"{season}-10-01"  # Season typically starts early October
    end_date = f"{season + 1}-06-30"  # Season ends late June
    
    return (start_date, end_date)


def get_season_label(season: int) -> str:
    """
    Get human-readable season label.
    
    Args:
        season: Season year (e.g., 2024)
    
    Returns:
        Season label (e.g., "2024-25")
    """
    return f"{season}-{str(season + 1)[-2:]}"


def is_covid_season(season: int) -> bool:
    """
    Check if a season is the COVID-19 affected season.
    
    The 2020-21 season was shortened and had geographic realignment.
    
    Args:
        season: Season year
    
    Returns:
        True if COVID-affected season
    """
    return season == 2020

