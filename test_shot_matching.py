#!/usr/bin/env python3
"""
Test Phase 1G: Shot Matching with Running Game Clock
"""

import sys
from fix_gar_on_ice_tracking import (
    load_shifts_with_game_clock,
    load_shots_with_game_clock,
    match_shots_to_shifts,
    aggregate_on_ice_xgf_xga
)

print("="*80)
print("PHASE 1G: TESTING SHOT MATCHING")
print("="*80)
print()

try:
    # Load data
    print("Step 1: Loading shifts...")
    df_shifts = load_shifts_with_game_clock()
    if df_shifts is None:
        print("ERROR: Could not load shifts data")
        sys.exit(1)
    
    print("\nStep 2: Loading shots...")
    df_shots = load_shots_with_game_clock()
    if df_shots is None:
        print("ERROR: Could not load shots data")
        sys.exit(1)
    
    # Test on a single game first
    if len(df_shifts) > 0:
        test_game_id = df_shifts['game_id'].iloc[0]
        print(f"\nStep 3: Testing on game {test_game_id}...")
        
        game_shifts = df_shifts[df_shifts['game_id'] == test_game_id].copy()
        game_shots = df_shots[df_shots['game_id'] == test_game_id].copy()
        
        print(f"   Shifts: {len(game_shifts):,}")
        print(f"   Shots: {len(game_shots):,}")
        
        if len(game_shifts) > 0 and len(game_shots) > 0:
            # Match shots to shifts
            print("\nStep 4: Matching shots to shifts...")
            df_matched = match_shots_to_shifts(game_shifts, game_shots)
            
            if len(df_matched) > 0:
                print(f"\n✅ Matched {len(df_matched):,} player-shot records")
                
                # Show sample matches
                print(f"\n📋 Sample Matches (first 10):")
                sample = df_matched.head(10)
                for _, row in sample.iterrows():
                    print(f"   Shot {row['shot_id']} @ {row['shot_game_clock']:.1f}s: "
                          f"Player {row['player_id']} ({'xGF' if row['is_shooting_team'] else 'xGA'}: {row['xgf_value'] if row['is_shooting_team'] else row['xga_value']:.4f})")
                
                # Aggregate
                print("\nStep 5: Aggregating on-ice stats...")
                df_on_ice = aggregate_on_ice_xgf_xga(df_matched)
                
                print(f"\n✅ Aggregated stats for {len(df_on_ice):,} player-situation combinations")
                
                # Show sample stats
                print(f"\n📊 Sample On-Ice Stats (first 10):")
                print(df_on_ice.head(10).to_string(index=False))
                
                # Show summary by situation
                print(f"\n📈 Summary by Situation:")
                for situation in df_on_ice['situation'].unique():
                    sit_data = df_on_ice[df_on_ice['situation'] == situation]
                    print(f"   {situation}:")
                    print(f"      Players: {len(sit_data):,}")
                    print(f"      Total xGF: {sit_data['on_ice_xgf'].sum():.2f}")
                    print(f"      Total xGA: {sit_data['on_ice_xga'].sum():.2f}")
                
                print(f"\n✅ Phase 1G Shot Matching Test: SUCCESS")
            else:
                print(f"\n⚠️  No matches found (this may indicate a data issue)")
        else:
            print(f"\n⚠️  No shifts or shots for test game")
    else:
        print(f"\n⚠️  No shifts data available")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

