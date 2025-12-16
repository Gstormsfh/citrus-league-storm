# Phase 5, Step 1: Historical Data Integration - Progress

## Completed

1. ✅ **Database Migration Created**: `20250126000000_add_season_tracking.sql`
   - Adds `season` column to `raw_shots`, `goalie_gsax`, `player_toi_by_situation`, `player_shifts`
   - Creates helper functions: `derive_season_from_game_id()` and `derive_season_from_date()`
   - Updates primary key for `goalie_gsax` to composite (goalie_id, season)

2. ✅ **Season Utility Module Created**: `season_utils.py`
   - `derive_season_from_game_id()`: Derives season from NHL game_id format
   - `derive_season_from_date()`: Derives season from date objects
   - `get_season_date_range()`: Gets start/end dates for a season
   - `get_season_label()`: Human-readable season labels (e.g., "2024-25")
   - `is_covid_season()`: Flags 2020-21 COVID-affected season

3. ✅ **Data Acquisition Updated**: `data_acquisition.py`
   - Added season derivation when creating shot records
   - Season is automatically calculated from game_id

## In Progress

4. 🔄 **GSAx Calculation**: Need to update `calculate_goalie_gsax.py`
   - Group by season when aggregating
   - Store season in database upsert

5. 🔄 **GAR Calculation**: Need to update `calculate_gar_regression.py`
   - Already has season column in schema
   - Need to ensure season is passed through pipeline

6. ⏳ **Historical Season Processing Script**: `process_historical_seasons.py`
   - Script to batch process multiple seasons
   - Run full pipeline for each season

## Next Steps

1. Update `calculate_goalie_gsax.py` to handle seasons
2. Update `calculate_gar_regression.py` to ensure season tracking
3. Create `process_historical_seasons.py` for batch processing
4. Test with current season data first
5. Then process historical seasons

