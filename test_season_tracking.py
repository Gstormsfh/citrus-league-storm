#!/usr/bin/env python3
"""
test_season_tracking.py
Quick test to verify season tracking is working correctly.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from season_utils import derive_season_from_game_id, get_season_label

load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def test_season_columns():
    """Test that season columns exist in tables."""
    print("=" * 80)
    print("TEST 1: SEASON COLUMNS EXIST")
    print("=" * 80)
    
    tables = ['raw_shots', 'goalie_gsax', 'player_gar_components', 'player_toi_by_situation', 'player_shifts']
    
    for table in tables:
        try:
            # Try to select season column
            result = supabase.table(table).select('season').limit(1).execute()
            print(f"  ✅ {table}: season column exists")
        except Exception as e:
            if 'column' in str(e).lower() or 'does not exist' in str(e).lower():
                print(f"  ❌ {table}: season column missing - {e}")
            else:
                print(f"  ⚠️  {table}: {e}")

def test_season_derivation():
    """Test season derivation from game IDs."""
    print("\n" + "=" * 80)
    print("TEST 2: SEASON DERIVATION")
    print("=" * 80)
    
    test_cases = [
        (2024020123, 2023, "2023-24"),  # February 2024 (still 2023-24 season)
        (2023101501, 2023, "2023-24"),  # October 2023 (start of 2023-24 season)
        (2023122501, 2023, "2023-24"),  # December 2023
        (2024061501, 2023, "2023-24"),  # June 2024 (still 2023-24 season)
        (2024100101, 2024, "2024-25"),  # October 2024 (start of 2024-25 season)
    ]
    
    all_passed = True
    for game_id, expected_season, expected_label in test_cases:
        derived = derive_season_from_game_id(game_id)
        label = get_season_label(derived) if derived else None
        
        passed = derived == expected_season and label == expected_label
        status = "✅" if passed else "❌"
        
        print(f"  {status} Game {game_id}: Season {derived} ({label})")
        print(f"      Expected: {expected_season} ({expected_label})")
        
        if not passed:
            all_passed = False
    
    return all_passed

def test_raw_shots_season():
    """Test that raw_shots has season data."""
    print("\n" + "=" * 80)
    print("TEST 3: RAW_SHOTS SEASON DATA")
    print("=" * 80)
    
    try:
        # Get sample of shots with seasons
        result = supabase.table('raw_shots').select(
            'game_id, season'
        ).not_.is_('season', 'null').limit(10).execute()
        
        if result.data:
            print(f"  ✅ Found {len(result.data)} shots with season data")
            print(f"  Sample seasons: {set([r['season'] for r in result.data])}")
            
            # Check if seasons match game_ids
            mismatches = 0
            for row in result.data:
                game_id = row.get('game_id')
                season = row.get('season')
                if game_id:
                    derived = derive_season_from_game_id(game_id)
                    if derived and season and derived != season:
                        mismatches += 1
                        print(f"  ⚠️  Mismatch: Game {game_id} has season {season}, should be {derived}")
            
            if mismatches == 0:
                print(f"  ✅ All seasons match derived values")
                return True
            else:
                print(f"  ⚠️  Found {mismatches} mismatches")
                return False
        else:
            print(f"  ⚠️  No shots with season data found (may need to backfill)")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 80)
    print("SEASON TRACKING VERIFICATION")
    print("=" * 80)
    
    test_season_columns()
    test2_passed = test_season_derivation()
    test3_passed = test_raw_shots_season()
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if test2_passed and test3_passed:
        print("✅ All tests passed! Season tracking is working correctly.")
        print("\nNext steps:")
        print("  1. If raw_shots needs backfilling, run: UPDATE raw_shots SET season = derive_season_from_game_id(game_id)")
        print("  2. Test GSAx calculation with season grouping")
        print("  3. Proceed to Step 2: Predictive Power Validation")
    else:
        print("⚠️  Some tests failed. Please review the output above.")
    
    return test2_passed and test3_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

