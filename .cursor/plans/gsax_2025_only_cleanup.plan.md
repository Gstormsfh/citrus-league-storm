# GSAx 2025-Only Data Cleanup and Fix

## Problem
The GSAx calculation is loading ALL shots from all seasons (2023, 2024, 2025) and aggregating them, then labeling everything as season=2025. This creates contaminated data with unrealistic values (e.g., raw GSAx of 220 from multi-season aggregation).

## Solution
1. **Filter to 2025-only data** in the load function
2. **Clean contaminated GSAx table** - delete all existing records
3. **Recalculate with proper filtering** - only use 2025 season shots
4. **Add validation** - ensure we're only processing 2025 data

## Implementation Steps

### Step 1: Update `load_historical_shots_data()` to Filter by Season
**File**: `calculate_goalie_gsax.py`

**Change**: Add `.eq('season', 2025)` filter to the Supabase query

**Before** (line 58-61):
```python
response = supabase.table('raw_shots').select(
    'goalie_id, goalie_name, is_goal, shooting_talent_adjusted_xg, flurry_adjusted_xg, xg_value, is_empty_net, '
    'game_id, period, distance, angle, is_power_play, shot_type'
).range(offset, offset + batch_size - 1).execute()
```

**After**:
```python
response = supabase.table('raw_shots').select(
    'goalie_id, goalie_name, is_goal, shooting_talent_adjusted_xg, flurry_adjusted_xg, xg_value, is_empty_net, '
    'game_id, period, distance, angle, is_power_play, shot_type, season'
).eq('season', 2025).range(offset, offset + batch_size - 1).execute()
```

**Also add**: Print statement showing how many 2025 shots were loaded

### Step 2: Remove Season Derivation Logic (No Longer Needed)
**File**: `calculate_goalie_gsax.py`

**Change**: Remove the season derivation logic in `calculate_raw_gsax()` since we're now filtering at load time

**Remove** (lines 235-243):
```python
# Check if season column exists, if not derive it
if 'season' not in df_filtered.columns and 'game_id' in df_filtered.columns:
    from season_utils import derive_season_from_game_id
    df_filtered['season'] = df_filtered['game_id'].apply(derive_season_from_game_id)
    # Fill missing seasons with most common season or current year
    if df_filtered['season'].isna().any():
        most_common_season = df_filtered['season'].mode()[0] if len(df_filtered['season'].mode()) > 0 else 2025
        df_filtered['season'] = df_filtered['season'].fillna(most_common_season)
        print(f"   Derived season for {df_filtered['season'].notna().sum():,} shots")
```

**Replace with**: Simple validation that all shots are season=2025
```python
# Validate all shots are from 2025 season
if 'season' in df_filtered.columns:
    non_2025 = df_filtered[df_filtered['season'] != 2025]
    if len(non_2025) > 0:
        print(f"⚠️  WARNING: {len(non_2025):,} shots are not from 2025 season. Filtering them out.")
        df_filtered = df_filtered[df_filtered['season'] == 2025].copy()
    print(f"   Processing {len(df_filtered):,} shots from 2025 season")
else:
    print("⚠️  WARNING: No season column found. Cannot validate season filter.")
```

### Step 3: Create Cleanup Script
**File**: `cleanup_gsax_data.py` (new file)

**Purpose**: Delete all contaminated GSAx data from the database

**Implementation**:
```python
#!/usr/bin/env python3
"""
Clean up contaminated GSAx data from goalie_gsax table.
This script deletes all existing GSAx records so we can recalculate with 2025-only data.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

def cleanup_gsax_data():
    """Delete all GSAx records from the database."""
    print("=" * 80)
    print("CLEANING UP GSAX DATA")
    print("=" * 80)
    
    # Count existing records
    count_response = supabase.table('goalie_gsax').select('goalie_id', count='exact').execute()
    existing_count = count_response.count if hasattr(count_response, 'count') else 0
    
    print(f"Found {existing_count} existing GSAx records")
    
    if existing_count == 0:
        print("✅ No records to delete. Database is already clean.")
        return
    
    # Delete all records
    # Note: We need to delete in batches due to Supabase limits
    deleted_count = 0
    batch_size = 1000
    
    while True:
        # Get a batch of goalie_ids to delete
        response = supabase.table('goalie_gsax').select('goalie_id, season').limit(batch_size).execute()
        
        if not response.data or len(response.data) == 0:
            break
        
        # Delete by goalie_id and season
        for record in response.data:
            try:
                supabase.table('goalie_gsax').delete().eq('goalie_id', record['goalie_id']).eq('season', record.get('season', 2025)).execute()
                deleted_count += 1
            except Exception as e:
                print(f"⚠️  Error deleting goalie_id {record['goalie_id']}: {e}")
        
        print(f"  Deleted {deleted_count}/{existing_count} records...")
    
    print(f"\n✅ Successfully deleted {deleted_count} GSAx records")
    print("   Database is now clean and ready for 2025-only recalculation")

if __name__ == "__main__":
    confirm = input("⚠️  This will delete ALL GSAx data. Type 'DELETE' to confirm: ")
    if confirm == "DELETE":
        cleanup_gsax_data()
    else:
        print("❌ Cleanup cancelled")
```

### Step 4: Update Main Function to Accept Season Parameter
**File**: `calculate_goalie_gsax.py`

**Change**: Update `main()` function to accept `season` parameter and pass it to load function

**Before** (line 360):
```python
def main():
```

**After**:
```python
def main(season: int = 2025):
    """Main execution function."""
    print(f"\n{'=' * 80}")
    print(f"GOALIE GSAX CALCULATION - SEASON {season}")
    print("=" * 80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load data for specified season
    df_shots = load_historical_shots_data(season=season)
```

**Also update**: `load_historical_shots_data()` function signature:
```python
def load_historical_shots_data(season: int = 2025):
```

### Step 5: Add Validation Output
**File**: `calculate_goalie_gsax.py`

**Add to `calculate_raw_gsax()`**: Print season distribution to confirm we're only processing 2025
```python
# Validate season distribution
if 'season' in df_filtered.columns:
    season_counts = df_filtered['season'].value_counts()
    print(f"\n   Season distribution:")
    for season_val, count in season_counts.items():
        print(f"      Season {season_val}: {count:,} shots")
    if len(season_counts) > 1 or (len(season_counts) == 1 and season_counts.index[0] != 2025):
        print(f"⚠️  WARNING: Processing shots from multiple seasons or non-2025 season!")
```

## Execution Order

1. **Run cleanup script** to delete contaminated data:
   ```bash
   python cleanup_gsax_data.py
   ```

2. **Update calculate_goalie_gsax.py** with the changes above

3. **Run GSAx calculation** with 2025-only data:
   ```bash
   python calculate_goalie_gsax.py
   ```

4. **Verify results** - check that:
   - Raw GSAx values are reasonable (typically -30 to +50 for a full season)
   - Shots faced per goalie are reasonable (200-3000 for regular goalies)
   - No goalies with unrealistic values

## Expected Results

After cleanup and recalculation:
- **Raw GSAx range**: Should be approximately -30 to +50 (not 220+)
- **Shots faced**: Should be 200-3000 per goalie (not 5000+)
- **Total shots**: Should match 2025 season shot count only
- **Season column**: All records should have season=2025

## Files to Modify

1. `calculate_goalie_gsax.py` - Add season filtering and validation
2. `cleanup_gsax_data.py` - New file for database cleanup

## Benefits

1. **Data Integrity**: Only 2025 season data used for calculations
2. **Realistic Values**: GSAx values will be per-season, not cumulative
3. **Clean Database**: Removes contaminated multi-season aggregations
4. **Future-Proof**: Easy to add other seasons later if needed

