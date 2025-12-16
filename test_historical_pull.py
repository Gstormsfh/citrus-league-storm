#!/usr/bin/env python3
"""
test_historical_pull.py
Quick test to pull a small date range and verify it works.
"""

import datetime
from data_acquisition import scrape_pbp_and_process
from season_utils import get_season_label

def test_small_date_range():
    """Test pulling a small date range (1 week) from 2023 season."""
    print("=" * 80)
    print("TESTING HISTORICAL DATA PULL")
    print("=" * 80)
    print("Testing with 1 week of 2023-24 season data...")
    print()
    
    # Test with first week of 2023-24 season (Oct 10-17, 2023)
    start_date = datetime.date(2023, 10, 10)
    end_date = datetime.date(2023, 10, 17)
    
    current_date = start_date
    dates_processed = 0
    total_dates = (end_date - start_date).days + 1
    
    print(f"Date range: {start_date} to {end_date} ({total_dates} days)")
    print()
    
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        dates_processed += 1
        
        print(f"[{dates_processed}/{total_dates}] Processing {date_str}...")
        
        try:
            result = scrape_pbp_and_process(date_str=date_str)
            
            if result:
                games = result.get('games_processed', 0)
                print(f"  ✅ Processed {games} games")
            else:
                print(f"  ⚠️  No games found")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            import traceback
            traceback.print_exc()
        
        current_date += datetime.timedelta(days=1)
        
        # Small delay
        import time
        time.sleep(0.1)
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    print(f"Processed {dates_processed} dates")
    print("\nCheck raw_shots table to verify data was saved with season=2023")

if __name__ == "__main__":
    test_small_date_range()

