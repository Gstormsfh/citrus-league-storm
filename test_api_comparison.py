#!/usr/bin/env python3
"""Compare API responses for current vs historical games"""
import requests

# Test current game (2025)
current_game = 2025020021
# Test historical game (2023)
historical_game = 2023010065

def test_game(game_id, label):
    print(f"\n{'='*60}")
    print(f"{label} Game: {game_id}")
    print('='*60)
    
    pbp_url = f"https://api-web.nhle.com/v1/gamecenter/{game_id}/play-by-play"
    response = requests.get(pbp_url)
    data = response.json()
    
    plays = data.get('plays', [])
    print(f"Total plays: {len(plays)}")
    
    # Count by type
    type_counts = {}
    for play in plays:
        type_code = play.get('typeCode')
        type_counts[type_code] = type_counts.get(type_code, 0) + 1
    
    print(f"Event types: {sorted(type_counts.items())}")
    
    # Count shots
    shots = [p for p in plays if p.get('typeCode') in [505, 506, 507]]
    print(f"Shot events (505, 506, 507): {len(shots)}")
    
    # Check if there are other endpoints
    print(f"\nChecking alternative endpoints...")
    
    # Try gamecenter summary
    summary_url = f"https://api-web.nhle.com/v1/gamecenter/{game_id}/summary"
    try:
        summary_resp = requests.get(summary_url)
        if summary_resp.status_code == 200:
            summary_data = summary_resp.json()
            print(f"  Summary endpoint: OK")
            # Check for shot data in summary
            if 'boxscore' in summary_data:
                boxscore = summary_data['boxscore']
                if 'teamGameStats' in boxscore:
                    for team in boxscore['teamGameStats']:
                        shots_on_goal = team.get('sog', 0)
                        print(f"    Team SOG from boxscore: {shots_on_goal}")
        else:
            print(f"  Summary endpoint: {summary_resp.status_code}")
    except Exception as e:
        print(f"  Summary endpoint: Error - {e}")

test_game(current_game, "CURRENT (2025)")
test_game(historical_game, "HISTORICAL (2023)")

