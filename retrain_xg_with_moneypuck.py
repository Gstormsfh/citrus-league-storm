#!/usr/bin/env python3
"""
retrain_xg_with_moneypuck.py
Retrain xG model using MoneyPuck xG values as the target.
This creates a model that learns to predict MoneyPuck's xG given our extracted features.
"""

import pandas as pd
import numpy as np
from xgboost import XGBRegressor  # Regression model (predicts continuous xG values)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

def load_and_prepare_training_data(matched_file='data/matched_shots_2025.csv'):
    """
    Load matched data and prepare features (X) and target (y = MoneyPuck xG).
    
    Args:
        matched_file: Path to matched shots CSV file
    
    Returns:
        X (features), y (target), feature_names
    """
    print("=" * 80)
    print("LOADING TRAINING DATA")
    print("=" * 80)
    
    # Check if matched file exists, if not, try to create it
    if not os.path.exists(matched_file):
        print(f"⚠️  Matched file not found: {matched_file}")
        print("   Running match_moneypuck_data.py to create it...")
        try:
            import subprocess
            subprocess.run(['python', 'match_moneypuck_data.py'], check=True)
        except Exception as e:
            print(f"❌ Error creating matched file: {e}")
            print("   Please run: python match_moneypuck_data.py")
            return None, None, None, None
    
    # Load matched data
    print(f"Loading matched data from {matched_file}...")
    df = pd.read_csv(matched_file)
    print(f"Loaded {len(df):,} matched shots")
    
    # Filter out any rows with missing MoneyPuck xG (our target)
    initial_count = len(df)
    df = df[df['mp_xGoal'].notna() & (df['mp_xGoal'] >= 0)]
    print(f"Filtered to {len(df):,} shots with valid MoneyPuck xG values")
    
    if len(df) == 0:
        print("❌ No valid training data found!")
        return None, None, None
    
    # Extract our features (what we calculate from raw NHL data)
    # These are the features we extract in data_acquisition.py
    feature_columns = [
        'our_distance',
        'our_angle', 
        'our_is_rebound',
        'our_is_slot_shot',
        'our_has_pass',
        # Note: We'll need to add encoded features if they exist in matched data
        # For now, we'll use the raw features we have
    ]
    
    # Check which features exist in the matched data
    available_features = [f for f in feature_columns if f in df.columns]
    missing_features = [f for f in feature_columns if f not in df.columns]
    
    if missing_features:
        print(f"⚠️  Missing features in matched data: {missing_features}")
        print("   These will need to be added to match_moneypuck_data.py")
    
    # For now, use what we have
    # We need to load our_shots_2025.csv to get all features
    print("\nLoading our full shot data to get all features...")
    try:
        our_shots = pd.read_csv('data/our_shots_2025.csv')
        print(f"Loaded {len(our_shots):,} shots from our data")
        
        # Merge with matched data to get MoneyPuck xG
        # Match by game_id, player_id, and coordinates (with tolerance for floating point)
        print("Matching shots by coordinates...")
        
        # Round coordinates to 1 decimal for matching (handles floating point precision)
        our_shots['shot_x_round'] = our_shots['shot_x'].round(1)
        our_shots['shot_y_round'] = our_shots['shot_y'].round(1)
        df['our_shot_x_round'] = df['our_shot_x'].round(1)
        df['our_shot_y_round'] = df['our_shot_y'].round(1)
        
        merged = pd.merge(
            our_shots,
            df[['our_game_id', 'our_player_id', 'our_shot_x_round', 'our_shot_y_round', 'mp_xGoal']],
            left_on=['game_id', 'player_id', 'shot_x_round', 'shot_y_round'],
            right_on=['our_game_id', 'our_player_id', 'our_shot_x_round', 'our_shot_y_round'],
            how='inner'
        )
        
        print(f"Merged dataset: {len(merged):,} shots with both features and MoneyPuck xG")
        
        if len(merged) == 0:
            print("⚠️  No exact coordinate matches found. Trying game_id + player_id match...")
            # Try simpler merge by game and player
            merged = pd.merge(
                our_shots,
                df[['our_game_id', 'our_player_id', 'mp_xGoal']].drop_duplicates(),
                left_on=['game_id', 'player_id'],
                right_on=['our_game_id', 'our_player_id'],
                how='inner'
            )
            print(f"Alternative merge (by game+player): {len(merged):,} shots")
            
            if len(merged) > 0:
                print("   Note: Using first MoneyPuck xG per player per game (may have duplicates)")
        
        if len(merged) == 0:
            return None, None, None, None
        
        # Define features (same as MODEL_FEATURES in data_acquisition.py)
        # Includes all MoneyPuck-aligned features
        MODEL_FEATURES = [
            # Core shot features (MoneyPuck's top features)
            'distance',  # shotDistance (41.0% importance)
            'angle', 
            'shot_angle_adjusted',  # shotAngleAdjusted (8.9% importance) - NEW
            'is_rebound',  # shotRebound
            'is_slot_shot',
            'shot_type_encoded', 
            # Situation features
            'is_power_play',
            'score_differential',
            'home_skaters_on_ice',  # homeSkatersOnIce (3.1% importance)
            'away_skaters_on_ice',  # awaySkatersOnIce
            'is_empty_net',  # shotOnEmptyNet (22.9% importance)
            'home_empty_net',  # homeEmptyNet - NEW
            'away_empty_net',  # awayEmptyNet - NEW
            # Pass features
            'has_pass_before_shot', 
            'pass_lateral_distance', 
            'pass_to_net_distance',
            'pass_zone_encoded', 
            'pass_immediacy_score', 
            'goalie_movement_score', 
            'pass_quality_score',
            # Last event features (MoneyPuck uses these)
            'time_since_last_event',  # timeSinceLastEvent (9.3% importance)
            'distance_from_last_event',  # distanceFromLastEvent
            'speed_from_last_event',  # speedFromLastEvent (2.9% importance)
            'last_event_category',  # lastEventCategory
            'last_event_shot_angle',  # lastEventShotAngle (1.7% importance)
            'last_event_shot_distance',  # lastEventShotDistance (1.6% importance)
        ]
        
        # Check which features we have
        available_model_features = [f for f in MODEL_FEATURES if f in merged.columns]
        missing_model_features = [f for f in MODEL_FEATURES if f not in merged.columns]
        
        if missing_model_features:
            print(f"⚠️  Missing model features: {missing_model_features}")
            print("   Will use available features only")
        
        # Handle categorical/string features - encode them
        categorical_features = []
        encoders = {}
        
        for feature in available_model_features:
            if feature == 'last_event_category':
                # Encode last_event_category (string -> numeric)
                if merged[feature].dtype == 'object' or pd.api.types.is_string_dtype(merged[feature]):
                    le = LabelEncoder()
                    # Fill NaN with 'unknown' before encoding
                    merged[feature + '_encoded'] = le.fit_transform(merged[feature].fillna('unknown').astype(str))
                    encoders[feature] = le
                    categorical_features.append(feature)
                    # Replace original with encoded version
                    available_model_features = [f if f != feature else feature + '_encoded' for f in available_model_features]
        
        # Fill missing values for features that might be None
        for feature in available_model_features:
            if feature not in merged.columns:
                continue
            if merged[feature].isna().any():
                if feature in ['pass_lateral_distance', 'pass_to_net_distance', 'pass_immediacy_score', 
                              'goalie_movement_score', 'pass_quality_score', 'pass_zone_encoded',
                              'has_pass_before_shot', 'is_rebound', 'is_slot_shot', 'is_power_play',
                              'is_empty_net', 'home_empty_net', 'away_empty_net']:
                    # Binary/categorical features: fill with 0 if missing
                    merged[feature] = merged[feature].fillna(0)
                elif feature in ['time_since_last_event', 'distance_from_last_event', 'speed_from_last_event',
                                'last_event_shot_angle', 'last_event_shot_distance']:
                    # Last event features: fill with 0 if no last event
                    merged[feature] = merged[feature].fillna(0)
                elif feature == 'shot_angle_adjusted':
                    # Calculate from angle if missing
                    if 'angle' in merged.columns:
                        merged[feature] = merged[feature].fillna(merged['angle'].abs())
                    else:
                        merged[feature] = merged[feature].fillna(0)
                elif feature.endswith('_encoded'):
                    # Encoded categorical features: fill with 0 (unknown category)
                    merged[feature] = merged[feature].fillna(0)
                else:
                    # Other features: fill with median
                    merged[feature] = merged[feature].fillna(merged[feature].median())
        
        # Filter to only numeric features (XGBoost requirement)
        numeric_features = []
        for feature in available_model_features:
            if feature in merged.columns:
                if pd.api.types.is_numeric_dtype(merged[feature]):
                    numeric_features.append(feature)
                else:
                    print(f"⚠️  Skipping non-numeric feature: {feature} (dtype: {merged[feature].dtype})")
        
        # Extract features (X) and target (y = MoneyPuck xG)
        X = merged[numeric_features].copy()
        y = merged['mp_xGoal'].copy()
        
        print(f"\n✅ Prepared training data:")
        print(f"   Features: {len(numeric_features)} (numeric only)")
        print(f"   Samples: {len(X):,}")
        print(f"   Target range: {y.min():.4f} to {y.max():.4f}")
        print(f"   Target mean: {y.mean():.4f}")
        
        if categorical_features:
            print(f"   Encoded categorical features: {categorical_features}")
        
        # Return encoder if we created one
        encoder_to_return = encoders.get('last_event_category', None) if categorical_features else None
        
        return X, y, numeric_features, encoder_to_return
        
    except FileNotFoundError:
        print("❌ Error: data/our_shots_2025.csv not found")
        print("   Run pull_season_data.py first to generate our shot data")
        return None, None, None

def train_moneypuck_xg_model(X, y, feature_names):
    """
    Train XGBoost regression model to predict MoneyPuck xG.
    
    Args:
        X: Feature matrix
        y: Target values (MoneyPuck xG)
        feature_names: List of feature names
    
    Returns:
        Trained model, encoders (if needed)
    """
    print("\n" + "=" * 80)
    print("TRAINING MODEL")
    print("=" * 80)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"Training set: {len(X_train):,} samples")
    print(f"Test set: {len(X_test):,} samples")
    
    # Train XGBoost Regressor (for continuous xG values)
    print("\nTraining XGBoost Regressor...")
    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        random_state=42,
        objective='reg:squarederror',
        eval_metric='rmse'
    )
    
    # Train model (without early stopping to avoid version compatibility issues)
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )
    
    # Evaluate
    print("\n" + "=" * 80)
    print("MODEL EVALUATION")
    print("=" * 80)
    
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    
    # Training metrics
    train_mae = mean_absolute_error(y_train, y_train_pred)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
    train_r2 = r2_score(y_train, y_train_pred)
    
    # Test metrics
    test_mae = mean_absolute_error(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    test_r2 = r2_score(y_test, y_test_pred)
    
    print(f"\nTraining Set:")
    print(f"  MAE:  {train_mae:.4f} (mean absolute error)")
    print(f"  RMSE: {train_rmse:.4f} (root mean squared error)")
    print(f"  R²:   {train_r2:.4f} (coefficient of determination)")
    
    print(f"\nTest Set:")
    print(f"  MAE:  {test_mae:.4f}")
    print(f"  RMSE: {test_rmse:.4f}")
    print(f"  R²:   {test_r2:.4f}")
    
    # Feature importance
    print("\n" + "=" * 80)
    print("FEATURE IMPORTANCE")
    print("=" * 80)
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(feature_importance.to_string(index=False))
    
    return model

def save_model(model, feature_names, model_filename='xg_model_moneypuck.joblib', encoder=None):
    """
    Save the trained model, feature list, and any encoders.
    """
    print("\n" + "=" * 80)
    print("SAVING MODEL")
    print("=" * 80)
    
    # Save model
    joblib.dump(model, model_filename)
    print(f"✅ Model saved: {model_filename}")
    
    # Save feature list
    features_filename = 'model_features_moneypuck.joblib'
    joblib.dump(feature_names, features_filename)
    print(f"✅ Features saved: {features_filename}")
    
    # Save encoder if provided
    if encoder is not None:
        encoder_filename = 'last_event_category_encoder.joblib'
        joblib.dump(encoder, encoder_filename)
        print(f"✅ Encoder saved: {encoder_filename}")
    
    print("\n💡 To use this model:")
    print(f"   1. Update data_acquisition.py to load '{model_filename}'")
    print(f"   2. Update MODEL_FEATURES to match saved feature list")
    print(f"   3. Remove calibration factors (model already outputs MoneyPuck-scale xG)")

if __name__ == "__main__":
    print("=" * 80)
    print("RETRAINING xG MODEL WITH MONEYPUCK DATA")
    print("=" * 80)
    print("\nThis script will:")
    print("  1. Load matched shots (our features + MoneyPuck xG)")
    print("  2. Train XGBoost regression model to predict MoneyPuck xG")
    print("  3. Save the new model for use in data_acquisition.py")
    print()
    
    # Load and prepare data
    result = load_and_prepare_training_data()
    
    if result is None or len(result) < 3:
        print("\n❌ Failed to prepare training data. Exiting.")
        exit(1)
    
    X, y, feature_names = result[0], result[1], result[2]
    encoder = result[3] if len(result) > 3 else None
    
    # Train model
    model = train_moneypuck_xg_model(X, y, feature_names)
    
    # Save model and encoder
    save_model(model, feature_names, encoder=encoder)
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE!")
    print("=" * 80)
    print("\nNext steps:")
    print("  1. Review model performance metrics above")
    print("  2. Update data_acquisition.py to use the new model")
    print("  3. Test the new model on a sample date")
    print("  4. Compare results to MoneyPuck to verify alignment")

