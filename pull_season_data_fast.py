#!/usr/bin/env python3
"""
FAST version of pull_season_data.py
Optimized to skip already-processed games and show clear progress.
"""

import sys
import datetime
from data_acquisition import scrape_pbp_and_process, supabase, NHL_BASE_URL
import requests
from dotenv import load_dotenv
import os

load_dotenv()

def get_all_finished_games_from_db(start_date='2025-10-07', end_date=None):
    """Get all finished games from nhl_games table for date range."""
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    try:
        response = supabase.table('nhl_games').select('game_id, game_date').gte('game_date', start_date).lte('game_date', end_date).in_('status', ['final', 'FINAL', 'OFF', 'F']).execute()
        
        if response.data:
            games = [(game['game_id'], game.get('game_date', '')) for game in response.data]
            print(f"Found {len(games):,} finished games in database from {start_date} to {end_date}")
            return games
    except Exception as e:
        print(f"Could not query nhl_games table: {e}")
    
    return []

def get_already_processed_games():
    """Get list of game_ids that already have data in raw_shots."""
    print("Checking which games are already processed...")
    try:
        # Get distinct game_ids from raw_shots
        response = supabase.table('raw_shots').select('game_id').execute()
        if response.data:
            processed_games = set([g['game_id'] for g in response.data])
            print(f"  Found {len(processed_games):,} games already in database")
            return processed_games
    except Exception as e:
        print(f"  [WARNING] Could not check processed games: {e}")
    
    return set()

def pull_season_data_fast(start_date='2025-10-07', end_date=None):
    """
    FAST version: Pull season data, skipping already-processed games.
    """
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    print("=" * 80)
    print("FAST DATA PULL - 2025-26 SEASON")
    print("=" * 80)
    print(f"Date range: {start_date} to {end_date}")
    print()
    
    # Get all finished games
    print("Step 1: Fetching all finished games...")
    all_games = get_all_finished_games_from_db(start_date=start_date, end_date=end_date)
    
    if not all_games:
        print("No finished games found. Make sure nhl_games table is populated.")
        return
    
    # Check which games are already processed
    print("\nStep 2: Checking already-processed games...")
    processed_games = get_already_processed_games()
    
    # Filter out already-processed games
    games_to_process = [(gid, date) for gid, date in all_games if gid not in processed_games]
    skipped_count = len(all_games) - len(games_to_process)
    
    print(f"\n  Games to process: {len(games_to_process):,}")
    print(f"  Games already processed (skipping): {skipped_count:,}")
    
    if not games_to_process:
        print("\n[OK] All games already processed! Nothing to do.")
        return
    
    # Group games by date for efficient processing
    print("\nStep 3: Grouping games by date...")
    games_by_date = {}
    for game_id, game_date in games_to_process:
        if game_date:
            date_key = game_date[:10] if isinstance(game_date, str) else str(game_date)[:10]
            games_by_date.setdefault(date_key, []).append(game_id)
    
    total_dates = len(games_by_date)
    print(f"  Found {total_dates} unique dates to process")
    
    # Calculate date range for progress tracking
    start = datetime.datetime.strptime(start_date, '%Y-%m-%d').date()
    end = datetime.datetime.strptime(end_date, '%Y-%m-%d').date()
    total_days = (end - start).days + 1
    
    print("\n" + "=" * 80)
    print("PROCESSING GAMES")
    print("=" * 80)
    print(f"Processing {len(games_to_process):,} games across {total_dates} dates")
    print(f"Date range: {start_date} to {end_date} ({total_days} days total)")
    print()
    
    # Process each date
    dates_processed = 0
    games_processed = 0
    games_failed = 0
    
    for date_str in sorted(games_by_date.keys()):
        dates_processed += 1
        games_for_date = games_by_date[date_str]
        
        # Calculate days remaining
        current_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        days_remaining = (end - current_date).days
        
        print(f"[{dates_processed}/{total_dates}] {date_str} ({len(games_for_date)} games) - {days_remaining} days remaining")
        
        try:
            # Process all games for this date
            result = scrape_pbp_and_process(date_str=date_str)
            games_processed += len(games_for_date)
        except Exception as e:
            games_failed += len(games_for_date)
            print(f"  [WARNING] Error processing {date_str}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE")
    print("=" * 80)
    print(f"Games processed: {games_processed:,}")
    if games_failed > 0:
        print(f"Games failed: {games_failed:,}")
    
    # Quick summary
    try:
        print("\nFetching final summary...")
        count_response = supabase.table('raw_shots').select('id', count='exact').eq('season', 2025).execute()
        total_shots = count_response.count if hasattr(count_response, 'count') else 0
        
        if total_shots > 0:
            print(f"\n[OK] Total shots in database: {total_shots:,}")
            print(f"     All data saved to raw_shots table with season=2025")
    except Exception as e:
        print(f"[WARNING] Could not fetch summary: {e}")
    
    print("\nNext steps:")
    print("  1. Run: python calculate_goalie_gsax.py")
    print("  2. Run: python calculate_gar_components.py")
    print("  3. Run: python calculate_and_store_projections.py")

if __name__ == "__main__":
    start_date = '2025-10-07'
    end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    if len(sys.argv) > 1:
        start_date = sys.argv[1]
    if len(sys.argv) > 2:
        end_date = sys.argv[2]
    
    pull_season_data_fast(start_date=start_date, end_date=end_date)



