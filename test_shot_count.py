#!/usr/bin/env python3
"""Test to see how many shots we're processing vs what's available"""
import requests

game_id = 2023010065
pbp_url = f"https://api-web.nhle.com/v1/gamecenter/{game_id}/play-by-play"

response = requests.get(pbp_url)
data = response.json()

plays = data.get('plays', [])
shot_events = [p for p in plays if p.get('typeCode') in [505, 506, 507]]

print(f"Game {game_id}:")
print(f"Total shot events (505, 506, 507): {len(shot_events)}")

# Count by type
goals = [s for s in shot_events if s.get('typeCode') == 505]
shots_on_goal = [s for s in shot_events if s.get('typeCode') == 506]
missed_shots = [s for s in shot_events if s.get('typeCode') == 507]

print(f"  Goals (505): {len(goals)}")
print(f"  Shots on goal (506): {len(shots_on_goal)}")
print(f"  Missed shots (507): {len(missed_shots)}")

# Check player IDs
with_player_id = 0
without_player_id = 0

for shot in shot_events:
    details = shot.get('details', {})
    type_code = shot.get('typeCode')
    
    if type_code == 505:  # Goal
        player_id = details.get('scoringPlayerId')
    else:  # 506 or 507
        player_id = details.get('shootingPlayerId')
    
    if player_id:
        with_player_id += 1
    else:
        without_player_id += 1
        print(f"  Missing player_id: typeCode={type_code}, details keys: {list(details.keys())}")

print(f"\nShots with player_id: {with_player_id}")
print(f"Shots without player_id: {without_player_id}")

# Check coordinates
with_coords = 0
without_coords = 0

for shot in shot_events:
    details = shot.get('details', {})
    x = details.get('xCoord')
    y = details.get('yCoord')
    
    if x is not None and y is not None:
        with_coords += 1
    else:
        without_coords += 1

print(f"\nShots with coordinates: {with_coords}")
print(f"Shots without coordinates: {without_coords}")

