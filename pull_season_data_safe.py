#!/usr/bin/env python3
"""
SAFE Rate-Limited Data Scraping - OPTIMIZED VERSION
Processes games in small parallel batches for speed while respecting rate limits.
"""

import sys
import datetime
import time
import requests
from data_acquisition import (
    supabase, 
    NHL_BASE_URL,
    process_single_game_pbp,
    apply_models_to_shots,
    upsert_shot_records
)
from dotenv import load_dotenv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

load_dotenv()

# Rate limiting constants - optimized for parallel processing
PARALLEL_WORKERS = 5  # Process 5 dates at a time within a week (safe for API)
DELAY_BETWEEN_BATCHES = 1.0  # seconds - reduced delay between weeks (faster)
RETRY_DELAY_429 = 5  # seconds - wait before retry on 429
MAX_CONSECUTIVE_429 = 3  # pause if we hit this many 429s in a row
PAUSE_ON_MULTIPLE_429 = 120  # seconds - pause for 2 minutes

def get_all_finished_games(start_date='2025-10-07', end_date=None):
    """Get all finished games from nhl_games table (NO API CALLS).
    
    Identifies finished games by:
    1. Status = 'final', 'FINAL', 'OFF', 'F' (if available)
    2. OR game_date < today (games that have passed their date are finished)
    """
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    
    try:
        # Get all games in date range
        response = supabase.table('nhl_games').select('game_id, game_date, status').gte('game_date', start_date).lte('game_date', end_date).execute()
        
        if not response.data:
            return []
        
        finished_games = []
        for g in response.data:
            game_id = g['game_id']
            game_date = g.get('game_date', '')
            status = g.get('status', '').upper() if g.get('status') else ''
            
            # Check if finished by status
            is_finished_by_status = status in ['FINAL', 'OFF', 'F'] or 'final' in str(g.get('status', '')).lower()
            
            # Check if finished by date (game_date < today means game has passed)
            is_finished_by_date = False
            if game_date:
                try:
                    if isinstance(game_date, str):
                        game_date_obj = datetime.datetime.strptime(game_date[:10], '%Y-%m-%d').date()
                    else:
                        game_date_obj = game_date
                    
                    if game_date_obj < datetime.date.today():
                        is_finished_by_date = True
                except:
                    pass
            
            # Game is finished if either condition is true
            if is_finished_by_status or is_finished_by_date:
                finished_games.append((game_id, game_date))
        
        return finished_games
        
    except Exception as e:
        print(f"Error fetching games from database: {e}")
        import traceback
        traceback.print_exc()
    
    return []

def get_processed_games():
    """Get set of game_ids that already have shots in raw_shots."""
    try:
        response = supabase.table('raw_shots').select('game_id').execute()
        if response.data:
            return set([g['game_id'] for g in response.data])
    except Exception as e:
        print(f"Warning: Could not check processed games: {e}")
    
    return set()

def process_single_game_safe(game_id, initial_delay=1.5, max_retries=5):
    """
    Process a single game with true exponential backoff and proper rate limiting.
    
    Args:
        game_id: NHL game ID to process
        initial_delay: Initial delay before request (randomized)
        max_retries: Maximum retry attempts on 429 errors
        
    Returns:
        (success: bool, shots_count: int, consecutive_429_count: int)
    """
    import random
    
    # Step 1: Randomized delay for stealth (1.5-2.5s)
    time.sleep(random.uniform(initial_delay, initial_delay + 1.0))
    
    pbp_url = f"{NHL_BASE_URL}/gamecenter/{game_id}/play-by-play"
    current_delay = RETRY_DELAY_429  # Start with 5s
    consecutive_429_count = 0
    
    for attempt in range(max_retries):
        try:
            response = requests.get(pbp_url, timeout=15)
            
            if response.status_code == 200:
                # Success - process the game using modular pipeline
                raw_data = response.json()
                
                try:
                    # Check if already processed first (quick check)
                    existing = supabase.table('raw_shots').select('id').eq('game_id', game_id).limit(1).execute()
                    if existing.data:
                        # Already processed - return count
                        shots_count_resp = supabase.table('raw_shots').select('id', count='exact').eq('game_id', game_id).execute()
                        count = shots_count_resp.count if hasattr(shots_count_resp, 'count') else len(existing.data)
                        return True, count, 0
                    
                    # Process game using new modular pipeline
                    shot_records = process_single_game_pbp(game_id, raw_data)
                    df_shots = apply_models_to_shots(shot_records)
                    shots_upserted = upsert_shot_records(df_shots)
                    
                    return True, shots_upserted, 0
                    
                except Exception as e:
                    print(f"    [ERROR] Processing game {game_id}: {e}")
                    import traceback
                    traceback.print_exc()
                    return False, 0, consecutive_429_count
                
            elif response.status_code == 429:
                # Exponential backoff
                consecutive_429_count += 1
                print(f"  [RATE LIMIT] 429 for game {game_id}. Waiting {current_delay}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(current_delay)
                current_delay *= 2  # Double the delay
                if current_delay > 60:
                    current_delay = 60  # Cap at 60s
                continue  # Retry
            
            else:
                response.raise_for_status()  # Handle other HTTP errors
                
        except requests.exceptions.RequestException as e:
            if '429' in str(e) or 'Too Many Requests' in str(e):
                consecutive_429_count += 1
                print(f"  [RATE LIMIT] Request exception for {game_id}: {e}")
                time.sleep(current_delay)
                current_delay *= 2
                if current_delay > 60:
                    current_delay = 60
                continue
            else:
                print(f"  [ERROR] Game {game_id}: {e}")
                return False, 0, consecutive_429_count
        except Exception as e:
            print(f"  [ERROR] Game {game_id}: {e}")
            return False, 0, consecutive_429_count
    
    # All retries exhausted
    print(f"  [FAILED] Game {game_id}: Max retries ({max_retries}) exceeded")
    return False, 0, consecutive_429_count

def pull_season_data_safe(start_date='2025-10-07', end_date=None, test_mode=False, initial_delay=1.5):
    """
    Safe, rate-limited data scraping.
    
    Args:
        start_date: Season start date
        end_date: Season end date (default: today)
        test_mode: If True, only process first 10 games (for testing)
    """
    if end_date is None:
        end_date = datetime.date.today().strftime('%Y-%m-%d')
    
    print("=" * 80)
    print("SAFE RATE-LIMITED DATA SCRAPING (SEQUENTIAL)")
    print("=" * 80)
    print(f"Date range: {start_date} to {end_date}")
    print(f"Processing: One game at a time (sequential)")
    print(f"Rate limit: {initial_delay:.1f}-{initial_delay+1.0:.1f}s between games")
    print(f"Exponential backoff: 5s → 10s → 20s → 40s → 60s on 429 errors")
    if test_mode:
        print("TEST MODE: Processing only first 10 games")
    print()
    
    # Step 1: Get all finished games from database (NO API CALLS)
    print("Step 1: Fetching finished games from database...")
    all_games = get_all_finished_games(start_date, end_date)
    if not all_games:
        print("No games found in database!")
        return
    
    print(f"  Found {len(all_games):,} finished games")
    
    # Step 2: Check which games are already processed
    print("\nStep 2: Checking already-processed games...")
    processed_games = get_processed_games()
    print(f"  Found {len(processed_games):,} games already in database")
    
    # Filter to unprocessed games
    games_to_process = [(gid, date) for gid, date in all_games if gid not in processed_games]
    skipped = len(all_games) - len(games_to_process)
    
    print(f"\n  Games to process: {len(games_to_process):,}")
    print(f"  Already processed (skipping): {skipped:,}")
    
    if not games_to_process:
        print("\n[OK] All games already processed!")
        return
    
    # Test mode: only process first 10
    if test_mode:
        games_to_process = games_to_process[:10]
        print(f"\n  TEST MODE: Processing only {len(games_to_process)} games")
    
    # Step 3: Process games sequentially (one at a time) with proper rate limiting
    print(f"\nStep 3: Processing {len(games_to_process):,} games sequentially...")
    print(f"  Rate limit: {initial_delay:.1f}-{initial_delay+1.0:.1f}s between games")
    print(f"  Exponential backoff on 429 errors: 5s → 10s → 20s → 40s → 60s")
    print()
    
    games_processed = 0
    games_failed = 0
    total_shots = 0
    consecutive_429_count = 0
    start_time = time.time()
    
    for idx, (game_id, game_date) in enumerate(games_to_process, 1):
        # Progress update every 10 games
        if idx % 10 == 0 or idx == len(games_to_process):
            elapsed = time.time() - start_time
            rate = games_processed / elapsed if elapsed > 0 else 0
            remaining = len(games_to_process) - games_processed
            eta = remaining / rate if rate > 0 else 0
            print(f"[{idx}/{len(games_to_process)}] Processing game {game_id}... ({games_processed} processed, {rate:.2f} games/sec, ETA: {eta/60:.1f} min)")
        
        # Process game with exponential backoff
        success, shots_count, new_429_count = process_single_game_safe(game_id, initial_delay=initial_delay)
        
        if success:
            games_processed += 1
            total_shots += shots_count
            consecutive_429_count = 0  # Reset on success
        else:
            games_failed += 1
            consecutive_429_count = new_429_count
        
        # Check for critical failure (too many consecutive 429s)
        if consecutive_429_count >= 5:
            print(f"\n[CRITICAL] {consecutive_429_count} consecutive rate limit failures. Pausing for {PAUSE_ON_MULTIPLE_429} seconds...")
            time.sleep(PAUSE_ON_MULTIPLE_429)
            consecutive_429_count = 0  # Reset after pause
    
    # Summary
    elapsed = time.time() - start_time
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE")
    print("=" * 80)
    print(f"Games processed: {games_processed:,}")
    print(f"Games failed: {games_failed:,}")
    print(f"Total time: {elapsed/60:.1f} minutes")
    print(f"Average rate: {games_processed/elapsed:.2f} games/sec" if elapsed > 0 else "N/A")
    
    # Final count
    try:
        count_response = supabase.table('raw_shots').select('id', count='exact').eq('season', 2025).execute()
        total_shots_db = count_response.count if hasattr(count_response, 'count') else 0
        print(f"\n[OK] Total shots in database: {total_shots_db:,}")
    except:
        pass

if __name__ == "__main__":
    start_date = '2025-10-07'
    end_date = datetime.date.today().strftime('%Y-%m-%d')
    test_mode = False
    
    if len(sys.argv) > 1:
        start_date = sys.argv[1]
    if len(sys.argv) > 2:
        end_date = sys.argv[2]
    if len(sys.argv) > 3:
        test_mode = sys.argv[3].lower() in ('true', '1', 'yes', 'y', 'test')
    
    pull_season_data_safe(start_date=start_date, end_date=end_date, test_mode=test_mode)

