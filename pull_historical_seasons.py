#!/usr/bin/env python3
"""
pull_historical_seasons.py
Pull historical NHL season data (2023-24 and 2024-25) using our data acquisition pipeline.
Exact same structure as pull_season_data.py - just different date ranges.
"""

import sys
import datetime
import time
from data_acquisition import scrape_pbp_and_process, supabase
from dotenv import load_dotenv
import os

load_dotenv()

def pull_season_data(start_date, end_date, season_label, days_per_batch=7):
    """
    Pull season data by processing games in date batches.
    Exact same logic as pull_season_data.py
    
    Args:
        start_date: Season start date (YYYY-MM-DD)
        end_date: Season end date (YYYY-MM-DD)
        season_label: Label for this season (e.g., "2023-24")
        days_per_batch: Number of days to process per batch (to show progress)
    """
    print("=" * 80)
    print(f"PULLING {season_label} SEASON DATA")
    print("=" * 80)
    print(f"Date range: {start_date} to {end_date}")
    print(f"Processing in batches of {days_per_batch} days")
    print()
    
    # Process by date (scrape_pbp_and_process handles individual dates)
    start = datetime.datetime.strptime(start_date, '%Y-%m-%d').date()
    end = datetime.datetime.strptime(end_date, '%Y-%m-%d').date()
    
    current_date = start
    total_dates = (end - start).days + 1
    dates_processed = 0
    dates_failed = 0
    total_games = 0
    
    print("Processing games by date...")
    print("(This will save all shots to raw_shots table)")
    print()
    
    while current_date <= end:
        date_str = current_date.strftime('%Y-%m-%d')
        dates_processed += 1
        
        print(f"[{dates_processed}/{total_dates}] Processing {date_str}...")
        
        try:
            result = scrape_pbp_and_process(date_str=date_str)
            # Note: scrape_pbp_and_process saves to raw_shots table automatically
            
            if result:
                games_processed = result.get('games_processed', 0)
                total_games += games_processed
        except Exception as e:
            dates_failed += 1
            print(f"  ⚠️  Error processing {date_str}: {e}")
            import traceback
            traceback.print_exc()
        
        current_date += datetime.timedelta(days=1)
        
        # Small delay to avoid overwhelming API
        time.sleep(0.1)
    
    print(f"\n✅ Completed {season_label} season")
    print(f"   Dates processed: {dates_processed}")
    print(f"   Dates failed: {dates_failed}")
    print(f"   Total games: {total_games}")
    
    return {
        'dates_processed': dates_processed,
        'dates_failed': dates_failed,
        'total_games': total_games
    }


def main():
    """
    Main function to pull 2023-24 and 2024-25 seasons.
    """
    print("=" * 80)
    print("PULLING HISTORICAL NHL SEASON DATA")
    print("=" * 80)
    print(f"Started at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print("Seasons to process:")
    print("  - 2023-24: Oct 1, 2023 to June 30, 2024")
    print("  - 2024-25: Oct 1, 2024 to June 30, 2025")
    print()
    
    all_results = []
    
    # Process 2023-24 season
    try:
        result_2023 = pull_season_data(
            start_date='2023-10-01',
            end_date='2024-06-30',
            season_label='2023-24',
            days_per_batch=7
        )
        all_results.append({'season': '2023-24', **result_2023})
        
        # Small break between seasons
        print("\n  Taking a short break before next season...")
        time.sleep(2)
    except KeyboardInterrupt:
        print("\n\n⚠️  Processing interrupted by user")
        print("  Progress has been saved. You can resume by running again.")
        return all_results
    except Exception as e:
        print(f"\n  ❌ Error processing 2023-24 season: {e}")
        import traceback
        traceback.print_exc()
        all_results.append({'season': '2023-24', 'error': str(e)})
    
    # Process 2024-25 season
    try:
        result_2024 = pull_season_data(
            start_date='2024-10-01',
            end_date='2025-06-30',
            season_label='2024-25',
            days_per_batch=7
        )
        all_results.append({'season': '2024-25', **result_2024})
    except KeyboardInterrupt:
        print("\n\n⚠️  Processing interrupted by user")
        print("  Progress has been saved. You can resume by running again.")
        return all_results
    except Exception as e:
        print(f"\n  ❌ Error processing 2024-25 season: {e}")
        import traceback
        traceback.print_exc()
        all_results.append({'season': '2024-25', 'error': str(e)})
    
    # Final summary
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE")
    print("=" * 80)
    print(f"Completed at: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    total_games = sum(r.get('total_games', 0) for r in all_results)
    total_dates = sum(r.get('dates_processed', 0) for r in all_results)
    
    print(f"Summary:")
    print(f"  Seasons processed: {len([r for r in all_results if 'error' not in r])}")
    print(f"  Total dates processed: {total_dates:,}")
    print(f"  Total games processed: {total_games:,}")
    print()
    
    for result in all_results:
        if 'error' in result:
            print(f"  ❌ {result['season']}: Error - {result['error']}")
        else:
            print(f"  ✅ {result['season']}: {result.get('total_games', 0)} games")
    
    print()
    print("Next steps:")
    print("  1. Verify data in raw_shots table (check season column)")
    print("  2. Run calculate_goalie_gsax.py (will group by season)")
    print("  3. Run calculate_gar_components.py and calculate_gar_regression.py for each season")
    print("  4. Run backtesting validation tests")
    
    return all_results


if __name__ == "__main__":
    results = main()
