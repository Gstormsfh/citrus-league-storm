# Expected Goals (xG) Pipeline - Complete Guide

## 📖 Overview

This pipeline calculates **Expected Goals (xG)** for NHL players using machine learning. It processes play-by-play data from the NHL API, extracts features, applies an XGBoost model, and stores results in Supabase.

## 🎯 What is xG?

**Expected Goals (xG)** is a metric that estimates the probability that a shot will result in a goal, based on various factors like distance, angle, shot type, and game situation. It's a more advanced stat than simple shot counts because it accounts for shot quality.

**Example**: A shot from 10 feet directly in front of the net has much higher xG (~0.30) than a shot from 60 feet at a bad angle (~0.05).

## 🏗️ Pipeline Architecture

```
NHL API (Play-by-Play)
    ↓
Feature Extraction (6 features)
    ↓
XGBoost Model Prediction
    ↓
Calibration (brings to realistic ranges)
    ↓
Aggregation (sum per player per game)
    ↓
Supabase Database (raw_player_stats)
```

## 📁 Files Overview

### Core Pipeline Files

1. **`data_acquisition.py`** - Main pipeline script
   - Fetches finished games from NHL API
   - Extracts play-by-play data
   - Calculates 6 features for each shot
   - Applies ML model to predict xG
   - Calibrates values to realistic ranges
   - Aggregates per player per game
   - Uploads to Supabase

2. **`model_trainer.py`** - Trains the XGBoost model
   - Generates 5,000 synthetic training shots
   - Trains XGBoost classifier
   - Saves model and encoders to `.joblib` files

3. **`export_all_game_data.py`** - Exports raw game data
   - Fetches all play-by-play data
   - Exports to CSV for analysis
   - Useful for building custom models

### Validation & Debugging Files

4. **`validate_against_staging.py`** - Validates xG values
   - Compares our calculated xG against `staging_2025_skaters`
   - Shows ratios and identifies outliers
   - Helps verify calibration is working

5. **`check_xg_values.py`** - Debugs individual shot xG
   - Shows xG for each shot by a specific player
   - Useful for understanding why values are high/low

6. **`verify_rebound_detection.py`** - Tests rebound detection
   - Verifies rebound shots are being detected correctly

### Documentation Files

7. **`XG_MODEL_DOCUMENTATION.md`** - Complete model documentation
   - All 6 features explained in detail
   - Feature importance rankings
   - Example calculations
   - Calibration details

8. **`XG_CALIBRATION_SUMMARY.md`** - Calibration fixes summary
   - Issues that were fixed
   - Before/after comparisons
   - Validation results

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Activate virtual environment (if using one)
.\ml_env\Scripts\Activate.ps1

# Install required packages (if not already installed)
pip install pandas numpy scikit-learn xgboost joblib python-dotenv supabase requests
```

### 2. Train the Model (First Time Only)

```bash
python model_trainer.py
```

This creates:
- `xg_model.joblib` - The trained XGBoost model
- `model_features.joblib` - Feature list
- `shot_type_encoder.joblib` - Shot type encoder

### 3. Set Up Environment Variables

Create/update `.env` file with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run the Pipeline

```bash
python data_acquisition.py
```

This will:
1. Fetch finished games from yesterday (or specified date)
2. Process all shots from those games
3. Calculate xG for each shot
4. Aggregate per player per game
5. Upload to Supabase

## 📊 Understanding the Output

### Database Table: `raw_player_stats`

**Columns:**
- `playerId` - NHL player ID
- `game_id` - NHL game ID (format: YYYYMMDD##)
- `I_F_xGoals` - Individual For Expected Goals (sum of all shot xG values)
- `season` - Season year (currently NULL)
- Other columns: `OnIce_xGoalsPercentage`, `goals_saved_above_expected`, etc. (for future use)

### Example Query

```sql
-- Top 5 xG performances in a single game
SELECT 
    "playerId", 
    "game_id",
    "I_F_xGoals"
FROM raw_player_stats
ORDER BY "I_F_xGoals" DESC
LIMIT 5;
```

**Expected Results:**
- Top players typically have 0.5-0.8 xG per game
- Average players: 0.1-0.3 xG per game
- If you see values > 1.0, check calibration settings

## 🔧 Calibration Explained

### Why Calibration is Needed

The model was trained on **synthetic data**, so raw predictions are too high. Calibration brings them to realistic NHL ranges.

### How It Works

**Step 1: Power Function**
- Compresses high values: `xG = raw_xg^3.5`
- Example: 0.999 → 0.996, 0.5 → 0.088

**Step 2: Scale Factor**
- Scales to match real NHL averages: `xG = xG * 0.17`
- Brings average from ~1.165 down to ~0.180

**Step 3: Cap**
- Maximum single shot xG = 0.50 (50% chance)
- Even best shots rarely exceed this

### Adjusting Calibration

If values are still too high/low, adjust in `data_acquisition.py`:

```python
CALIBRATION_FACTOR = 3.5  # Increase to compress more, decrease to compress less
SCALE_FACTOR = 0.17       # Increase to scale up, decrease to scale down
```

**Validation**: Run `validate_against_staging.py` to check if calibration needs adjustment.

## 🐛 Troubleshooting

### Issue: "No shots found to process"
- **Cause**: No finished games on the date checked
- **Fix**: Change date in `data_acquisition.py` or check if games actually finished

### Issue: "xg_model.joblib not found"
- **Cause**: Model hasn't been trained yet
- **Fix**: Run `python model_trainer.py` first

### Issue: xG values seem too high (>1.0 per game)
- **Cause**: Calibration may need adjustment
- **Fix**: 
  1. Run `validate_against_staging.py` to check ratios
  2. Adjust `CALIBRATION_FACTOR` or `SCALE_FACTOR` in `data_acquisition.py`
  3. Re-run pipeline

### Issue: "duplicate key value violates unique constraint"
- **Cause**: Script was run multiple times for same games
- **Fix**: Already handled with `upsert()` - data will be updated, not duplicated

### Issue: Angles > 90°
- **Cause**: Old code (should be fixed now)
- **Fix**: Ensure you have latest version with angle clipping

## 📈 Validation

### Compare Against Staging Data

```bash
python validate_against_staging.py
```

This compares your calculated xG against `staging_2025_skaters` table:
- Shows average xG/game (should be ~0.18-0.20)
- Shows ratio (should be ~1.0-1.5x)
- Identifies outliers

### Expected Validation Results

- **Average xG/game**: ~0.18-0.20 (matches staging: ~0.20)
- **Average ratio**: ~1.0-1.5x (our/staging)
- **Median ratio**: ~0.9-1.1x (very close to 1.0)

If ratios are consistently >2x, adjust calibration factors.

## 📝 Data Coverage

**Current Status:**
- **Games**: 13 games from December 7, 2025
- **Player/Game Records**: 395 unique combinations
- **Date Range**: Single day (expandable)

**To Process More Games:**
1. Change date in `data_acquisition.py` line 131
2. Or set to process yesterday: `(datetime.date.today() - datetime.timedelta(days=1))`
3. Run script for multiple dates to build larger dataset

## 🔍 Feature Details

See `XG_MODEL_DOCUMENTATION.md` for complete details on all 6 features:
1. Distance (33.2% importance)
2. Angle (14.5% importance)
3. Is Rebound (17.4% importance) ✅ IMPLEMENTED
4. Shot Type (8.5% importance) ✅ IMPLEMENTED
5. Is Power Play (16.7% importance) ✅ IMPLEMENTED
6. Score Differential (9.7% importance) ✅ IMPLEMENTED

## 🎓 Learning Resources

- **xG Explained**: Expected Goals measures shot quality, not just quantity
- **Why It Matters**: Better predictor of future performance than goals (which are noisy)
- **Real NHL Average**: ~0.10-0.15 xG per shot, ~0.15-0.25 xG per game for top players
- **Our Model**: Produces ~0.18 xG/game average (validated against staging data)

## ✅ Checklist for Production Use

- [x] Model trained and saved
- [x] Environment variables configured
- [x] Angle calculation fixed (0-90° range)
- [x] Rebound detection implemented
- [x] Shot type encoding working
- [x] Calibration applied and validated
- [x] Database upload working (with upsert for duplicates)
- [x] Validation against staging data passing
- [ ] Process multiple days/games for better averages
- [ ] Fine-tune calibration based on more data
- [ ] Consider retraining on real NHL historical data

## 📞 Support

If you encounter issues:
1. Check `XG_MODEL_DOCUMENTATION.md` for feature details
2. Run `validate_against_staging.py` to check calibration
3. Check console output for error messages
4. Verify environment variables are set correctly

