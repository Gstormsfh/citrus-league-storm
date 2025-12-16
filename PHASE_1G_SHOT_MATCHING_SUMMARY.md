# Phase 1G: Shot Matching for On-Ice xGF/xGA - Implementation Complete

## Overview

Phase 1G implements the core join logic to match shots to shifts using running game clock, enabling accurate on-ice xGF/xGA attribution for all players.

## Implementation

### Core Functions

1. **`load_shifts_with_game_clock()`**
   - Loads shift segments from `player_shifts` table
   - Calculates running game clock if not stored in database
   - Returns DataFrame with `shift_start_game_clock` and `shift_end_game_clock`

2. **`load_shots_with_game_clock()`**
   - Loads shots from `raw_shots` table
   - Converts `time_remaining_seconds` to `time_elapsed_seconds`
   - Calculates `shot_game_clock` using `calculate_running_game_clock()`

3. **`match_shots_to_shifts()`**
   - Matches shots to shifts using: `shift_start_game_clock <= shot_time < shift_end_game_clock`
   - Attributes xGF to shooting team players, xGA to defending team players
   - Returns DataFrame with player-shot records

4. **`aggregate_on_ice_xgf_xga()`**
   - Aggregates on-ice xGF/xGA by player and situation
   - Returns DataFrame ready for GAR component calculation

### Key Features

- **Running Game Clock Matching**: Uses game clock for accurate time-based joins
- **Team-Based Attribution**: Correctly attributes xGF to shooting team, xGA to defending team
- **Situation-Aware**: Maintains situation (5v5, PP, PK) for each match
- **Efficient Processing**: Groups by game for faster lookups

### Data Flow

```
raw_shots (time_remaining_seconds)
    ↓ [Convert to game clock]
Shots with shot_game_clock
    ↓ [Match using game clock]
player_shifts (shift_start_game_clock, shift_end_game_clock)
    ↓ [Join]
Matched player-shot records
    ↓ [Aggregate by player/situation]
On-ice xGF/xGA by player and situation
```

## Next Steps

1. **Test the Implementation**: Run `test_shot_matching.py` to verify matching works
2. **Update `calculate_gar_components.py`**: Use on-ice xGF/xGA instead of shooter proxy
3. **Recalculate EVD and PPD**: Use accurate on-ice xGA for defensive components

## Files Modified

- `fix_gar_on_ice_tracking.py` - Complete rewrite with running game clock matching
- `test_shot_matching.py` - Test script for validation

## Validation Checklist

- [ ] Shots correctly matched to shifts using game clock
- [ ] xGF attributed to shooting team players
- [ ] xGA attributed to defending team players
- [ ] Situation maintained for each match
- [ ] Aggregation produces correct totals

