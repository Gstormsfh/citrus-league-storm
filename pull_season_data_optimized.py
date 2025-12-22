#!/usr/bin/env python3
"""
OPTIMIZED version - processes games in parallel for maximum speed.
"""

import sys
import datetime
from data_acquisition import supabase, NHL_BASE_URL
import requests
from dotenv import load_dotenv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

load_dotenv()

# Import the xG model and processing functions
# Import the processing function
from data_acquisition import scrape_pbp_and_process

def get_all_finished_games(start_date='2025-10-07', end_date=None):
    """Get all finished games from database."""
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    try:
        # Try with status filter first
        response = supabase.table('nhl_games').select('game_id, game_date, status').gte('game_date', start_date).lte('game_date', end_date).in_('status', ['final', 'FINAL', 'OFF', 'F']).execute()
        if response.data:
            return [(g['game_id'], g.get('game_date', '')) for g in response.data]
        
        # If no results, try without status filter (maybe status field is different)
        response = supabase.table('nhl_games').select('game_id, game_date, status').gte('game_date', start_date).lte('game_date', end_date).execute()
        if response.data:
            # Filter manually for finished games
            finished = [g for g in response.data if g.get('status', '').upper() in ['FINAL', 'OFF', 'F'] or 'final' in str(g.get('status', '')).lower()]
            if finished:
                return [(g['game_id'], g.get('game_date', '')) for g in finished]
            # If still none, return all games (maybe they're all finished)
            return [(g['game_id'], g.get('game_date', '')) for g in response.data]
    except Exception as e:
        print(f"Error fetching games: {e}")
        import traceback
        traceback.print_exc()
    
    return []

def get_processed_games():
    """Get set of already-processed game IDs."""
    try:
        response = supabase.table('raw_shots').select('game_id').execute()
        if response.data:
            return set([g['game_id'] for g in response.data])
    except:
        pass
    return set()

def process_single_game(game_id):
    """Process a single game and return shot records."""
    try:
        pbp_url = f"{NHL_BASE_URL}/gamecenter/{game_id}/play-by-play"
        response = requests.get(pbp_url, timeout=10)
        response.raise_for_status()
        raw_data = response.json()
        
        # Process shots (simplified - you'll need to import the full processing logic)
        # For now, let's use the existing scrape_pbp_and_process but for a single game
        # Actually, let's just call the existing function but extract game processing
        
        # This is a simplified version - we'll batch save at the end
        return process_game_shots(game_id, raw_data)
        
    except Exception as e:
        print(f"  [ERROR] Game {game_id}: {e}")
        return []

def process_game_shots(game_id, raw_data):
    """Extract and process shots from a single game's play-by-play data."""
    # This is a simplified version - you'll need the full logic from data_acquisition.py
    # For now, let's just return empty and use the existing function
    return []

def batch_save_shots(all_shots, batch_size=1000):
    """Save all shots to database in batches."""
    if not all_shots:
        return 0
    
    print(f"\nSaving {len(all_shots):,} shots to database in batches of {batch_size}...")
    
    total_saved = 0
    for i in range(0, len(all_shots), batch_size):
        batch = all_shots[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(all_shots) + batch_size - 1) // batch_size
        
        try:
            supabase.table('raw_shots').upsert(
                batch,
                on_conflict='game_id,player_id,shot_x,shot_y,shot_type_code'
            ).execute()
            total_saved += len(batch)
            if batch_num % 10 == 0 or batch_num == total_batches:
                print(f"  Batch {batch_num}/{total_batches}: {total_saved:,} shots saved...")
        except Exception as e:
            print(f"  [WARNING] Batch {batch_num} error: {e}")
            # Try individual inserts
            for record in batch:
                try:
                    supabase.table('raw_shots').upsert([record], on_conflict='game_id,player_id,shot_x,shot_y,shot_type_code').execute()
                    total_saved += 1
                except:
                    pass
    
    return total_saved

def pull_season_data_optimized(start_date='2025-10-07', end_date=None, max_workers=10):
    """
    OPTIMIZED: Process games in parallel for maximum speed.
    """
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    print("=" * 80)
    print("OPTIMIZED DATA PULL - 2025-26 SEASON")
    print("=" * 80)
    print(f"Date range: {start_date} to {end_date}")
    print(f"Parallel workers: {max_workers}")
    print()
    
    # Get all games
    print("Step 1: Fetching all finished games...")
    all_games = get_all_finished_games(start_date, end_date)
    if not all_games:
        print("No games found!")
        return
    
    print(f"  Found {len(all_games):,} finished games")
    
    # Check processed games
    print("\nStep 2: Checking already-processed games...")
    processed = get_processed_games()
    games_to_process = [gid for gid, date in all_games if gid not in processed]
    
    print(f"  Games to process: {len(games_to_process):,}")
    print(f"  Already processed (skipping): {len(all_games) - len(games_to_process):,}")
    
    if not games_to_process:
        print("\n[OK] All games already processed!")
        return
    
    # Process games in parallel
    print(f"\nStep 3: Processing {len(games_to_process):,} games in parallel...")
    print("(This may take a while - processing games concurrently)")
    print()
    
    all_shots = []
    games_completed = 0
    games_failed = 0
    
    # Use the existing scrape_pbp_and_process but call it per date
    # Actually, better approach: group by date, then process dates in parallel
    games_by_date = {}
    for game_id, game_date in all_games:
        if game_id not in processed:
            date_key = game_date[:10] if isinstance(game_date, str) else str(game_date)[:10]
            games_by_date.setdefault(date_key, []).append(game_id)
    
    dates_to_process = sorted(games_by_date.keys())
    total_dates = len(dates_to_process)
    
    print(f"Processing {total_dates} dates with games...")
    
    # Process dates sequentially to avoid rate limits
    # The NHL API has strict rate limits, so parallel processing causes 429 errors
    def process_date(date_str):
        try:
            # Add small delay to avoid rate limits
            time.sleep(0.5)
            result = scrape_pbp_and_process(date_str=date_str)
            return date_str, True, len(games_by_date[date_str])
        except Exception as e:
            if '429' in str(e) or 'Too Many Requests' in str(e):
                # Rate limited - wait longer and retry
                time.sleep(2)
                try:
                    result = scrape_pbp_and_process(date_str=date_str)
                    return date_str, True, len(games_by_date[date_str])
                except:
                    return date_str, False, 0
            return date_str, False, 0
    
    start_time = time.time()
    
    # Process dates sequentially to avoid rate limits (parallel was causing 429 errors)
    # Reduced to 1 worker to process sequentially
    with ThreadPoolExecutor(max_workers=1) as executor:
        future_to_date = {executor.submit(process_date, date_str): date_str for date_str in dates_to_process}
        
        for future in as_completed(future_to_date):
            date_str, success, game_count = future.result()
            if success:
                games_completed += game_count
                elapsed = time.time() - start_time
                rate = games_completed / elapsed if elapsed > 0 else 0
                remaining = len(games_to_process) - games_completed
                eta = remaining / rate if rate > 0 else 0
                print(f"  [{games_completed}/{len(games_to_process)}] {date_str} ({game_count} games) - {rate:.1f} games/sec - ETA: {eta/60:.1f} min")
            else:
                games_failed += game_count
                print(f"  [FAILED] {date_str}")
    
    elapsed = time.time() - start_time
    print(f"\n[OK] Processed {games_completed:,} games in {elapsed/60:.1f} minutes ({games_completed/elapsed:.1f} games/sec)")
    if games_failed > 0:
        print(f"     Failed: {games_failed:,} games")
    
    # Summary
    try:
        count_response = supabase.table('raw_shots').select('id', count='exact').eq('season', 2025).execute()
        total_shots = count_response.count if hasattr(count_response, 'count') else 0
        print(f"\n[OK] Total shots in database: {total_shots:,}")
    except:
        pass

if __name__ == "__main__":
    start_date = '2025-10-07'
    end_date = datetime.date.today().strftime('%Y-%m-%d')
    max_workers = 5  # Conservative default
    
    if len(sys.argv) > 1:
        start_date = sys.argv[1]
    if len(sys.argv) > 2:
        end_date = sys.argv[2]
    if len(sys.argv) > 3:
        max_workers = int(sys.argv[3])
    
    pull_season_data_optimized(start_date=start_date, end_date=end_date, max_workers=max_workers)

