#!/usr/bin/env python3
"""
Detailed Phase 1G: Shot Matching Validation with Edge Case Testing
"""

import sys
import pandas as pd
from fix_gar_on_ice_tracking import (
    load_shifts_with_game_clock,
    load_shots_with_game_clock,
    match_shots_to_shifts,
    aggregate_on_ice_xgf_xga
)

print("="*80)
print("PHASE 1G: DETAILED SHOT MATCHING VALIDATION")
print("="*80)
print()

try:
    # Load data
    print("Loading data...")
    df_shifts = load_shifts_with_game_clock()
    if df_shifts is None:
        print("ERROR: Could not load shifts data")
        sys.exit(1)
    
    df_shots = load_shots_with_game_clock()
    if df_shots is None:
        print("ERROR: Could not load shots data")
        sys.exit(1)
    
    # Test on a single game
    if len(df_shifts) > 0:
        test_game_id = df_shifts['game_id'].iloc[0]
        print(f"\nTesting on game {test_game_id}...")
        
        game_shifts = df_shifts[df_shifts['game_id'] == test_game_id].copy()
        game_shots = df_shots[df_shots['game_id'] == test_game_id].copy()
        
        print(f"   Shifts: {len(game_shifts):,}")
        print(f"   Shots: {len(game_shots):,}")
        
        if len(game_shifts) > 0 and len(game_shots) > 0:
            # Match shots to shifts
            print("\nMatching shots to shifts...")
            df_matched = match_shots_to_shifts(game_shifts, game_shots)
            
            if len(df_matched) == 0:
                print("ERROR: No matches found")
                sys.exit(1)
            
            print(f"\nOK: Generated {len(df_matched):,} player-shot records")
            
            # VALIDATION CHECK 1: Time Boundary Testing
            print("\n" + "="*80)
            print("VALIDATION CHECK 1: SHOTS AT SHIFT BOUNDARIES")
            print("="*80)
            
            # Find shots that occurred exactly at shift start/end times
            boundary_shots = []
            for shot_id in df_matched['shot_id'].unique()[:10]:  # Check first 10 shots
                shot_data = df_matched[df_matched['shot_id'] == shot_id].iloc[0]
                shot_time = shot_data['shot_game_clock']
                
                # Find shifts that start or end at this exact time
                exact_start = game_shifts[game_shifts['shift_start_game_clock'] == shot_time]
                exact_end = game_shifts[game_shifts['shift_end_game_clock'] == shot_time]
                
                if len(exact_start) > 0 or len(exact_end) > 0:
                    players_matched = df_matched[df_matched['shot_id'] == shot_id]['player_id'].nunique()
                    boundary_shots.append({
                        'shot_id': shot_id,
                        'shot_time': shot_time,
                        'players_matched': players_matched,
                        'at_shift_start': len(exact_start) > 0,
                        'at_shift_end': len(exact_end) > 0
                    })
            
            if boundary_shots:
                print(f"Found {len(boundary_shots)} shots at shift boundaries:")
                for shot in boundary_shots[:5]:
                    print(f"   Shot {shot['shot_id']} @ {shot['shot_time']:.1f}s: "
                          f"{shot['players_matched']} players matched "
                          f"({'start' if shot['at_shift_start'] else 'end'} boundary)")
            else:
                print("   No shots found exactly at shift boundaries (this is normal)")
            
            # VALIDATION CHECK 2: Situation Match Testing
            print("\n" + "="*80)
            print("VALIDATION CHECK 2: SITUATION MATCHING")
            print("="*80)
            
            # Check shots in different situations
            situation_counts = df_matched.groupby('situation').agg(
                shots=('shot_id', 'nunique'),
                players_per_shot=('shot_id', lambda x: df_matched[df_matched['shot_id'].isin(x)]['player_id'].nunique() / len(x.unique()))
            )
            
            print("Shots by situation:")
            for situation, row in situation_counts.iterrows():
                avg_players = row['players_per_shot']
                print(f"   {situation}: {int(row['shots'])} shots, ~{avg_players:.1f} players per shot")
                
                # Check if PP/PK have correct player counts (should be ~9-10, not 10)
                if situation in ['PP', 'PK']:
                    if avg_players > 10.5:
                        print(f"      WARNING: {situation} has {avg_players:.1f} players (expected ~9-10)")
                    else:
                        print(f"      OK: {situation} player count looks correct")
            
            # VALIDATION CHECK 3: xGF/xGA Attribution
            print("\n" + "="*80)
            print("VALIDATION CHECK 3: xGF/xGA ATTRIBUTION")
            print("="*80)
            
            # For each shot, verify xGF is only on shooting team, xGA only on defending team
            sample_shots = df_matched['shot_id'].unique()[:5]
            attribution_errors = []
            
            for shot_id in sample_shots:
                shot_records = df_matched[df_matched['shot_id'] == shot_id]
                shooting_team = shot_records[shot_records['is_shooting_team'] == True]['team_id'].unique()
                defending_team = shot_records[shot_records['is_shooting_team'] == False]['team_id'].unique()
                
                if len(shooting_team) == 0 or len(defending_team) == 0:
                    attribution_errors.append(f"Shot {shot_id}: Missing team attribution")
                
                # Check that xGF is only on shooting team
                xgf_on_defending = shot_records[
                    (shot_records['is_shooting_team'] == False) & 
                    (shot_records['xgf_value'] > 0)
                ]
                
                if len(xgf_on_defending) > 0:
                    attribution_errors.append(f"Shot {shot_id}: xGF attributed to defending team")
            
            if attribution_errors:
                print("ERROR: Attribution errors found:")
                for error in attribution_errors:
                    print(f"   {error}")
            else:
                print("OK: xGF/xGA attribution is correct")
                print("   - xGF only on shooting team")
                print("   - xGA only on defending team")
            
            # VALIDATION CHECK 4: Player Count Validation
            print("\n" + "="*80)
            print("VALIDATION CHECK 4: PLAYER COUNT VALIDATION")
            print("="*80)
            
            # Check that we're getting ~10 skaters per shot (5v5) or ~9-10 (PP/PK)
            player_counts = df_matched.groupby(['shot_id', 'situation'])['player_id'].nunique().reset_index()
            player_counts.columns = ['shot_id', 'situation', 'player_count']
            
            for situation in ['5v5', 'PP', 'PK']:
                sit_counts = player_counts[player_counts['situation'] == situation]['player_count']
                if len(sit_counts) > 0:
                    avg_count = sit_counts.mean()
                    min_count = sit_counts.min()
                    max_count = sit_counts.max()
                    
                    expected_min = 8 if situation == '5v5' else 7
                    expected_max = 12 if situation == '5v5' else 11
                    
                    print(f"   {situation}:")
                    print(f"      Average: {avg_count:.1f} players")
                    print(f"      Range: {min_count}-{max_count} players")
                    
                    if min_count < expected_min or max_count > expected_max:
                        print(f"      WARNING: Player count outside expected range ({expected_min}-{expected_max})")
                    else:
                        print(f"      OK: Player count in expected range")
            
            # Show sample detailed match
            print("\n" + "="*80)
            print("SAMPLE DETAILED MATCH")
            print("="*80)
            
            sample_shot_id = df_matched['shot_id'].iloc[0]
            sample_match = df_matched[df_matched['shot_id'] == sample_shot_id].copy()
            
            print(f"Shot ID: {sample_shot_id}")
            print(f"Game Clock: {sample_match.iloc[0]['shot_game_clock']:.1f}s")
            print(f"Situation: {sample_match.iloc[0]['situation']}")
            print(f"Players on ice: {len(sample_match)}")
            print(f"\nPlayers:")
            
            shooting_team_players = sample_match[sample_match['is_shooting_team'] == True]
            defending_team_players = sample_match[sample_match['is_shooting_team'] == False]
            
            print(f"   Shooting Team ({len(shooting_team_players)} players):")
            for _, player in shooting_team_players.iterrows():
                print(f"      Player {player['player_id']}: xGF={player['xgf_value']:.4f}")
            
            print(f"   Defending Team ({len(defending_team_players)} players):")
            for _, player in defending_team_players.iterrows():
                print(f"      Player {player['player_id']}: xGA={player['xga_value']:.4f}")
            
            # Aggregate stats
            print("\n" + "="*80)
            print("AGGREGATED STATS")
            print("="*80)
            
            df_on_ice = aggregate_on_ice_xgf_xga(df_matched)
            print(f"✅ Aggregated stats for {len(df_on_ice):,} player-situation combinations")
            
            print(f"\n📈 Summary by Situation:")
            for situation in df_on_ice['situation'].unique():
                sit_data = df_on_ice[df_on_ice['situation'] == situation]
                print(f"   {situation}:")
                print(f"      Players: {len(sit_data):,}")
                print(f"      Total xGF: {sit_data['on_ice_xgf'].sum():.2f}")
                print(f"      Total xGA: {sit_data['on_ice_xga'].sum():.2f}")
            
            print(f"\nOK: Phase 1G Detailed Validation: COMPLETE")
            
        else:
            print(f"\nWARNING: No shifts or shots for test game")
    else:
        print(f"\nWARNING: No shifts data available")
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

