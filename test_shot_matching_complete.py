#!/usr/bin/env python3
"""
Test Phase 1G: Shot Matching on Known Complete Game
"""

import sys
import pandas as pd
from fix_gar_on_ice_tracking import (
    load_shifts_with_game_clock,
    load_shots_with_game_clock,
    match_shots_to_shifts,
    aggregate_on_ice_xgf_xga
)

# Use the game we know has complete shift data
test_game_id = 2025020021

print("="*80)
print("PHASE 1G: SHOT MATCHING VALIDATION")
print("="*80)
print(f"Test Game ID: {test_game_id}")
print()

try:
    # Load data
    print("Loading shifts...")
    df_shifts = load_shifts_with_game_clock()
    if df_shifts is None:
        print("ERROR: Could not load shifts data")
        sys.exit(1)
    
    print("\nLoading shots...")
    df_shots = load_shots_with_game_clock()
    if df_shots is None:
        print("ERROR: Could not load shots data")
        sys.exit(1)
    
    # Filter to test game
    game_shifts = df_shifts[df_shifts['game_id'] == test_game_id].copy()
    game_shots = df_shots[df_shots['game_id'] == test_game_id].copy()
    
    print(f"\nGame {test_game_id}:")
    print(f"   Shifts: {len(game_shifts):,}")
    print(f"   Shots: {len(game_shots):,}")
    
    if len(game_shifts) == 0:
        print(f"\nWARNING: No shifts found for game {test_game_id}")
        print("   This game may not have been processed yet.")
        print("   Run: python calculate_player_toi.py")
        sys.exit(1)
    
    if len(game_shots) == 0:
        print(f"\nWARNING: No shots found for game {test_game_id}")
        sys.exit(1)
    
    # Match shots to shifts
    print("\nMatching shots to shifts...")
    df_matched = match_shots_to_shifts(game_shifts, game_shots)
    
    if len(df_matched) == 0:
        print("ERROR: No matches found")
        sys.exit(1)
    
    print(f"\nOK: Generated {len(df_matched):,} player-shot records")
    
    # VALIDATION: Check player counts per shot
    print("\n" + "="*80)
    print("VALIDATION: PLAYER COUNTS PER SHOT")
    print("="*80)
    
    player_counts = df_matched.groupby('shot_id')['player_id'].nunique().reset_index()
    player_counts.columns = ['shot_id', 'player_count']
    
    print(f"Average players per shot: {player_counts['player_count'].mean():.1f}")
    print(f"Min players: {player_counts['player_count'].min()}")
    print(f"Max players: {player_counts['player_count'].max()}")
    
    # Check shots with correct player counts (8-12 for 5v5)
    correct_counts = player_counts[
        (player_counts['player_count'] >= 8) & 
        (player_counts['player_count'] <= 12)
    ]
    print(f"\nShots with 8-12 players: {len(correct_counts)}/{len(player_counts)} ({100*len(correct_counts)/len(player_counts):.1f}%)")
    
    # Check shots by situation
    print("\n" + "="*80)
    print("VALIDATION: SITUATION BREAKDOWN")
    print("="*80)
    
    for situation in df_matched['situation'].unique():
        sit_shots = df_matched[df_matched['situation'] == situation]
        unique_shots = sit_shots['shot_id'].nunique()
        avg_players = len(sit_shots) / unique_shots if unique_shots > 0 else 0
        
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
    
    # VALIDATION: Check xGF/xGA attribution
    print("\n" + "="*80)
    print("VALIDATION: xGF/xGA ATTRIBUTION")
    print("="*80)
    
    # Sample a few shots to verify attribution
    sample_shots = df_matched['shot_id'].unique()[:3]
    attribution_ok = True
    
    for shot_id in sample_shots:
        shot_data = df_matched[df_matched['shot_id'] == shot_id]
        shooting_team = shot_data[shot_data['is_shooting_team'] == True]['team_id'].unique()
        defending_team = shot_data[shot_data['is_shooting_team'] == False]['team_id'].unique()
        
        # Check that xGF is only on shooting team
        xgf_on_defending = shot_data[
            (shot_data['is_shooting_team'] == False) & 
            (shot_data['xgf_value'] > 0)
        ]
        
        if len(xgf_on_defending) > 0:
            print(f"ERROR: Shot {shot_id} has xGF on defending team")
            attribution_ok = False
        
        # Check that xGA is only on defending team
        xga_on_shooting = shot_data[
            (shot_data['is_shooting_team'] == True) & 
            (shot_data['xga_value'] > 0)
        ]
        
        if len(xga_on_shooting) > 0:
            print(f"ERROR: Shot {shot_id} has xGA on shooting team")
            attribution_ok = False
    
    if attribution_ok:
        print("OK: xGF/xGA attribution is correct")
    
    # Show detailed sample
    print("\n" + "="*80)
    print("SAMPLE SHOT MATCH")
    print("="*80)
    
    sample_shot_id = df_matched['shot_id'].iloc[0]
    sample = df_matched[df_matched['shot_id'] == sample_shot_id]
    
    print(f"Shot ID: {sample_shot_id}")
    print(f"Game Clock: {sample.iloc[0]['shot_game_clock']:.1f}s")
    print(f"Situation: {sample.iloc[0]['situation']}")
    print(f"Players on ice: {len(sample)}")
    
    shooting_team_players = sample[sample['is_shooting_team'] == True]
    defending_team_players = sample[sample['is_shooting_team'] == False]
    
    print(f"\nShooting Team: {len(shooting_team_players)} players")
    print(f"   Total xGF: {shooting_team_players['xgf_value'].sum():.4f}")
    
    print(f"\nDefending Team: {len(defending_team_players)} players")
    print(f"   Total xGA: {defending_team_players['xga_value'].sum():.4f}")
    
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
    
    print(f"\nOK: Phase 1G Validation: COMPLETE")
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

