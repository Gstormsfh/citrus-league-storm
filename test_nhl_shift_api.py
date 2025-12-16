#!/usr/bin/env python3
"""
Phase 1A: NHL Shift API Verification Script

Tests multiple potential NHL API endpoints for official shift data.
Documents JSON structure and data availability.
"""

import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# NHL API base URLs
NHL_BASE_URL = "https://api-web.nhle.com/v1"  # Modern API
NHL_LEGACY_BASE_URL = "https://api.nhle.com/stats/rest/en"  # Legacy API

# Supabase connection (for getting sample game IDs)
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_sample_game_id():
    """Get a sample game_id from database or recent games."""
    # Try database first
    if supabase:
        try:
            response = supabase.table('nhl_games').select('game_id').limit(1).execute()
            if response.data:
                return response.data[0]['game_id']
        except Exception as e:
            print(f"  Note: Could not get game_id from database: {e}")
    
    # Fallback: Get recent finished game from API
    try:
        # Try yesterday's date
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        schedule_url = f"{NHL_BASE_URL}/schedule/{yesterday}"
        response = requests.get(schedule_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            for date_entry in data.get('gameWeek', []):
                for game in date_entry.get('games', []):
                    if game.get('gameState') in ['FINAL', 'OFF', 'F']:
                        return game.get('id')
    except Exception as e:
        print(f"  Note: Could not get game_id from schedule: {e}")
    
    # Hardcoded fallback (a known game from 2024-25 season)
    return "2024020453"  # Example game ID format


def test_endpoint(url, description):
    """Test a single API endpoint and return results."""
    print(f"\n{'='*80}")
    print(f"Testing: {description}")
    print(f"URL: {url}")
    print(f"{'='*80}")
    
    try:
        response = requests.get(url, timeout=15)
        status_code = response.status_code
        
        print(f"Status Code: {status_code}")
        
        if status_code == 200:
            try:
                data = response.json()
                print(f"✅ SUCCESS: Endpoint exists and returns JSON")
                print(f"Response Type: {type(data)}")
                
                # Analyze structure
                if isinstance(data, dict):
                    print(f"\nTop-level Keys: {list(data.keys())[:20]}")
                    # Check for common shift-related keys
                    shift_keywords = ['shift', 'shifts', 'shiftChart', 'shiftChartData', 'data', 'players']
                    found_keys = [k for k in data.keys() if any(kw in k.lower() for kw in shift_keywords)]
                    if found_keys:
                        print(f"🔍 Shift-related keys found: {found_keys}")
                
                elif isinstance(data, list):
                    print(f"Response is a list with {len(data)} items")
                    if len(data) > 0:
                        print(f"First item keys: {list(data[0].keys())[:20] if isinstance(data[0], dict) else 'Not a dict'}")
                
                # Save sample response
                safe_desc = description.replace(' ', '_').replace('/', '_').replace('-', '_').lower()
                filename = f"shift_api_sample_{safe_desc}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"💾 Sample response saved to: {filename}")
                
                return {
                    'success': True,
                    'status_code': status_code,
                    'data_type': type(data).__name__,
                    'structure': analyze_structure(data),
                    'sample_file': filename
                }
                
            except json.JSONDecodeError:
                print(f"⚠️  Response is not valid JSON")
                print(f"Response preview: {response.text[:200]}")
                return {'success': False, 'error': 'Not JSON'}
        
        elif status_code == 404:
            print(f"❌ NOT FOUND: Endpoint does not exist")
            return {'success': False, 'status_code': 404}
        
        else:
            print(f"⚠️  Unexpected status code: {status_code}")
            print(f"Response preview: {response.text[:200]}")
            return {'success': False, 'status_code': status_code}
    
    except requests.exceptions.Timeout:
        print(f"⏱️  TIMEOUT: Request took too long")
        return {'success': False, 'error': 'Timeout'}
    
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: {e}")
        return {'success': False, 'error': str(e)}


def analyze_structure(data, max_depth=3, current_depth=0):
    """Recursively analyze JSON structure."""
    if current_depth >= max_depth:
        return "..."
    
    if isinstance(data, dict):
        structure = {}
        for key, value in list(data.items())[:10]:  # Limit to first 10 keys
            if isinstance(value, (dict, list)):
                structure[key] = analyze_structure(value, max_depth, current_depth + 1)
            else:
                structure[key] = type(value).__name__
        return structure
    
    elif isinstance(data, list) and len(data) > 0:
        first_item = data[0]
        if isinstance(first_item, dict):
            return [analyze_structure(first_item, max_depth, current_depth + 1)]
        else:
            return [type(first_item).__name__]
    
    return type(data).__name__


def main():
    """Main test function."""
    print("="*80)
    print("NHL SHIFT API VERIFICATION - Phase 1A")
    print("="*80)
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Get sample game ID
    print("\n📋 Getting sample game_id...")
    game_id = get_sample_game_id()
    print(f"✅ Using game_id: {game_id}")
    
    # Test endpoints
    results = {}
    
    # Test 1: Modern API - shifts endpoint
    url1 = f"{NHL_BASE_URL}/gamecenter/{game_id}/shifts"
    results['modern_shifts'] = test_endpoint(url1, "Modern API - /shifts")
    
    # Test 2: Modern API - shift-chart endpoint
    url2 = f"{NHL_BASE_URL}/gamecenter/{game_id}/shift-chart"
    results['modern_shift_chart'] = test_endpoint(url2, "Modern API - /shift-chart")
    
    # Test 3: Modern API - shiftChart endpoint (camelCase)
    url3 = f"{NHL_BASE_URL}/gamecenter/{game_id}/shiftChart"
    results['modern_shiftChart'] = test_endpoint(url3, "Modern API - /shiftChart")
    
    # Test 4: Legacy API - shiftcharts endpoint
    url4 = f"{NHL_LEGACY_BASE_URL}/shiftcharts?cayenneExp=gameId={game_id}"
    results['legacy_shiftcharts'] = test_endpoint(url4, "Legacy API - /shiftcharts")
    
    # Test 5: Check if shift data is embedded in play-by-play
    print(f"\n{'='*80}")
    print("Testing: Play-by-Play for embedded shift data")
    print(f"{'='*80}")
    try:
        pbp_url = f"{NHL_BASE_URL}/gamecenter/{game_id}/play-by-play"
        response = requests.get(pbp_url, timeout=15)
        if response.status_code == 200:
            pbp_data = response.json()
            # Check for shift-related keys
            shift_keywords = ['shift', 'shiftChart', 'shifts', 'lineChange']
            found_in_pbp = []
            for key in pbp_data.keys():
                if any(kw in key.lower() for kw in shift_keywords):
                    found_in_pbp.append(key)
            
            if found_in_pbp:
                print(f"✅ Found shift-related keys in PBP: {found_in_pbp}")
            else:
                print(f"❌ No shift-related keys found in PBP")
                print(f"PBP top-level keys: {list(pbp_data.keys())[:20]}")
            
            results['pbp_embedded'] = {
                'success': len(found_in_pbp) > 0,
                'keys_found': found_in_pbp
            }
    except Exception as e:
        print(f"❌ Error checking PBP: {e}")
        results['pbp_embedded'] = {'success': False, 'error': str(e)}
    
    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    
    successful_endpoints = []
    for name, result in results.items():
        if result.get('success'):
            successful_endpoints.append(name)
            print(f"✅ {name}: SUCCESS")
        else:
            print(f"❌ {name}: FAILED")
    
    if successful_endpoints:
        print(f"\n🎯 Found {len(successful_endpoints)} working endpoint(s)!")
        print(f"Working endpoints: {', '.join(successful_endpoints)}")
    else:
        print(f"\n⚠️  No working shift endpoints found. May need to use heuristic approach.")
    
    # Generate reference document
    generate_reference_document(results, game_id)
    
    return results


def generate_reference_document(results, game_id):
    """Generate API reference documentation."""
    doc = f"""# NHL Shift API Reference

Generated: {datetime.now().isoformat()}
Test Game ID: {game_id}

## Endpoints Tested

"""
    
    for name, result in results.items():
        doc += f"### {name.replace('_', ' ').title()}\n\n"
        if result.get('success'):
            doc += f"- **Status**: ✅ SUCCESS\n"
            doc += f"- **Data Type**: {result.get('data_type', 'Unknown')}\n"
            if 'sample_file' in result:
                doc += f"- **Sample File**: `{result['sample_file']}`\n"
            if 'structure' in result:
                doc += f"- **Structure**:\n```json\n{json.dumps(result['structure'], indent=2)}\n```\n"
        else:
            doc += f"- **Status**: ❌ FAILED\n"
            if 'status_code' in result:
                doc += f"- **Status Code**: {result['status_code']}\n"
            if 'error' in result:
                doc += f"- **Error**: {result['error']}\n"
        doc += "\n"
    
    doc += """
## Next Steps

1. Review sample JSON files to understand data structure
2. Identify which endpoint provides the most complete/accurate shift data
3. Document field names for:
   - Player ID
   - Shift start time
   - Shift end time
   - Period
   - Situation (5v5, PP, PK)
   - Duration
4. Integrate shift data fetching into `data_acquisition.py`
"""
    
    with open('NHL_SHIFT_API_REFERENCE.md', 'w', encoding='utf-8') as f:
        f.write(doc)
    
    print(f"\n📄 Reference document saved to: NHL_SHIFT_API_REFERENCE.md")


if __name__ == "__main__":
    main()

