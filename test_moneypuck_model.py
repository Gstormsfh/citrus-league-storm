#!/usr/bin/env python3
"""
test_moneypuck_model.py
Test the MoneyPuck-aligned xG model and calculate performance metrics.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from scipy.stats import pearsonr
import os

def load_model_and_data():
    """Load the trained model, features, encoder, and matched data."""
    print("=" * 80)
    print("LOADING MODEL AND DATA")
    print("=" * 80)
    
    # Load model
    try:
        model = joblib.load('xg_model_moneypuck.joblib')
        print("✅ Model loaded: xg_model_moneypuck.joblib")
    except FileNotFoundError:
        print("❌ Error: xg_model_moneypuck.joblib not found")
        print("   Run retrain_xg_with_moneypuck.py first")
        return None, None, None, None
    
    # Load feature list
    try:
        feature_names = joblib.load('model_features_moneypuck.joblib')
        print(f"✅ Features loaded: {len(feature_names)} features")
    except FileNotFoundError:
        print("❌ Error: model_features_moneypuck.joblib not found")
        return None, None, None, None
    
    # Load encoder (optional)
    encoder = None
    try:
        encoder = joblib.load('last_event_category_encoder.joblib')
        print("✅ Encoder loaded: last_event_category_encoder.joblib")
    except FileNotFoundError:
        print("⚠️  Encoder not found (will encode on-the-fly if needed)")
    
    # Load matched data
    try:
        df = pd.read_csv('data/matched_shots_2025.csv')
        print(f"✅ Matched data loaded: {len(df):,} shots")
    except FileNotFoundError:
        print("❌ Error: data/matched_shots_2025.csv not found")
        print("   Run match_moneypuck_data.py first")
        return None, None, None, None
    
    return model, feature_names, encoder, df

def prepare_features(df, feature_names, encoder):
    """Prepare features for prediction, matching training data preparation."""
    print("\n" + "=" * 80)
    print("PREPARING FEATURES")
    print("=" * 80)
    
    # Load our full shot data to get all features
    try:
        our_shots = pd.read_csv('data/our_shots_2025.csv')
        print(f"✅ Loaded our shot data: {len(our_shots):,} shots")
    except FileNotFoundError:
        print("❌ Error: data/our_shots_2025.csv not found")
        return None, None
    
    # Merge with matched data to get MoneyPuck xG
    print("Matching shots by coordinates...")
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
    
    if len(merged) == 0:
        print("⚠️  No coordinate matches. Trying game_id + player_id match...")
        merged = pd.merge(
            our_shots,
            df[['our_game_id', 'our_player_id', 'mp_xGoal']].drop_duplicates(),
            left_on=['game_id', 'player_id'],
            right_on=['our_game_id', 'our_player_id'],
            how='inner'
        )
    
    print(f"✅ Merged dataset: {len(merged):,} shots with features and MoneyPuck xG")
    
    if len(merged) == 0:
        return None, None
    
    # Handle last_event_category encoding
    if 'last_event_category_encoded' in feature_names and 'last_event_category' in merged.columns:
        if 'last_event_category_encoded' not in merged.columns:
            if encoder is not None:
                merged['last_event_category_encoded'] = encoder.transform(
                    merged['last_event_category'].fillna('unknown').astype(str)
                )
            else:
                from sklearn.preprocessing import LabelEncoder
                le = LabelEncoder()
                merged['last_event_category_encoded'] = le.fit_transform(
                    merged['last_event_category'].fillna('unknown').astype(str)
                )
    
    # Prepare feature matrix
    X = merged[feature_names].copy()
    y = merged['mp_xGoal'].copy()
    
    # Fill missing values (same logic as training)
    for feature in feature_names:
        if feature not in X.columns:
            print(f"⚠️  Warning: Missing feature '{feature}' - filling with 0")
            X[feature] = 0
        elif X[feature].isna().any():
            if feature in ['pass_lateral_distance', 'pass_to_net_distance', 'pass_immediacy_score', 
                          'goalie_movement_score', 'pass_quality_score', 'pass_zone_encoded',
                          'has_pass_before_shot', 'is_rebound', 'is_slot_shot', 'is_power_play',
                          'is_empty_net', 'home_empty_net', 'away_empty_net']:
                X[feature] = X[feature].fillna(0)
            elif feature in ['time_since_last_event', 'distance_from_last_event', 'speed_from_last_event',
                            'last_event_shot_angle', 'last_event_shot_distance', 'last_event_category_encoded']:
                X[feature] = X[feature].fillna(0)
            elif feature == 'shot_angle_adjusted':
                if 'angle' in merged.columns:
                    X[feature] = X[feature].fillna(merged['angle'].abs())
                else:
                    X[feature] = X[feature].fillna(0)
            else:
                X[feature] = X[feature].fillna(X[feature].median())
    
    print(f"✅ Prepared {len(X):,} samples with {len(feature_names)} features")
    
    return X, y

def calculate_metrics(y_true, y_pred):
    """Calculate all performance metrics."""
    metrics = {}
    
    # Primary metrics
    metrics['r2'] = r2_score(y_true, y_pred)
    metrics['mae'] = mean_absolute_error(y_true, y_pred)
    metrics['rmse'] = np.sqrt(mean_squared_error(y_true, y_pred))
    
    # Correlation
    corr, p_value = pearsonr(y_true, y_pred)
    metrics['correlation'] = corr
    metrics['p_value'] = p_value
    
    # Distribution metrics
    metrics['mean_true'] = np.mean(y_true)
    metrics['mean_pred'] = np.mean(y_pred)
    metrics['median_true'] = np.median(y_true)
    metrics['median_pred'] = np.median(y_pred)
    metrics['std_true'] = np.std(y_true)
    metrics['std_pred'] = np.std(y_pred)
    
    # Percentiles
    percentiles = [25, 50, 75, 90, 95]
    metrics['percentiles_true'] = [np.percentile(y_true, p) for p in percentiles]
    metrics['percentiles_pred'] = [np.percentile(y_pred, p) for p in percentiles]
    
    return metrics

def display_results(metrics, y_true, y_pred):
    """Display comprehensive results."""
    print("\n" + "=" * 80)
    print("PERFORMANCE METRICS")
    print("=" * 80)
    
    print(f"\n📊 Primary Metrics:")
    print(f"  R² (Coefficient of Determination): {metrics['r2']:.4f}")
    if metrics['r2'] > 0.60:
        print("    ✅ Excellent alignment with MoneyPuck (>0.60)")
    elif metrics['r2'] > 0.40:
        print("    ⚠️  Moderate alignment (0.40-0.60)")
    else:
        print("    ❌ Low alignment (<0.40)")
    
    print(f"  MAE (Mean Absolute Error): {metrics['mae']:.4f}")
    if metrics['mae'] < 0.02:
        print("    ✅ Very low error (<0.02)")
    elif metrics['mae'] < 0.03:
        print("    ⚠️  Moderate error (0.02-0.03)")
    else:
        print("    ❌ High error (>0.03)")
    
    print(f"  RMSE (Root Mean Squared Error): {metrics['rmse']:.4f}")
    if metrics['rmse'] < 0.03:
        print("    ✅ Very low error (<0.03)")
    elif metrics['rmse'] < 0.04:
        print("    ⚠️  Moderate error (0.03-0.04)")
    else:
        print("    ❌ High error (>0.04)")
    
    print(f"  Pearson Correlation: {metrics['correlation']:.4f} (p-value: {metrics['p_value']:.2e})")
    if metrics['correlation'] > 0.70:
        print("    ✅ Strong correlation (>0.70)")
    elif metrics['correlation'] > 0.50:
        print("    ⚠️  Moderate correlation (0.50-0.70)")
    else:
        print("    ❌ Weak correlation (<0.50)")
    
    print(f"\n📈 Distribution Comparison:")
    print(f"  Mean:")
    print(f"    MoneyPuck xG: {metrics['mean_true']:.4f}")
    print(f"    Our Predictions: {metrics['mean_pred']:.4f}")
    print(f"    Difference: {metrics['mean_pred'] - metrics['mean_true']:.4f}")
    
    print(f"  Median:")
    print(f"    MoneyPuck xG: {metrics['median_true']:.4f}")
    print(f"    Our Predictions: {metrics['median_pred']:.4f}")
    print(f"    Difference: {metrics['median_pred'] - metrics['median_true']:.4f}")
    
    print(f"  Standard Deviation:")
    print(f"    MoneyPuck xG: {metrics['std_true']:.4f}")
    print(f"    Our Predictions: {metrics['std_pred']:.4f}")
    
    print(f"\n📊 Percentile Comparison:")
    print(f"{'Percentile':<12} {'MoneyPuck xG':<15} {'Our Predictions':<15} {'Difference':<12}")
    print("-" * 60)
    percentiles = [25, 50, 75, 90, 95]
    for i, p in enumerate(percentiles):
        true_p = metrics['percentiles_true'][i]
        pred_p = metrics['percentiles_pred'][i]
        diff = pred_p - true_p
        print(f"{p:>2}th{'':<8} {true_p:>13.4f}   {pred_p:>13.4f}   {diff:>10.4f}")
    
    # High xG analysis
    print(f"\n🎯 High xG Shot Analysis (>0.3):")
    high_true = (y_true > 0.3).sum()
    high_pred = (y_pred > 0.3).sum()
    print(f"  MoneyPuck: {high_true:,} shots ({100*high_true/len(y_true):.2f}%)")
    print(f"  Our Predictions: {high_pred:,} shots ({100*high_pred/len(y_pred):.2f}%)")
    
    # Calibration analysis
    print(f"\n📉 Calibration Analysis:")
    bins = [0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.50, 1.0]
    y_pred_series = pd.Series(y_pred)
    y_pred_binned = pd.cut(y_pred_series, bins=bins)
    calibration_df = pd.DataFrame({
        'predicted_xg': y_pred,
        'actual_xg': y_true,
        'bin': y_pred_binned
    })
    calibration = calibration_df.groupby('bin', observed=True).agg({
        'predicted_xg': ['mean', 'count'],
        'actual_xg': 'mean'
    })
    
    print(f"{'Predicted xG Bin':<20} {'Mean Predicted':<15} {'Mean Actual':<15} {'Count':<10}")
    print("-" * 65)
    for idx in calibration.index:
        if pd.notna(idx):
            pred_mean = calibration.loc[idx, ('predicted_xg', 'mean')]
            actual_mean = calibration.loc[idx, ('actual_xg', 'mean')]
            count = int(calibration.loc[idx, ('predicted_xg', 'count')])
            print(f"{str(idx):<20} {pred_mean:>13.4f}   {actual_mean:>13.4f}   {count:>10,}")

def main():
    """Main execution."""
    print("=" * 80)
    print("TESTING MONEYPUCK-ALIGNED xG MODEL")
    print("=" * 80)
    print("\nThis script will:")
    print("  1. Load the trained model and matched data")
    print("  2. Generate predictions")
    print("  3. Calculate performance metrics (R², MAE, RMSE, Correlation)")
    print("  4. Display comprehensive analysis")
    print()
    
    # Load model and data
    model, feature_names, encoder, df = load_model_and_data()
    if model is None:
        return
    
    # Prepare features
    X, y = prepare_features(df, feature_names, encoder)
    if X is None:
        return
    
    # Generate predictions
    print("\n" + "=" * 80)
    print("GENERATING PREDICTIONS")
    print("=" * 80)
    y_pred = model.predict(X)
    print(f"✅ Generated predictions for {len(y_pred):,} shots")
    print(f"   Prediction range: {y_pred.min():.4f} to {y_pred.max():.4f}")
    print(f"   Prediction mean: {y_pred.mean():.4f}")
    
    # Calculate metrics
    metrics = calculate_metrics(y, y_pred)
    
    # Display results
    display_results(metrics, y, y_pred)
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\n✅ Model Performance:")
    print(f"   R²: {metrics['r2']:.4f} ({metrics['r2']*100:.1f}% of variance explained)")
    print(f"   MAE: {metrics['mae']:.4f}")
    print(f"   RMSE: {metrics['rmse']:.4f}")
    print(f"   Correlation: {metrics['correlation']:.4f}")
    
    if metrics['r2'] > 0.60:
        print("\n🎉 Excellent! Model shows strong alignment with MoneyPuck's xG values.")
    elif metrics['r2'] > 0.40:
        print("\n⚠️  Model shows moderate alignment. Consider additional feature engineering.")
    else:
        print("\n❌ Model shows low alignment. Review feature extraction and model training.")

if __name__ == "__main__":
    main()

