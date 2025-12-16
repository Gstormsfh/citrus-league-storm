#!/usr/bin/env python3
"""
baseline_model.py
Simple baseline model for comparison with the full predictive model.

Baseline approaches:
1. Last Season Average: Use player's goals per game from Season N to predict Season N+1
2. Weighted Average: Weighted average of last 2-3 seasons
3. League Average: Simple league average for players without history
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)


def get_player_goals_per_game(player_id: int, season: int) -> Optional[float]:
    """
    Get a player's goals per game for a given season.
    
    Args:
        player_id: Player ID
        season: Season year
    
    Returns:
        Goals per game, or None if not available
    """
    try:
        # Get goals from raw_shots table (sum of is_goal)
        response = supabase.table('raw_shots').select(
            'is_goal, game_id'
        ).eq('player_id', player_id).eq('season', season).execute()
        
        if not response.data:
            return None
        
        df = pd.DataFrame(response.data)
        total_goals = df['is_goal'].sum()
        unique_games = df['game_id'].nunique()
        
        if unique_games == 0:
            return None
        
        return total_goals / unique_games
        
    except Exception as e:
        print(f"  WARNING: Error getting goals for player {player_id}, season {season}: {e}")
        return None


def get_player_points_per_game(player_id: int, season: int) -> Optional[float]:
    """
    Get a player's points per game for a given season.
    
    Note: This requires goals + assists. For now, we'll use goals as a proxy
    or try to get from staging tables if available.
    
    Args:
        player_id: Player ID
        season: Season year
    
    Returns:
        Points per game, or None if not available
    """
    # For now, return None - we'll focus on goals for the baseline
    # In full implementation, would query staging tables or aggregate from assists
    return None


def predict_baseline_last_season(player_id: int, prediction_season: int) -> Optional[float]:
    """
    Baseline: Use last season's goals per game.
    
    Args:
        player_id: Player ID
        prediction_season: Season to predict (e.g., 2024)
    
    Returns:
        Predicted goals per game, or None if no history
    """
    previous_season = prediction_season - 1
    goals_per_game = get_player_goals_per_game(player_id, previous_season)
    
    return goals_per_game


def predict_baseline_weighted_average(player_id: int, prediction_season: int, 
                                     weights: list = [0.5, 0.3, 0.2]) -> Optional[float]:
    """
    Baseline: Weighted average of last 2-3 seasons.
    
    Args:
        player_id: Player ID
        prediction_season: Season to predict
        weights: Weights for each previous season (most recent first)
    
    Returns:
        Predicted goals per game, or None if no history
    """
    seasons = []
    for i in range(len(weights)):
        season = prediction_season - 1 - i
        goals_per_game = get_player_goals_per_game(player_id, season)
        if goals_per_game is not None:
            seasons.append((goals_per_game, weights[i]))
    
    if not seasons:
        return None
    
    # Normalize weights
    total_weight = sum(w for _, w in seasons)
    if total_weight == 0:
        return None
    
    weighted_avg = sum(gpg * w for gpg, w in seasons) / total_weight
    return weighted_avg


def predict_baseline_league_average(prediction_season: int) -> float:
    """
    Baseline: League average goals per game.
    
    Args:
        prediction_season: Season to predict
    
    Returns:
        League average goals per game
    """
    try:
        # Get all goals and games from previous season
        previous_season = prediction_season - 1
        
        response = supabase.table('raw_shots').select(
            'is_goal, game_id, player_id'
        ).eq('season', previous_season).execute()
        
        if not response.data:
            return 0.0
        
        df = pd.DataFrame(response.data)
        total_goals = df['is_goal'].sum()
        unique_games = df['game_id'].nunique()
        unique_players = df['player_id'].nunique()
        
        if unique_games == 0 or unique_players == 0:
            return 0.0
        
        # Average goals per game per player
        return (total_goals / unique_games) / unique_players
        
    except Exception as e:
        print(f"  WARNING: Error calculating league average: {e}")
        return 0.0


def predict_baseline(player_id: int, prediction_season: int, 
                    method: str = 'last_season') -> float:
    """
    Main baseline prediction function.
    
    Args:
        player_id: Player ID
        prediction_season: Season to predict
        method: 'last_season', 'weighted', or 'league_avg'
    
    Returns:
        Predicted goals per game
    """
    if method == 'last_season':
        prediction = predict_baseline_last_season(player_id, prediction_season)
    elif method == 'weighted':
        prediction = predict_baseline_weighted_average(player_id, prediction_season)
    elif method == 'league_avg':
        prediction = predict_baseline_league_average(prediction_season)
    else:
        prediction = None
    
    # Fallback to league average if no player history
    if prediction is None:
        prediction = predict_baseline_league_average(prediction_season)
    
    return prediction if prediction is not None else 0.0


def get_actual_performance(player_id: int, season: int) -> Dict[str, float]:
    """
    Get actual performance metrics for a player in a season.
    
    Args:
        player_id: Player ID
        season: Season year
    
    Returns:
        Dictionary with 'goals_per_game', 'points_per_game', etc.
    """
    goals_per_game = get_player_goals_per_game(player_id, season)
    
    return {
        'goals_per_game': goals_per_game if goals_per_game is not None else 0.0,
        'points_per_game': None,  # Would need assists data
    }

