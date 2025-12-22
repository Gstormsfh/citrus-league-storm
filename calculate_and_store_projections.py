#!/usr/bin/env python3
"""
calculate_and_store_projections.py
Calculate and store both matchup-specific and Rest of Season (RoS) projections.

This script:
1. Calculates RoS projections (matchup-neutral, player-level talent metrics)
2. Calculates matchup projections (per player per game) for upcoming games
3. Stores both in Supabase tables (player_talent_metrics and player_projections)
"""

import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
from fantasy_projection_pipeline import (
    main as load_projection_data,
    get_final_fantasy_projection,
    calculate_team_xgf
)
from apply_qoc_adjustments import get_players_by_team, get_team_id_from_players
from calculate_stat_conversions import convert_batch_xg_to_stats, convert_xg_to_stats

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


def get_upcoming_games(season: int = 2025, days_ahead: int = 7) -> pd.DataFrame:
    """
    Fetch upcoming games from nhl_games table.
    
    Args:
        season: Season year (default: 2025)
        days_ahead: Number of days ahead to fetch (default: 7)
    
    Returns:
        DataFrame with game_id, game_date, home_team_id, away_team_id
    """
    print("=" * 80)
    print("FETCHING UPCOMING GAMES")
    print("=" * 80)
    
    try:
        today = datetime.now().date()
        end_date = today + timedelta(days=days_ahead)
        
        response = supabase.table('nhl_games').select(
            'game_id, game_date, home_team_id, away_team_id, status'
        ).eq('season', season).gte('game_date', str(today)).lte('game_date', str(end_date)).execute()
        
        if not response.data:
            print(f"   No upcoming games found for {season} between {today} and {end_date}")
            return pd.DataFrame()
        
        df = pd.DataFrame(response.data)
        df['game_date'] = pd.to_datetime(df['game_date']).dt.date
        
        # Filter to scheduled or live games only
        df = df[df['status'].isin(['scheduled', 'live'])]
        
        print(f"   Found {len(df):,} upcoming games")
        return df
        
    except Exception as e:
        print(f"ERROR: Error fetching upcoming games: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def get_opponent_goalie_id(game_id: int, opponent_team_id: int) -> Optional[int]:
    """
    Get the goalie ID for the opponent team in a specific game.
    
    Args:
        game_id: NHL game ID
        opponent_team_id: Opponent team ID
    
    Returns:
        Goalie ID or None if not found
    """
    try:
        # Get the most recent goalie for this team in this game from raw_shots
        response = supabase.table('raw_shots').select(
            'goalie_id'
        ).eq('game_id', game_id).eq('team_id', opponent_team_id).not_.is_('goalie_id', 'null').limit(1).execute()
        
        if response.data and len(response.data) > 0:
            return int(response.data[0]['goalie_id'])
        
        return None
        
    except Exception as e:
        print(f"  WARNING: Could not get goalie ID for game {game_id}, team {opponent_team_id}: {e}")
        return None


def calculate_ros_projections(
    player_xg: Dict[int, float],
    season: int = 2025
) -> pd.DataFrame:
    """
    Calculate Rest of Season (RoS) projections for all players.
    
    Formula: ros_projection_xg = (Talent-Adjusted xG per 60) × (Average TOI per game / 60)
    
    Args:
        player_xg: Dictionary mapping player_id to per-game talent-adjusted xG
        season: Season year (default: 2025)
    
    Returns:
        DataFrame with player_id, ros_projection_xg, talent_adjusted_xg_per_60, avg_toi_per_game
    """
    print("\n" + "=" * 80)
    print("CALCULATING REST OF SEASON (RoS) PROJECTIONS")
    print("=" * 80)
    
    try:
        # Load TOI data from player_gar_components (has toi_total_minutes)
        print("   Loading TOI data...")
        response = supabase.table('player_gar_components').select(
            'player_id, toi_total_minutes, season'
        ).eq('season', season).execute()
        
        # If no data in player_gar_components, aggregate from player_toi_by_situation
        if not response.data:
            print("   No TOI in player_gar_components, aggregating from player_toi_by_situation...")
            toi_response = supabase.table('player_toi_by_situation').select(
                'player_id, toi_seconds, game_id, season'
            ).eq('season', season).execute()
            
            if toi_response.data:
                df_toi_raw = pd.DataFrame(toi_response.data)
                df_toi_raw['toi_seconds'] = pd.to_numeric(df_toi_raw['toi_seconds'], errors='coerce').fillna(0)
                df_toi_agg = df_toi_raw.groupby('player_id').agg({
                    'toi_seconds': 'sum',
                    'game_id': 'nunique'
                }).reset_index()
                df_toi_agg['toi_total_minutes'] = df_toi_agg['toi_seconds'] / 60.0
                df_toi_agg['games_played'] = df_toi_agg['game_id']
                df_toi_agg['season'] = season
                response.data = df_toi_agg[['player_id', 'toi_total_minutes', 'season', 'games_played']].to_dict('records')
        
        if not response.data:
            print("   WARNING: No TOI data found. Cannot calculate RoS projections.")
            return pd.DataFrame()
        
        df_toi = pd.DataFrame(response.data)
        df_toi['player_id'] = pd.to_numeric(df_toi['player_id'], errors='coerce')
        df_toi['toi_total_minutes'] = pd.to_numeric(df_toi['toi_total_minutes'], errors='coerce')
        
        # Get game count to calculate average TOI per game
        # Estimate: assume ~82 games per season, or use actual game count from raw_shots
        print("   Estimating average games played...")
        games_response = supabase.table('raw_shots').select(
            'player_id, game_id'
        ).eq('season', season).execute()
        
        if games_response.data:
            df_games = pd.DataFrame(games_response.data)
            df_games['player_id'] = pd.to_numeric(df_games['player_id'], errors='coerce')
            games_per_player = df_games.groupby('player_id')['game_id'].nunique().to_dict()
        else:
            # Fallback: assume 50 games average
            games_per_player = {}
            for pid in df_toi['player_id'].unique():
                games_per_player[int(pid)] = 50
        
        # Calculate RoS projections
        records = []
        for player_id, toi_total in zip(df_toi['player_id'], df_toi['toi_total_minutes']):
            player_id = int(player_id) if pd.notna(player_id) else None
            if not player_id or player_id not in player_xg:
                continue
            
            # Get player's per-game xG (this is already per-game, so we need to convert to per-60)
            player_xg_per_game = player_xg[player_id]
            
            # Estimate xG per 60: assume average TOI per game
            games_played = games_per_player.get(player_id, 50)
            if games_played > 0 and toi_total > 0:
                avg_toi_per_game = toi_total / games_played
                
                # Convert per-game xG to per-60 xG
                # If player_xg_per_game is already per-game, we need to estimate per-60
                # Formula: xG_per_60 = (xG_per_game / TOI_per_game) × 60
                if avg_toi_per_game > 0:
                    xg_per_60 = (player_xg_per_game / avg_toi_per_game) * 60.0
                else:
                    xg_per_60 = 0.0
                
                # RoS projection: (xG per 60 / 60) × TOI per game
                ros_projection_xg = (xg_per_60 / 60.0) * avg_toi_per_game
            else:
                # Fallback: use per-game xG directly
                ros_projection_xg = player_xg_per_game
                avg_toi_per_game = 0.0
                xg_per_60 = 0.0
            
            records.append({
                'player_id': player_id,
                'season': season,
                'ros_projection_xg': float(ros_projection_xg),
                'talent_adjusted_xg_per_60': float(xg_per_60),
                'avg_toi_per_game': float(avg_toi_per_game)
            })
        
        df_ros = pd.DataFrame(records)
        
        print(f"   Calculated RoS projections for {len(df_ros):,} players")
        if len(df_ros) > 0:
            print(f"   RoS xG range: [{df_ros['ros_projection_xg'].min():.4f}, {df_ros['ros_projection_xg'].max():.4f}]")
            print(f"   Average RoS xG: {df_ros['ros_projection_xg'].mean():.4f}")
        
        return df_ros
        
    except Exception as e:
        print(f"ERROR: Error calculating RoS projections: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()  # pd is imported at module level


def store_ros_projections(df_ros: pd.DataFrame):
    """
    Store RoS projections in player_talent_metrics table.
    
    Args:
        df_ros: DataFrame with player_id, season, ros_projection_xg, etc.
    """
    if len(df_ros) == 0:
        print("   No RoS projections to store")
        return
    
    print("\n" + "=" * 80)
    print("STORING RoS PROJECTIONS")
    print("=" * 80)
    
    try:
        records = df_ros.to_dict('records')
        
        # Batch upsert
        chunk_size = 1000
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            result = supabase.table('player_talent_metrics').upsert(
                chunk,
                on_conflict='player_id,season'
            ).execute()
            print(f"   Upserted RoS projections {i+1}-{min(i+chunk_size, len(records))}")
        
        print(f"   Successfully stored {len(records):,} RoS projections")
        
    except Exception as e:
        print(f"ERROR: Error storing RoS projections: {e}")
        import traceback
        traceback.print_exc()


def calculate_and_store_matchup_projections(
    games_df: pd.DataFrame,
    goalie_factors: Dict[int, float],
    player_xg: Dict[int, float],
    season: int = 2025
):
    """
    Calculate and store matchup-specific projections for all players in upcoming games.
    
    Args:
        games_df: DataFrame with upcoming games
        goalie_factors: Dictionary mapping goalie_id to goalie_factor
        player_xg: Dictionary mapping player_id to per-game talent-adjusted xG
        season: Season year (default: 2025)
    """
    if len(games_df) == 0:
        print("   No games to process")
        return
    
    print("\n" + "=" * 80)
    print("CALCULATING MATCHUP PROJECTIONS")
    print("=" * 80)
    
    all_projections = []
    games_processed = 0
    
    for _, game_row in games_df.iterrows():
        game_id = int(game_row['game_id'])
        home_team_id = int(game_row['home_team_id']) if pd.notna(game_row['home_team_id']) else None
        away_team_id = int(game_row['away_team_id']) if pd.notna(game_row['away_team_id']) else None
        
        if not home_team_id or not away_team_id:
            continue
        
        games_processed += 1
        if games_processed % 10 == 0:
            print(f"   Processing game {games_processed}/{len(games_df)}...")
        
        # Get player IDs for both teams
        home_players = get_players_by_team(home_team_id)
        away_players = get_players_by_team(away_team_id)
        
        if not home_players and not away_players:
            continue
        
        # Get opponent goalie IDs
        home_goalie_id = get_opponent_goalie_id(game_id, away_team_id)
        away_goalie_id = get_opponent_goalie_id(game_id, home_team_id)
        
        # Calculate projections for home team players
        if home_players:
            home_result = get_final_fantasy_projection(
                game_id=game_id,
                team_a_players=home_players,
                team_b_players=away_players,
                team_b_goalie_id=away_goalie_id,
                goalie_factors=goalie_factors,
                player_xg=player_xg,
                apply_qoc=True,
                season=season
            )
            
            if home_result:
                # Distribute team projection to individual players
                # For now, divide equally among players (can be improved with TOI weighting)
                team_final_xg = home_result['final_projected_goals']
                per_player_xg = team_final_xg / len(home_players) if home_players else 0.0
                
                for player_id in home_players:
                    all_projections.append({
                        'player_id': player_id,
                        'game_id': game_id,
                        'season': season,
                        'base_xg': float(home_result['base_team_xgf'] / len(home_players) if home_players else 0.0),
                        'gsax_adjusted_xg': float(home_result['gsax_adjusted_goals'] / len(home_players) if home_players else 0.0),
                        'qoc_adjusted_xg': float(home_result['qoc_adjusted_goals'] / len(home_players) if home_players else 0.0),
                        'final_projected_xg': float(per_player_xg),
                        'gsax_factor_pct': float(home_result['gsax_factor_pct']),
                        'qoc_factor_pct': float(home_result['qoc_factor_pct']),
                        'goalie_factor': float(home_result['goalie_factor']),
                        'opponent_team_id': away_team_id
                    })
        
        # Calculate projections for away team players
        if away_players:
            away_result = get_final_fantasy_projection(
                game_id=game_id,
                team_a_players=away_players,
                team_b_players=home_players,
                team_b_goalie_id=home_goalie_id,
                goalie_factors=goalie_factors,
                player_xg=player_xg,
                apply_qoc=True,
                season=season
            )
            
            if away_result:
                # Distribute team projection to individual players
                team_final_xg = away_result['final_projected_goals']
                per_player_xg = team_final_xg / len(away_players) if away_players else 0.0
                
                for player_id in away_players:
                    all_projections.append({
                        'player_id': player_id,
                        'game_id': game_id,
                        'season': season,
                        'base_xg': float(away_result['base_team_xgf'] / len(away_players) if away_players else 0.0),
                        'gsax_adjusted_xg': float(away_result['gsax_adjusted_goals'] / len(away_players) if away_players else 0.0),
                        'qoc_adjusted_xg': float(away_result['qoc_adjusted_goals'] / len(away_players) if away_players else 0.0),
                        'final_projected_xg': float(per_player_xg),
                        'gsax_factor_pct': float(away_result['gsax_factor_pct']),
                        'qoc_factor_pct': float(away_result['qoc_factor_pct']),
                        'goalie_factor': float(away_result['goalie_factor']),
                        'opponent_team_id': home_team_id
                    })
    
    # Store xG projections
    if all_projections:
        print(f"\n   Storing {len(all_projections):,} matchup projections...")
        store_matchup_projections(all_projections)
        
        # Convert and store stat projections
        convert_and_store_matchup_stats(all_projections, season)
    else:
        print("   No matchup projections to store")


def store_matchup_projections(projections: List[Dict]):
    """
    Store matchup projections in player_projections table.
    
    Args:
        projections: List of projection dictionaries
    """
    print("\n" + "=" * 80)
    print("STORING MATCHUP PROJECTIONS (xG)")
    print("=" * 80)
    
    try:
        # Deduplicate by (player_id, game_id, season) - keep last occurrence
        seen = {}
        for proj in projections:
            key = (proj.get('player_id'), proj.get('game_id'), proj.get('season'))
            if key:
                seen[key] = proj
        
        deduplicated = list(seen.values())
        if len(deduplicated) < len(projections):
            print(f"   Deduplicated {len(projections)} projections to {len(deduplicated)} unique records")
        
        chunk_size = 1000
        for i in range(0, len(deduplicated), chunk_size):
            chunk = deduplicated[i:i + chunk_size]
            result = supabase.table('player_projections').upsert(
                chunk,
                on_conflict='player_id,game_id,season'
            ).execute()
            print(f"   Upserted matchup projections {i+1}-{min(i+chunk_size, len(deduplicated))}")
        
        print(f"   Successfully stored {len(deduplicated):,} matchup projections")
        
    except Exception as e:
        print(f"ERROR: Error storing matchup projections: {e}")
        import traceback
        traceback.print_exc()


def get_player_toi_per_game(player_id: int, season: int = 2025) -> float:
    """
    Get estimated per-game TOI for a player.
    
    Args:
        player_id: NHL player ID
        season: Season year
    
    Returns:
        Estimated TOI per game in minutes (default: 18.0)
    """
    try:
        # Try player_gar_components first
        response = supabase.table('player_gar_components').select(
            'player_id, toi_total_minutes, season'
        ).eq('player_id', player_id).eq('season', season).execute()
        
        if response.data:
            df = pd.DataFrame(response.data)
            df['toi_total_minutes'] = pd.to_numeric(df['toi_total_minutes'], errors='coerce').fillna(0)
            total_toi = df['toi_total_minutes'].sum()
            
            # Get games played
            games_response = supabase.table('raw_shots').select(
                'game_id'
            ).eq('player_id', player_id).eq('season', season).execute()
            
            if games_response.data:
                games_df = pd.DataFrame(games_response.data)
                games_played = games_df['game_id'].nunique()
                if games_played > 0:
                    return float(total_toi / games_played)
        else:
            # Fall back to aggregating from player_toi_by_situation
            toi_response = supabase.table('player_toi_by_situation').select(
                'player_id, toi_seconds, game_id, season'
            ).eq('player_id', player_id).eq('season', season).execute()
            
            if toi_response.data:
                df_toi = pd.DataFrame(toi_response.data)
                df_toi['toi_seconds'] = pd.to_numeric(df_toi['toi_seconds'], errors='coerce').fillna(0)
                total_toi_seconds = df_toi['toi_seconds'].sum()
                total_toi_minutes = total_toi_seconds / 60.0
                games_played = df_toi['game_id'].nunique()
                if games_played > 0:
                    return float(total_toi_minutes / games_played)
        
        # Default: 18 minutes per game
        return 18.0
        
    except Exception as e:
        return 18.0


def convert_and_store_matchup_stats(projections: List[Dict], season: int = 2025):
    """
    Convert xG projections to stats and store in player_projected_stats table.
    
    Args:
        projections: List of xG projection dictionaries (from store_matchup_projections)
        season: Season year
    """
    if len(projections) == 0:
        return
    
    print("\n" + "=" * 80)
    print("CONVERTING MATCHUP xG TO STATS")
    print("=" * 80)
    
    try:
        # Prepare projections for conversion (per-game)
        conversion_inputs = []
        for proj in projections:
            player_id = proj['player_id']
            projected_xg = proj['final_projected_xg']
            projected_toi = get_player_toi_per_game(player_id, season)
            
            conversion_inputs.append({
                'player_id': player_id,
                'game_id': proj['game_id'],
                'projected_xg': projected_xg,
                'projected_toi': projected_toi,
            })
        
        # Convert to stats in batch
        print(f"   Converting {len(conversion_inputs):,} projections...")
        stat_projections = convert_batch_xg_to_stats(
            conversion_inputs,
            season=season,
            projection_type='matchup'
        )
        
        # Store in player_projected_stats
        print(f"\n   Storing {len(stat_projections):,} stat projections...")
        store_projected_stats(stat_projections, season)
        
    except Exception as e:
        print(f"ERROR: Error converting and storing matchup stats: {e}")
        import traceback
        traceback.print_exc()


def convert_and_store_ros_stats(df_ros: pd.DataFrame, season: int = 2025):
    """
    Convert RoS xG projections to stats and store in player_projected_stats table.
    
    Args:
        df_ros: DataFrame with RoS xG projections
        season: Season year
    """
    if len(df_ros) == 0:
        return
    
    print("\n" + "=" * 80)
    print("CONVERTING RoS xG TO STATS")
    print("=" * 80)
    
    try:
        # Estimate remaining games (assume 82 game season)
        # Get current games played from staging
        staging_response = supabase.table('staging_2025_skaters').select(
            'playerId, games_played'
        ).eq('situation', 'all').execute()
        
        games_played_dict = {}
        if staging_response.data:
            for row in staging_response.data:
                player_id = int(row['playerId']) if pd.notna(row['playerId']) else None
                games = pd.to_numeric(row['games_played'], errors='coerce')
                if player_id and pd.notna(games):
                    games_played_dict[player_id] = int(games)
        
        # Prepare conversions
        conversion_inputs = []
        for _, row in df_ros.iterrows():
            player_id = int(row['player_id'])
            ros_xg_per_game = float(row['ros_projection_xg'])
            avg_toi_per_game = float(row.get('avg_toi_per_game', 18.0))
            
            # Calculate remaining games
            games_played = games_played_dict.get(player_id, 0)
            remaining_games = max(1, 82 - games_played)  # Assume 82 game season
            
            # Scale to season totals
            total_remaining_xg = ros_xg_per_game * remaining_games
            total_remaining_toi = avg_toi_per_game * remaining_games
            
            conversion_inputs.append({
                'player_id': player_id,
                'game_id': None,  # NULL for RoS
                'projected_xg': total_remaining_xg,
                'projected_toi': total_remaining_toi,
            })
        
        # Convert to stats in batch
        print(f"   Converting {len(conversion_inputs):,} RoS projections...")
        stat_projections = convert_batch_xg_to_stats(
            conversion_inputs,
            season=season,
            projection_type='ros'
        )
        
        # Store in player_projected_stats
        print(f"\n   Storing {len(stat_projections):,} RoS stat projections...")
        store_projected_stats(stat_projections, season)
        
    except Exception as e:
        print(f"ERROR: Error converting and storing RoS stats: {e}")
        import traceback
        traceback.print_exc()


def store_projected_stats(stat_projections: List[Dict], season: int = 2025):
    """
    Store projected stats in player_projected_stats table.
    
    Args:
        stat_projections: List of stat projection dictionaries
        season: Season year
    """
    print("\n" + "=" * 80)
    print("STORING PROJECTED STATS")
    print("=" * 80)
    
    try:
        # Prepare records for database
        records = []
        for proj in stat_projections:
            game_id = proj.get('game_id')
            # Use -1 for RoS projections (NULL) to match primary key COALESCE(game_id, -1)
            if game_id is None:
                game_id = -1
            
            record = {
                'player_id': proj['player_id'],
                'game_id': game_id,
                'season': season,
                'projected_goals': float(proj.get('goals', 0.0)),
                'projected_assists': float(proj.get('assists', 0.0)),
                'projected_shots': float(proj.get('shots', 0.0)),
                'projected_blocks': float(proj.get('blocks', 0.0)),
                'projected_hits': float(proj.get('hits', 0.0)),
                'projected_ppp': float(proj.get('ppp', 0.0)),
            }
            records.append(record)
        
        # Deduplicate by (player_id, game_id, season) - keep last occurrence
        seen = {}
        for record in records:
            key = (record.get('player_id'), record.get('game_id'), record.get('season'))
            if key:
                seen[key] = record
        
        deduplicated = list(seen.values())
        if len(deduplicated) < len(records):
            print(f"   Deduplicated {len(records)} records to {len(deduplicated)} unique records")
        
        # Batch upsert
        chunk_size = 1000
        for i in range(0, len(deduplicated), chunk_size):
            chunk = deduplicated[i:i + chunk_size]
            result = supabase.table('player_projected_stats').upsert(
                chunk,
                on_conflict='player_id,game_id,season'
            ).execute()
            print(f"   Upserted stat projections {i+1}-{min(i+chunk_size, len(deduplicated))}")
        
        print(f"   Successfully stored {len(deduplicated):,} stat projections")
        
    except Exception as e:
        print(f"ERROR: Error storing projected stats: {e}")
        import traceback
        traceback.print_exc()


def main(season: int = 2025):
    """
    Main function to calculate and store both RoS and matchup projections.
    
    Args:
        season: Season year (default: 2025)
    """
    print("=" * 80)
    print("CALCULATE AND STORE PROJECTIONS")
    print("=" * 80)
    print(f"Season: {season}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Load projection data (goalie factors and player xG)
    print("\n" + "=" * 80)
    print("STEP 1: LOADING PROJECTION DATA")
    print("=" * 80)
    
    projection_data = load_projection_data(season=season)
    if not projection_data:
        print("ERROR: Failed to load projection data")
        return
    
    goalie_factors = projection_data.get('goalie_factors', {})
    player_xg = projection_data.get('player_xg', {})
    
    print(f"   Loaded {len(goalie_factors):,} goalie factors")
    print(f"   Loaded {len(player_xg):,} player xG values")
    
    # Step 2: Calculate and store RoS projections
    print("\n" + "=" * 80)
    print("STEP 2: REST OF SEASON (RoS) PROJECTIONS")
    print("=" * 80)
    
    df_ros = calculate_ros_projections(player_xg, season)
    if len(df_ros) > 0:
        store_ros_projections(df_ros)
        
        # Convert and store RoS stat projections
        convert_and_store_ros_stats(df_ros, season)
    
    # Step 3: Calculate and store matchup projections
    print("\n" + "=" * 80)
    print("STEP 3: MATCHUP PROJECTIONS")
    print("=" * 80)
    
    games_df = get_upcoming_games(season, days_ahead=7)
    if len(games_df) > 0:
        calculate_and_store_matchup_projections(
            games_df,
            goalie_factors,
            player_xg,
            season
        )
    
    print("\n" + "=" * 80)
    print("COMPLETE")
    print("=" * 80)
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main(season=2025)

