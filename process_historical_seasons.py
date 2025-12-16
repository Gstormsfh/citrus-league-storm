#!/usr/bin/env python3
"""
process_historical_seasons.py
Process multiple NHL seasons through the full predictive model pipeline.

This script:
1. Processes each season through the data acquisition pipeline
2. Calculates xG, GSAx, TOI, GAR components, and GAR regression
3. Stores all results with season tracking for backtesting

Seasons to process:
- 2020-2021 (COVID-shortened, flagged)
- 2021-2022
- 2022-2023
- 2023-2024
- 2024-2025 (current)
"""

import os
import sys
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client, Client
from season_utils import get_season_date_range, get_season_label, is_covid_season

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found in .env file")
    print("   Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Seasons to process (in order)
SEASONS_TO_PROCESS = [2020, 2021, 2022, 2023, 2024]

# Pipeline steps (in order)
PIPELINE_STEPS = [
    'data_acquisition',      # Step 1: Acquire shot data
    'shooting_talent',       # Step 2: Calculate shooting talent-adjusted xG
    'goalie_gsax',           # Step 3: Calculate goalie GSAx
    'player_toi',            # Step 4: Calculate player TOI
    'gar_components',       # Step 5: Calculate raw GAR component rates
    'gar_regression',        # Step 6: Apply regression and final GAR values
]


def check_season_data_availability(season: int) -> bool:
    """
    Check if games exist for a given season in the database.
    
    Args:
        season: Season year
    
    Returns:
        True if games exist, False otherwise
    """
    start_date, end_date = get_season_date_range(season)
    
    try:
        response = supabase.table('nhl_games').select(
            'game_id'
        ).gte('game_date', start_date).lte('game_date', end_date).limit(1).execute()
        
        return len(response.data) > 0
    except Exception as e:
        print(f"  WARNING: Could not check season data: {e}")
        return False


def process_season_data_acquisition(season: int) -> bool:
    """
    Process data acquisition for a season.
    
    Args:
        season: Season year
    
    Returns:
        True if successful, False otherwise
    """
    print(f"\n{'='*80}")
    print(f"STEP 1: DATA ACQUISITION - {get_season_label(season)}")
    print(f"{'='*80}")
    
    # Import here to avoid circular dependencies
    from data_acquisition import scrape_pbp_and_process
    
    start_date, end_date = get_season_date_range(season)
    
    print(f"  Season date range: {start_date} to {end_date}")
    
    # Process games in monthly batches to avoid overwhelming the system
    # Start from October of season year, end in June of next year
    current_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    games_processed = 0
    months_processed = 0
    
    while current_date <= end_date_obj:
        date_str = current_date.strftime('%Y-%m-%d')
        
        try:
            print(f"  Processing {date_str}...")
            result = scrape_pbp_and_process(date_str)
            
            if result:
                games_processed += result.get('games_processed', 0)
            
            months_processed += 1
            
            # Move to next month (process first day of each month)
            if current_date.month == 12:
                current_date = date(current_date.year + 1, 1, 1)
            else:
                current_date = date(current_date.year, current_date.month + 1, 1)
            
            # Limit to avoid infinite loops
            if months_processed > 12:
                break
                
        except Exception as e:
            print(f"  WARNING: Error processing {date_str}: {e}")
            # Continue to next month
            if current_date.month == 12:
                current_date = date(current_date.year + 1, 1, 1)
            else:
                current_date = date(current_date.year, current_date.month + 1, 1)
    
    print(f"  Completed data acquisition for {get_season_label(season)}")
    print(f"  Games processed: {games_processed}")
    
    return games_processed > 0


def process_shooting_talent(season: int) -> bool:
    """
    Calculate shooting talent-adjusted xG for a season.
    
    Args:
        season: Season year
    
    Returns:
        True if successful, False otherwise
    """
    print(f"\n{'='*80}")
    print(f"STEP 2: SHOOTING TALENT - {get_season_label(season)}")
    print(f"{'='*80}")
    
    try:
        # Import here
        from calculate_shooting_talent import main as calculate_shooting_talent_main
        
        # Note: calculate_shooting_talent.py may need to be updated to filter by season
        # For now, it processes all data - we'll filter in the database queries
        result = calculate_shooting_talent_main()
        
        return result is not None
    except Exception as e:
        print(f"  ERROR: Failed to calculate shooting talent: {e}")
        import traceback
        traceback.print_exc()
        return False


def process_goalie_gsax(season: int) -> bool:
    """
    Calculate goalie GSAx for a season.
    
    Args:
        season: Season year
    
    Returns:
        True if successful, False otherwise
    """
    print(f"\n{'='*80}")
    print(f"STEP 3: GOALIE GSAX - {get_season_label(season)}")
    print(f"{'='*80}")
    
    try:
        # Import here
        from calculate_goalie_gsax import main as calculate_gsax_main
        
        # Note: calculate_goalie_gsax.py now handles seasons automatically
        # It groups by season from the raw_shots table
        result = calculate_gsax_main()
        
        return result is not None
    except Exception as e:
        print(f"  ERROR: Failed to calculate GSAx: {e}")
        import traceback
        traceback.print_exc()
        return False


def process_player_toi(season: int) -> bool:
    """
    Calculate player TOI for a season.
    
    Args:
        season: Season year
    
    Returns:
        True if successful, False otherwise
    """
    print(f"\n{'='*80}")
    print(f"STEP 4: PLAYER TOI - {get_season_label(season)}")
    print(f"{'='*80}")
    
    try:
        # Import here
        from calculate_player_toi import process_all_games
        
        # Get all games for this season
        start_date, end_date = get_season_date_range(season)
        
        response = supabase.table('nhl_games').select(
            'game_id'
        ).gte('game_date', start_date).lte('game_date', end_date).in_(
            'status', ['final', 'FINAL', 'OFF', 'F']
        ).execute()
        
        if not response.data:
            print(f"  WARNING: No finished games found for {get_season_label(season)}")
            return False
        
        game_ids = [game['game_id'] for game in response.data]
        print(f"  Processing {len(game_ids):,} games...")
        
        # Process games (this may take a while)
        # Note: process_all_games may need to be updated to accept season parameter
        # For now, we'll process all games and let the database handle season filtering
        result = process_all_games(game_ids)
        
        return result is not None
    except Exception as e:
        print(f"  ERROR: Failed to calculate TOI: {e}")
        import traceback
        traceback.print_exc()
        return False


def process_gar_components(season: int) -> bool:
    """
    Calculate raw GAR component rates for a season.
    
    Args:
        season: Season year
    
    Returns:
        True if successful, False otherwise
    """
    print(f"\n{'='*80}")
    print(f"STEP 5: GAR COMPONENTS - {get_season_label(season)}")
    print(f"{'='*80}")
    
    try:
        # Import here
        from calculate_gar_components import main as calculate_gar_components_main
        
        # Note: calculate_gar_components.py may need to be updated to filter by season
        result = calculate_gar_components_main()
        
        return result is not None
    except Exception as e:
        print(f"  ERROR: Failed to calculate GAR components: {e}")
        import traceback
        traceback.print_exc()
        return False


def process_gar_regression(season: int) -> bool:
    """
    Apply regression and calculate final GAR values for a season.
    
    Args:
        season: Season year
    
    Returns:
        True if successful, False otherwise
    """
    print(f"\n{'='*80}")
    print(f"STEP 6: GAR REGRESSION - {get_season_label(season)}")
    print(f"{'='*80}")
    
    try:
        # Import here
        from calculate_gar_regression import main as calculate_gar_regression_main
        
        # Note: calculate_gar_regression.py accepts season parameter
        # We'll need to modify it to accept season from command line or update the main function
        # For now, we'll process and it will use default season=2025
        # TODO: Update calculate_gar_regression.py main() to accept season parameter
        
        result = calculate_gar_regression_main()
        
        return result is not None
    except Exception as e:
        print(f"  ERROR: Failed to calculate GAR regression: {e}")
        import traceback
        traceback.print_exc()
        return False


def process_season(season: int, steps: list = None) -> dict:
    """
    Process a single season through the full pipeline.
    
    Args:
        season: Season year
        steps: List of steps to run (None = all steps)
    
    Returns:
        Dictionary with results for each step
    """
    if steps is None:
        steps = PIPELINE_STEPS
    
    print(f"\n{'='*80}")
    print(f"PROCESSING SEASON: {get_season_label(season)}")
    if is_covid_season(season):
        print(f"⚠️  COVID-19 AFFECTED SEASON (Shortened, Geographic Realignment)")
    print(f"{'='*80}")
    
    results = {
        'season': season,
        'season_label': get_season_label(season),
        'is_covid': is_covid_season(season),
        'steps': {}
    }
    
    # Check data availability
    if not check_season_data_availability(season):
        print(f"  WARNING: No games found for {get_season_label(season)}")
        print(f"  Skipping season...")
        results['skipped'] = True
        return results
    
    # Run each pipeline step
    step_functions = {
        'data_acquisition': process_season_data_acquisition,
        'shooting_talent': process_shooting_talent,
        'goalie_gsax': process_goalie_gsax,
        'player_toi': process_player_toi,
        'gar_components': process_gar_components,
        'gar_regression': process_gar_regression,
    }
    
    for step in steps:
        if step not in step_functions:
            print(f"  WARNING: Unknown step: {step}")
            results['steps'][step] = {'success': False, 'error': 'Unknown step'}
            continue
        
        try:
            success = step_functions[step](season)
            results['steps'][step] = {'success': success}
            
            if not success:
                print(f"  ⚠️  Step '{step}' failed for {get_season_label(season)}")
                # Continue with next step (some steps may fail if previous steps didn't complete)
        except Exception as e:
            print(f"  ❌ Step '{step}' raised exception: {e}")
            results['steps'][step] = {'success': False, 'error': str(e)}
    
    return results


def main():
    """
    Main function to process all historical seasons.
    """
    print("=" * 80)
    print("HISTORICAL SEASON PROCESSING")
    print("=" * 80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nSeasons to process: {', '.join([get_season_label(s) for s in SEASONS_TO_PROCESS])}")
    print(f"Pipeline steps: {', '.join(PIPELINE_STEPS)}")
    
    all_results = []
    
    for season in SEASONS_TO_PROCESS:
        try:
            result = process_season(season)
            all_results.append(result)
            
            # Print summary
            successful_steps = sum(1 for s in result['steps'].values() if s.get('success', False))
            total_steps = len(result['steps'])
            print(f"\n  ✅ {get_season_label(season)}: {successful_steps}/{total_steps} steps completed")
            
        except Exception as e:
            print(f"\n  ❌ {get_season_label(season)}: Failed with exception: {e}")
            import traceback
            traceback.print_exc()
            all_results.append({
                'season': season,
                'error': str(e)
            })
    
    # Final summary
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE")
    print("=" * 80)
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    for result in all_results:
        if result.get('skipped'):
            print(f"  ⏭️  {result.get('season_label', 'Unknown')}: Skipped (no data)")
        elif 'error' in result:
            print(f"  ❌ {result.get('season_label', 'Unknown')}: Error - {result['error']}")
        else:
            successful = sum(1 for s in result.get('steps', {}).values() if s.get('success', False))
            total = len(result.get('steps', {}))
            print(f"  {'✅' if successful == total else '⚠️'} {result.get('season_label', 'Unknown')}: {successful}/{total} steps")
    
    return all_results


if __name__ == "__main__":
    # Allow processing specific seasons via command line
    if len(sys.argv) > 1:
        seasons = [int(s) for s in sys.argv[1:]]
        SEASONS_TO_PROCESS = seasons
        print(f"Processing specified seasons: {', '.join([get_season_label(s) for s in seasons])}")
    
    results = main()

