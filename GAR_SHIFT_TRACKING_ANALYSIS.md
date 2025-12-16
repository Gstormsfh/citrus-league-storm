# GAR Shift Tracking - Current State Analysis

## Question 1: Are there issues in our shift tracking?

### ✅ **YES - Several Critical Issues Identified**

#### Issue 1: **Unreliable Shift Detection Method**
**Current Approach**: Uses 60-second gap heuristic
- **Location**: `calculate_player_toi.py` lines 470-477
- **Problem**: If a player doesn't appear in events for >60 seconds, we assume shift ended
- **Reality**: Players can be on ice for 90+ seconds without appearing in events (defensive zone play, neutral zone)
- **Impact**: **Under-counts TOI** - shifts end prematurely, missing actual ice time

#### Issue 2: **No Official Line Change Event Handling**
**Current Approach**: Infers shifts from player participation in events
- **Problem**: NHL API may provide official line change events (typeCode), but we're not checking for them
- **Impact**: Missing the most accurate source of shift data

#### Issue 3: **Time Tracking is Per-Period, Not Running Game Clock**
**Current Approach**: Tracks time as `time_seconds` within each period
- **Location**: `calculate_player_toi.py` line 436
- **Problem**: For joining with shots, we need running game clock (total seconds since game start)
- **Impact**: Makes it harder to accurately match shifts with shots that occur at specific game times

#### Issue 4: **Incomplete Shift-End Event Handling**
**Current Approach**: Only explicitly handles goals (typeCode 505)
- **Missing**: 
  - Penalties ending shifts (players go to box)
  - Period ends (all shifts should end)
  - Official line changes (if available in API)
- **Impact**: Shifts may continue incorrectly after penalties or period ends

#### Issue 5: **Situation Changes Not Properly Tracked**
**Current Approach**: Updates situation when detected, but doesn't split shifts
- **Problem**: If situation changes from 5v5 → PP mid-shift, the shift should be split
- **Impact**: TOI attribution to wrong situations (e.g., crediting PP TOI as 5v5)

---

## Question 2: Do we have access to line change/substitution information in the API?

### ⚠️ **UNCLEAR - Need to Verify**

#### What We Know:
1. **NHL API Provides Shift Data**: Web search confirms NHL API has shift data endpoints
2. **Play-by-Play Endpoint**: We're using `https://api-web.nhle.com/v1/gamecenter/{game_id}/play-by-play`
3. **Current typeCode Values We Handle**:
   - `505` = Goal
   - `506` = Shot on goal
   - `507` = Missed shot
   - `502` = Faceoff
   - `503` = Hit
   - (Others not explicitly checked)

#### What We Need to Check:
1. **Line Change typeCode**: Is there a typeCode for official line changes/substitutions?
2. **Separate Shift Endpoint**: Does NHL API have a dedicated `/shifts` endpoint?
3. **Shift Data in PBP**: Are shifts embedded in the play-by-play response?

#### Recommendation:
**Test the API** to see what's available:
- Check if there's a `typeCode` for line changes (likely in 500-520 range)
- Check if play-by-play response includes shift data
- Check if there's a separate shifts endpoint: `https://api-web.nhle.com/v1/gamecenter/{game_id}/shifts`

---

## Current Implementation Summary

### What Works:
✅ Tracks player participation in events
✅ Handles period starts/ends
✅ Handles goals (resets shifts)
✅ Identifies situations (5v5, PP, PK)
✅ Stores shifts and aggregates TOI

### What Needs Improvement:
❌ More accurate shift detection (use official events if available)
❌ Running game clock (not just per-period time)
❌ Better handling of situation changes mid-shift
❌ Explicit penalty handling (players going to box)
❌ Validation of shift durations (flag unrealistic shifts)

---

## Next Steps

1. **Test NHL API** for line change events
2. **Enhance shift tracking** with official events if available
3. **Add running game clock** calculation
4. **Improve situation change handling**
5. **Add validation** for shift accuracy

