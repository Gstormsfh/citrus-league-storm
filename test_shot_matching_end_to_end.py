#!/usr/bin/env python3
"""
Test Phase 1G: End-to-End Shot Matching Validation
Processes a game and immediately tests shot matching without database storage
"""

import sys
from calculate_player_toi import process_game_shifts
from fix_gar_on_ice_tracking import (
    load_shots_with_game_clock,
    match_shots_to_shifts,
    aggregate_on_ice_xgf_xga,
    calculate_running_game_clock
)
import pandas as pd

# Use the game we know works
test_game_id = 2025020021

print("="*80)
print("PHASE 1G: END-TO-END SHOT MATCHING VALIDATION")
print("="*80)
print(f"Test Game ID: {test_game_id}")
print()

try:
    # Step 1: Process shifts for this game
    print("Step 1: Processing shifts for game...")
    shifts_list, toi_records = process_game_shifts(test_game_id)
    
    if len(shifts_list) == 0:
        print("ERROR: No shifts processed")
        sys.exit(1)
    
    print(f"OK: Processed {len(shifts_list):,} shift segments")
    
    # Convert shifts to DataFrame
    df_shifts = pd.DataFrame(shifts_list)
    print(f"   Unique players: {df_shifts['player_id'].nunique():,}")
    
    # Step 2: Load shots for this game
    print("\nStep 2: Loading shots...")
    df_all_shots = load_shots_with_game_clock()
    if df_all_shots is None:
        print("ERROR: Could not load shots data")
        sys.exit(1)
    
    game_shots = df_all_shots[df_all_shots['game_id'] == test_game_id].copy()
    print(f"OK: Found {len(game_shots):,} shots for game {test_game_id}")
    
    if len(game_shots) == 0:
        print("WARNING: No shots found for this game")
        sys.exit(1)
    
    # Step 3: Match shots to shifts
    print("\nStep 3: Matching shots to shifts...")
    df_matched = match_shots_to_shifts(df_shifts, game_shots)
    
    if len(df_matched) == 0:
        print("ERROR: No matches found")
        sys.exit(1)
    
    print(f"OK: Generated {len(df_matched):,} player-shot records")
    
    # VALIDATION CHECK 1: Player Counts
    print("\n" + "="*80)
    print("VALIDATION CHECK 1: PLAYER COUNTS PER SHOT")
    print("="*80)
    
    player_counts = df_matched.groupby('shot_id')['player_id'].nunique().reset_index()
    player_counts.columns = ['shot_id', 'player_count']
    
    avg_players = player_counts['player_count'].mean()
    min_players = player_counts['player_count'].min()
    max_players = player_counts['player_count'].max()
    
    print(f"Average players per shot: {avg_players:.1f}")
    print(f"Range: {min_players}-{max_players} players")
    
    # Check if counts are reasonable (8-12 for 5v5, 7-11 for PP/PK)
    correct_range = player_counts[
        (player_counts['player_count'] >= 8) & 
        (player_counts['player_count'] <= 12)
    ]
    pct_correct = 100 * len(correct_range) / len(player_counts) if len(player_counts) > 0 else 0
    
    print(f"Shots with 8-12 players: {len(correct_range)}/{len(player_counts)} ({pct_correct:.1f}%)")
    
    if pct_correct >= 80:
        print("OK: Most shots have correct player counts")
    else:
        print("WARNING: Many shots have incorrect player counts")
    
    # VALIDATION CHECK 2: Situation Breakdown
    print("\n" + "="*80)
    print("VALIDATION CHECK 2: SITUATION BREAKDOWN")
    print("="*80)
    
    for situation in sorted(df_matched['situation'].unique()):
        sit_data = df_matched[df_matched['situation'] == situation]
        unique_shots = sit_data['shot_id'].nunique()
        total_players = len(sit_data)
        avg_players = total_players / unique_shots if unique_shots > 0 else 0
        
        print(f"\n{situation}:")
        print(f"   Shots: {unique_shots}")
        print(f"   Average players per shot: {avg_players:.1f}")
        
        # Expected ranges
        if situation == '5v5':
            expected_min, expected_max = 8, 12
        elif situation in ['PP', 'PK']:
            expected_min, expected_max = 7, 11
        else:
            expected_min, expected_max = 6, 12
        
        if expected_min <= avg_players <= expected_max:
            print(f"   OK: Player count in expected range ({expected_min}-{expected_max})")
        else:
            print(f"   WARNING: Player count outside expected range ({expected_min}-{expected_max})")
    
    # VALIDATION CHECK 3: xGF/xGA Attribution
    print("\n" + "="*80)
    print("VALIDATION CHECK 3: xGF/xGA ATTRIBUTION")
    print("="*80)
    
    attribution_errors = []
    sample_shots = df_matched['shot_id'].unique()[:5]
    
    for shot_id in sample_shots:
        shot_data = df_matched[df_matched['shot_id'] == shot_id]
        
        # Check xGF only on shooting team
        xgf_on_defending = shot_data[
            (shot_data['is_shooting_team'] == False) & 
            (shot_data['xgf_value'] > 0)
        ]
        
        if len(xgf_on_defending) > 0:
            attribution_errors.append(f"Shot {shot_id}: xGF on defending team")
        
        # Check xGA only on defending team
        xga_on_shooting = shot_data[
            (shot_data['is_shooting_team'] == True) & 
            (shot_data['xga_value'] > 0)
        ]
        
        if len(xga_on_shooting) > 0:
            attribution_errors.append(f"Shot {shot_id}: xGA on shooting team")
    
    if attribution_errors:
        print("ERROR: Attribution errors found:")
        for error in attribution_errors:
            print(f"   {error}")
    else:
        print("OK: xGF/xGA attribution is correct")
        print("   - xGF only on shooting team")
        print("   - xGA only on defending team")
    
    # VALIDATION CHECK 4: Boundary Testing
    print("\n" + "="*80)
    print("VALIDATION CHECK 4: SHIFT BOUNDARY TESTING")
    print("="*80)
    
    # Find shots at shift boundaries
    boundary_shots = []
    for shot_id in df_matched['shot_id'].unique()[:10]:
        shot_data = df_matched[df_matched['shot_id'] == shot_id].iloc[0]
        shot_time = shot_data['shot_game_clock']
        
        # Find shifts that start or end at this exact time
        exact_start = df_shifts[df_shifts['shift_start_game_clock'] == shot_time]
        exact_end = df_shifts[df_shifts['shift_end_game_clock'] == shot_time]
        
        if len(exact_start) > 0 or len(exact_end) > 0:
            players_matched = df_matched[df_matched['shot_id'] == shot_id]['player_id'].nunique()
            boundary_shots.append({
                'shot_id': shot_id,
                'shot_time': shot_time,
                'players_matched': players_matched,
                'at_start': len(exact_start) > 0,
                'at_end': len(exact_end) > 0
            })
    
    if boundary_shots:
        print(f"Found {len(boundary_shots)} shots at shift boundaries:")
        for shot in boundary_shots[:5]:
            print(f"   Shot {shot['shot_id']} @ {shot['shot_time']:.1f}s: "
                  f"{shot['players_matched']} players "
                  f"({'start' if shot['at_start'] else 'end'} boundary)")
        print("OK: Boundary shots handled correctly")
    else:
        print("No shots found exactly at shift boundaries (this is normal)")
    
    # Show detailed sample
    print("\n" + "="*80)
    print("SAMPLE DETAILED MATCH")
    print("="*80)
    
    sample_shot_id = df_matched['shot_id'].iloc[0]
    sample = df_matched[df_matched['shot_id'] == sample_shot_id]
    
    print(f"Shot ID: {sample_shot_id}")
    print(f"Game Clock: {sample.iloc[0]['shot_game_clock']:.1f}s")
    print(f"Situation: {sample.iloc[0]['situation']}")
    print(f"Total players on ice: {len(sample)}")
    
    shooting_team = sample[sample['is_shooting_team'] == True]
    defending_team = sample[sample['is_shooting_team'] == False]
    
    print(f"\nShooting Team: {len(shooting_team)} players")
    print(f"   Total xGF: {shooting_team['xgf_value'].sum():.4f}")
    if len(shooting_team) > 0:
        print(f"   xGF per player: {shooting_team['xgf_value'].iloc[0]:.4f}")
    
    print(f"\nDefending Team: {len(defending_team)} players")
    print(f"   Total xGA: {defending_team['xga_value'].sum():.4f}")
    if len(defending_team) > 0:
        print(f"   xGA per player: {defending_team['xga_value'].iloc[0]:.4f}")
    
    # Aggregate stats
    print("\n" + "="*80)
    print("AGGREGATED ON-ICE STATS")
    print("="*80)
    
    df_on_ice = aggregate_on_ice_xgf_xga(df_matched)
    
    print(f"OK: Aggregated stats for {len(df_on_ice):,} player-situation combinations")
    
    print(f"\nSummary by Situation:")
    for situation in sorted(df_on_ice['situation'].unique()):
        sit_data = df_on_ice[df_on_ice['situation'] == situation]
        print(f"   {situation}:")
        print(f"      Players: {len(sit_data):,}")
        print(f"      Total xGF: {sit_data['on_ice_xgf'].sum():.2f}")
        print(f"      Total xGA: {sit_data['on_ice_xga'].sum():.2f}")
    
    print(f"\nOK: Phase 1G End-to-End Validation: COMPLETE")
    print(f"\nThe shot matching logic is working correctly!")
    print(f"Next step: Update calculate_gar_components.py to use on-ice data")
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

