#!/usr/bin/env python3
"""
Debug shot matching to understand why player counts are low
"""

import pandas as pd
from fix_gar_on_ice_tracking import (
    load_shifts_with_game_clock,
    load_shots_with_game_clock,
    match_shots_to_shifts
)

print("="*80)
print("DEBUGGING SHOT MATCHING")
print("="*80)

# Load data
df_shifts = load_shifts_with_game_clock()
df_shots = load_shots_with_game_clock()

# Test on a single game
test_game_id = df_shifts['game_id'].iloc[0]
print(f"\nTesting game {test_game_id}")

game_shifts = df_shifts[df_shifts['game_id'] == test_game_id].copy()
game_shots = df_shots[df_shots['game_id'] == test_game_id].copy()

print(f"Shifts: {len(game_shifts):,}")
print(f"Shots: {len(game_shots):,}")

# Pick a specific shot to debug
sample_shot = game_shots.iloc[0]
shot_time = sample_shot['shot_game_clock']
shot_period = sample_shot['period']

print(f"\nDebugging Shot ID: {sample_shot['id']}")
print(f"Shot time: {shot_time:.1f}s (Period {shot_period})")
print(f"Shooting team: {sample_shot['event_owner_team_id']}")

# Find all shifts that should match
overlapping_shifts = game_shifts[
    (game_shifts['shift_start_game_clock'] <= shot_time) &
    (game_shifts['shift_end_game_clock'] > shot_time)
]

print(f"\nOverlapping shifts found: {len(overlapping_shifts)}")
print(f"Unique players: {overlapping_shifts['player_id'].nunique()}")

# Check for duplicates
duplicates = overlapping_shifts[overlapping_shifts.duplicated(subset=['player_id'], keep=False)]
if len(duplicates) > 0:
    print(f"\nWARNING: Found {len(duplicates)} duplicate player entries:")
    for player_id in duplicates['player_id'].unique()[:5]:
        player_shifts = duplicates[duplicates['player_id'] == player_id]
        print(f"   Player {player_id}: {len(player_shifts)} shifts")
        for _, shift in player_shifts.iterrows():
            print(f"      {shift['shift_start_game_clock']:.1f}s - {shift['shift_end_game_clock']:.1f}s ({shift['situation']})")

# Group by team
shooting_team_id = sample_shot['event_owner_team_id']
shooting_team_players = overlapping_shifts[overlapping_shifts['team_id'] == shooting_team_id]
defending_team_players = overlapping_shifts[overlapping_shifts['team_id'] != shooting_team_id]

print(f"\nTeam breakdown:")
print(f"   Shooting team ({shooting_team_id}): {shooting_team_players['player_id'].nunique()} unique players")
print(f"   Defending team: {defending_team_players['player_id'].nunique()} unique players")
print(f"   Total: {overlapping_shifts['player_id'].nunique()} unique players")

# Check if we're missing players by looking at all shifts in this period
period_shifts = game_shifts[game_shifts['period'] == shot_period]
print(f"\nAll shifts in period {shot_period}: {len(period_shifts)}")
print(f"Unique players in period: {period_shifts['player_id'].nunique()}")

# Check shifts near this time
nearby_shifts = game_shifts[
    (game_shifts['period'] == shot_period) &
    (abs(game_shifts['shift_start_game_clock'] - shot_time) < 30) |
    (abs(game_shifts['shift_end_game_clock'] - shot_time) < 30)
]
print(f"\nShifts within 30s of shot time: {len(nearby_shifts)}")
print(f"Unique players in nearby shifts: {nearby_shifts['player_id'].nunique()}")

