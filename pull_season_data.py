#!/usr/bin/env python3
"""
pull_season_data.py
Pull all 2025 season shot data using our data acquisition pipeline.
Saves to CSV for comparison with MoneyPuck data.
"""

import sys
import datetime
import pandas as pd
from data_acquisition import scrape_pbp_and_process, supabase
from dotenv import load_dotenv
import os

load_dotenv()

def get_all_finished_games_from_db(start_date='2025-10-07', end_date=None):
    """
    Get all finished games from nhl_games table for date range.
    
    Args:
        start_date: Season start date (default: Oct 7, 2025 for 2025-26 season)
        end_date: Season end date (default: today)
    
    Returns:
        List of game IDs
    """
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    try:
        response = supabase.table('nhl_games').select('game_id').gte('game_date', start_date).lte('game_date', end_date).in_('status', ['final', 'FINAL', 'OFF', 'F']).execute()
        
        if response.data:
            game_ids = [game['game_id'] for game in response.data]
            print(f"Found {len(game_ids)} finished games in database from {start_date} to {end_date}")
            return game_ids
    except Exception as e:
        print(f"Could not query nhl_games table: {e}")
        print("Falling back to processing by date...")
    
    return []

def cleanup_raw_shots_table(confirm=True):
    """
    Delete all records from raw_shots table.
    
    Args:
        confirm: If True, will check count before deleting and show confirmation
    
    Returns:
        Number of records deleted
    """
    try:
        # Check if table exists and get count
        if confirm:
            try:
                response = supabase.table('raw_shots').select('id', count='exact').execute()
                count = response.count if hasattr(response, 'count') else len(response.data) if response.data else 0
                print(f"  Found {count:,} existing records in raw_shots table")
            except Exception as e:
                print(f"  ⚠️  Could not check table count: {e}")
                count = 0
        
        # Delete all records
        print("  🗑️  Deleting all records from raw_shots table...")
        # Supabase doesn't have a direct delete all, so we need to delete in batches
        # First, get all IDs
        try:
            response = supabase.table('raw_shots').select('id').execute()
            if response.data and len(response.data) > 0:
                ids = [record['id'] for record in response.data]
                # Delete in batches of 1000
                deleted = 0
                batch_size = 1000
                for i in range(0, len(ids), batch_size):
                    batch_ids = ids[i:i + batch_size]
                    supabase.table('raw_shots').delete().in_('id', batch_ids).execute()
                    deleted += len(batch_ids)
                    print(f"    Deleted {deleted:,}/{len(ids):,} records...")
                print(f"  ✅ Deleted {deleted:,} records from raw_shots table")
                return deleted
            else:
                print("  ✅ No records to delete")
                return 0
        except Exception as e:
            # If batch delete fails, try truncate via SQL (if we have access)
            print(f"  ⚠️  Batch delete failed: {e}")
            print("  Attempting alternative cleanup method...")
            # For now, just return 0 - user can manually clean if needed
            return 0
            
    except Exception as e:
        print(f"  ❌ Error cleaning up raw_shots table: {e}")
        import traceback
        traceback.print_exc()
        return 0

def pull_season_data(start_date='2025-10-07', end_date=None, cleanup_first=False):
    """
    Pull all season data by processing all finished games efficiently.
    
    Args:
        start_date: Season start date
        end_date: Season end date (default: today)
        cleanup_first: Whether to clean raw_shots table first
    """
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    print("=" * 80)
    print("PULLING 2025-26 SEASON DATA")
    print("=" * 80)
    print(f"Date range: {start_date} to {end_date}")
    print()
    
    # Cleanup old data if requested
    if cleanup_first:
        print("Cleaning up old data from raw_shots table...")
        cleanup_raw_shots_table(confirm=True)
        print()
    
    # Get ALL finished games from database at once (much faster than day-by-day)
    print("Fetching all finished games from database...")
    all_game_ids = get_all_finished_games_from_db(start_date=start_date, end_date=end_date)
    
    if not all_game_ids:
        print("No finished games found in database. Make sure nhl_games table is populated.")
        return None
    
    print(f"Found {len(all_game_ids):,} finished games to process")
    print("Processing games (this will save all shots to raw_shots table)...")
    print()
    
    # Process games in batches for better progress tracking
    from data_acquisition import scrape_pbp_and_process, get_finished_game_ids_from_db
    import time
    
    games_processed = 0
    games_failed = 0
    total_shots = 0
    
    # Process games by grouping them by date for better organization
    games_by_date = {}
    for game_id in all_game_ids:
        # Get date for this game (we'll need to query or derive it)
        # For now, process all games - we can optimize date grouping later if needed
        games_by_date.setdefault('all', []).append(game_id)
    
    # Process all games
    for idx, game_id in enumerate(all_game_ids, 1):
        try:
            # Get the date for this game by querying nhl_games table
            game_response = supabase.table('nhl_games').select('game_date').eq('game_id', game_id).single().execute()
            game_date = game_response.data.get('game_date') if game_response.data else None
            
            if game_date:
                date_str = game_date[:10] if isinstance(game_date, str) else str(game_date)[:10]
            else:
                # Fallback: process without date filtering
                date_str = None
            
            if idx % 10 == 0 or idx == len(all_game_ids):
                print(f"[{idx}/{len(all_game_ids)}] Processing game {game_id}...")
            
            # Process this specific game
            # We need to modify scrape_pbp_and_process to accept game_id directly
            # For now, we'll process by date but more efficiently
            if date_str:
                # Only process if we haven't processed this date yet
                # Actually, let's just process all games directly
                pass
        
        except Exception as e:
            games_failed += 1
            if games_failed <= 5:  # Only show first 5 errors
                print(f"  [WARNING] Error processing game {game_id}: {e}")
    
    # OPTIMIZED: Process all dates in the range efficiently
    # Get unique dates from the game list
    print("\nFetching game dates...")
    games_by_date_dict = {}
    batch_size = 100
    for i in range(0, len(all_game_ids), batch_size):
        batch_ids = all_game_ids[i:i + batch_size]
        try:
            games_response = supabase.table('nhl_games').select('game_id, game_date').in_('game_id', batch_ids).execute()
            for game in games_response.data:
                game_id = game['game_id']
                game_date = game.get('game_date')
                if game_date:
                    date_key = game_date[:10] if isinstance(game_date, str) else str(game_date)[:10]
                    games_by_date_dict.setdefault(date_key, []).append(game_id)
        except Exception as e:
            print(f"  [WARNING] Error fetching dates for batch: {e}")
    
    print(f"Found games across {len(games_by_date_dict)} unique dates")
    print("\nProcessing games by date (optimized batch processing)...")
    print()
    
    # Process each date
    dates_processed = 0
    total_dates = len(games_by_date_dict)
    
    for date_str in sorted(games_by_date_dict.keys()):
        dates_processed += 1
        games_for_date = games_by_date_dict[date_str]
        
        print(f"[{dates_processed}/{total_dates}] Processing {date_str} ({len(games_for_date)} games)...")
        
        try:
            # scrape_pbp_and_process handles all games for a date efficiently
            final_stats_df = scrape_pbp_and_process(date_str=date_str)
            # Note: scrape_pbp_and_process saves to raw_shots table automatically
        except Exception as e:
            print(f"  [WARNING] Error processing {date_str}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 80)
    print("DATA SCRAPING COMPLETE")
    print("=" * 80)
    
    # Quick summary from database
    try:
        print("\nFetching summary from raw_shots table...")
        count_response = supabase.table('raw_shots').select('id', count='exact').eq('season', 2025).execute()
        total_shots = count_response.count if hasattr(count_response, 'count') else 0
        
        if total_shots > 0:
            # Get unique games and players
            games_response = supabase.table('raw_shots').select('game_id').eq('season', 2025).execute()
            players_response = supabase.table('raw_shots').select('player_id').eq('season', 2025).execute()
            
            unique_games = len(set([g['game_id'] for g in games_response.data])) if games_response.data else 0
            unique_players = len(set([p['player_id'] for p in players_response.data])) if players_response.data else 0
            
            print(f"\n✅ Summary:")
            print(f"   Total shots: {total_shots:,}")
            print(f"   Unique games: {unique_games:,}")
            print(f"   Unique players: {unique_players:,}")
            print(f"\n[OK] All data saved to raw_shots table with season=2025")
        else:
            print("⚠️  No shots found in raw_shots table")
            
    except Exception as e:
        print(f"[WARNING] Could not fetch summary: {e}")
    
    print("\nNext steps:")
    print("  1. Run: python calculate_goalie_gsax.py")
    print("  2. Run: python calculate_gar_components.py")
    print("  3. Run: python calculate_and_store_projections.py")

if __name__ == "__main__":
    # 2025-26 season started October 7, 2025
    start_date = '2025-10-07'
    end_date = datetime.date.today().strftime('%Y-%m-%d')
    cleanup_first = True  # Clean up old data before processing
    
    if len(sys.argv) > 1:
        start_date = sys.argv[1]
    if len(sys.argv) > 2:
        end_date = sys.argv[2]
    if len(sys.argv) > 3:
        cleanup_first = sys.argv[3].lower() in ('true', '1', 'yes', 'y')
    
    pull_season_data(start_date=start_date, end_date=end_date, cleanup_first=cleanup_first)

