#!/usr/bin/env python3
"""
test_historical_api.py
Quick test to verify NHL API works for historical dates.
"""

import requests
from datetime import datetime

NHL_BASE_URL = "https://api-web.nhle.com/v1"

def test_historical_date(date_str: str):
    """Test if API returns data for a historical date."""
    schedule_url = f"{NHL_BASE_URL}/schedule/{date_str}"
    
    try:
        response = requests.get(schedule_url, timeout=10)
        print(f"  Date: {date_str}")
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            games = []
            for date_entry in data.get('gameWeek', []):
                if date_entry.get('date') == date_str:
                    for game in date_entry.get('games', []):
                        game_state = game.get('gameState')
                        if game_state in ['FINAL', 'OFF', 'F']:
                            games.append({
                                'id': game.get('id'),
                                'state': game_state
                            })
            
            print(f"  Games found: {len(games)}")
            if games:
                print(f"  Sample game IDs: {[g['id'] for g in games[:3]]}")
            return len(games) > 0
        else:
            print(f"  Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("TESTING NHL API FOR HISTORICAL DATES")
    print("=" * 80)
    
    test_dates = [
        '2023-10-10',  # Early 2023-24 season
        '2022-10-12',  # Early 2022-23 season
        '2021-10-13',  # Early 2021-22 season
        '2020-01-13',  # 2019-20 season (pre-COVID)
    ]
    
    results = []
    for date_str in test_dates:
        print(f"\nTesting {date_str}...")
        success = test_historical_date(date_str)
        results.append((date_str, success))
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    all_passed = all(success for _, success in results)
    
    for date_str, success in results:
        status = "✅" if success else "❌"
        print(f"  {status} {date_str}")
    
    if all_passed:
        print("\n✅ API works for all historical dates!")
        print("   Ready to pull historical seasons.")
    else:
        print("\n⚠️  Some dates failed. Check API availability.")

