# NHL Shift API Reference

Generated: 2025-12-14
Test Game ID: 2025020021

## Executive Summary

✅ **WORKING ENDPOINT FOUND**: Legacy NHL API provides official shift data
❌ **Modern API**: No shift endpoints found in `api-web.nhle.com`
❌ **Play-by-Play**: No embedded shift data

---

## Working Endpoint: Legacy API

### Endpoint Details

- **URL**: `https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId={game_id}`
- **Method**: GET
- **Status**: ✅ **WORKING**
- **Response Format**: JSON

### Request Example

```python
import requests

game_id = 2025020021
url = f"https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId={game_id}"
response = requests.get(url)
data = response.json()
```

### Response Structure

```json
{
  "data": [
    {
      "id": 15550102,
      "detailCode": 0,
      "duration": "00:45",
      "endTime": "02:21",
      "eventDescription": null,
      "eventDetails": null,
      "eventNumber": 74,
      "firstName": "Alex",
      "gameId": 2025020021,
      "hexValue": "#111111",
      "lastName": "Killorn",
      "period": 1,
      "playerId": 8473986,
      "shiftNumber": 1,
      "startTime": "01:36",
      "teamAbbrev": "ANA",
      "teamId": 24,
      "teamName": "Anaheim Ducks",
      "typeCode": 517
    }
  ],
  "total": 822
}
```

### Field Descriptions

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `id` | integer | Unique shift record ID | Internal NHL ID |
| `playerId` | integer | NHL player ID | ✅ **CRITICAL** - Use for matching |
| `gameId` | integer | NHL game ID | ✅ **CRITICAL** - Use for matching |
| `period` | integer | Period number (1, 2, 3, 4+) | ✅ **CRITICAL** - Use for time calculation |
| `startTime` | string | Shift start time | Format: `"MM:SS"` (e.g., `"01:36"`) |
| `endTime` | string | Shift end time | Format: `"MM:SS"` (e.g., `"02:21"`) |
| `duration` | string | Shift duration | Format: `"MM:SS"` (e.g., `"00:45"`) |
| `teamId` | integer | NHL team ID | ✅ **CRITICAL** - Use for team matching |
| `teamAbbrev` | string | Team abbreviation | e.g., `"ANA"` |
| `teamName` | string | Full team name | e.g., `"Anaheim Ducks"` |
| `shiftNumber` | integer | Shift number for this player in this game | Sequential per player |
| `typeCode` | integer | Event type code | `517` = Line change/substitution |
| `eventNumber` | integer | Event number in game | May be useful for ordering |
| `firstName` | string | Player first name | For reference |
| `lastName` | string | Player last name | For reference |
| `hexValue` | string | Color code | For visualization (not needed) |
| `detailCode` | integer | Additional detail code | Usually `0` |
| `eventDescription` | string/null | Event description | Usually `null` |
| `eventDetails` | string/null | Event details | Usually `null` |

### Data Quality Notes

✅ **Strengths**:
- Official NHL shift data (not inferred)
- Complete shift records (start, end, duration)
- All players included
- All periods included

⚠️ **Limitations**:
- **No situation data**: Does not include 5v5/PP/PK situation
  - **Solution**: Must join with play-by-play data to determine situation at shift time
- **Time format**: Times are in `MM:SS` string format, not seconds
  - **Solution**: Parse to seconds and convert to running game clock
- **No empty net indicator**: Does not explicitly mark empty net situations
  - **Solution**: Infer from PBP data (goalie pulled events)

---

## Failed Endpoints

### Modern API Endpoints (All Failed - 404)

1. `https://api-web.nhle.com/v1/gamecenter/{game_id}/shifts` ❌
2. `https://api-web.nhle.com/v1/gamecenter/{game_id}/shift-chart` ❌
3. `https://api-web.nhle.com/v1/gamecenter/{game_id}/shiftChart` ❌

**Conclusion**: Modern NHL API (`api-web.nhle.com`) does not provide shift data endpoints.

### Play-by-Play Embedded Data

- **Tested**: `https://api-web.nhle.com/v1/gamecenter/{game_id}/play-by-play`
- **Result**: ❌ No shift-related keys found in PBP response
- **Conclusion**: Shift data is not embedded in play-by-play data

---

## Implementation Requirements

### Phase 1B: Data Acquisition Integration

1. **Add shift data fetching function** to `data_acquisition.py`:
   ```python
   def fetch_official_shifts(game_id: int) -> List[Dict]:
       """Fetch official shift data from NHL Legacy API."""
       url = f"https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId={game_id}"
       response = requests.get(url, timeout=15)
       if response.status_code == 200:
           data = response.json()
           return data.get('data', [])
       return []
   ```

2. **Time Parsing Function**:
   ```python
   def parse_shift_time(time_str: str) -> float:
       """Parse MM:SS format to seconds."""
       parts = time_str.split(':')
       minutes = int(parts[0])
       seconds = int(parts[1])
       return minutes * 60 + seconds
   ```

3. **Running Game Clock Calculation**:
   ```python
   def calculate_running_game_clock(period: int, time_in_period_seconds: float) -> float:
       """Convert period + time to running game clock."""
       base_seconds = (period - 1) * 1200  # 20 minutes per period
       return base_seconds + time_in_period_seconds
   ```

### Phase 1D: Situation Splitting

**Critical**: The shift data does NOT include situation (5v5/PP/PK). We must:

1. **Load play-by-play data** to identify situation changes
2. **Match shifts to situations** by:
   - Finding situation at shift start time
   - Detecting situation changes during shift
   - Splitting shifts at situation boundaries

**Example Logic**:
```python
# For each shift:
shift_start_clock = calculate_running_game_clock(shift['period'], parse_shift_time(shift['startTime']))
shift_end_clock = calculate_running_game_clock(shift['period'], parse_shift_time(shift['endTime']))

# Find situation changes within this shift
situation_changes = get_situation_changes_in_range(shift_start_clock, shift_end_clock)

# Split shift at each situation change
split_shifts = split_shift_by_situation(shift, situation_changes)
```

---

## Sample Data Statistics

- **Total Shifts**: 822 shifts for test game
- **Average Shifts per Player**: ~34 shifts (assuming ~24 players per game)
- **Data Completeness**: ✅ All shifts have required fields (startTime, endTime, duration, period)

---

## Next Steps

1. ✅ **Phase 1A Complete**: API endpoint confirmed and documented
2. **Phase 1B**: Integrate shift data fetching into `data_acquisition.py`
3. **Phase 1C**: Implement running game clock calculation
4. **Phase 1D**: Implement situation splitting using PBP data
5. **Phase 1F**: Add validation for shift data quality
6. **Phase 1G**: Match shots to shifts for on-ice xGF/xGA calculation

---

## Files Generated

- `shift_api_sample_legacy_api____shiftcharts.json` - Sample response from legacy API
- `NHL_SHIFT_API_REFERENCE.md` - This document
