#!/usr/bin/env python3
"""
validate_gar_raw_components.py
Validation script for Phase 2: Raw GAR Component Rates

This script validates:
1. Component rate ranges (EVO, EVD, PPO, PPD, Penalty)
2. TOI sanity checks
3. Data quality (NaN values, missing data)
"""

import pandas as pd
import numpy as np
import os

# Expected ranges for component rates (per 60 minutes)
EXPECTED_RANGES = {
    'evo_rate_raw': {'min': 0.0, 'max': 3.0, 'mean_expected': 1.5, 'name': 'EVO (xGF/60 at 5v5)'},
    'evd_rate_raw': {'min': 0.0, 'max': 3.0, 'mean_expected': 1.5, 'name': 'EVD (xGA/60 at 5v5)'},
    'ppo_rate_raw': {'min': 0.0, 'max': 12.0, 'mean_expected': 6.0, 'name': 'PPO (xGF/60 on PP)'},
    'ppd_rate_raw': {'min': 0.0, 'max': 12.0, 'mean_expected': 6.0, 'name': 'PPD (xGA/60 on PK)'},
    'penalty_component_raw': {'min': -2.0, 'max': 2.0, 'mean_expected': 0.0, 'name': 'Penalty Component'}
}

def load_raw_components():
    """Load raw component rates from CSV."""
    csv_file = 'player_gar_components_raw.csv'
    
    if not os.path.exists(csv_file):
        print(f"ERROR: {csv_file} not found")
        print("   Please run calculate_gar_components.py first")
        return None
    
    try:
        df = pd.read_csv(csv_file)
        print(f"OK: Loaded {len(df):,} players from {csv_file}")
        return df
    except Exception as e:
        print(f"ERROR: Could not load CSV: {e}")
        return None


def validate_component_ranges(df):
    """Validate that component rates are within expected ranges."""
    print("\n" + "=" * 80)
    print("COMPONENT RANGE VALIDATION")
    print("=" * 80)
    
    all_passed = True
    
    for col, expected in EXPECTED_RANGES.items():
        if col not in df.columns:
            print(f"WARNING: Column '{col}' not found in data")
            all_passed = False
            continue
        
        rates = df[col].dropna()
        
        if len(rates) == 0:
            print(f"WARNING: No data for {expected['name']}")
            all_passed = False
            continue
        
        # Calculate statistics
        min_val = rates.min()
        max_val = rates.max()
        mean_val = rates.mean()
        median_val = rates.median()
        std_val = rates.std()
        
        # Check for NaN values
        nan_count = df[col].isna().sum()
        
        # Check ranges
        min_ok = min_val >= expected['min']
        max_ok = max_val <= expected['max']
        mean_ok = abs(mean_val - expected['mean_expected']) < 1.0  # Allow 1.0 deviation
        
        # Check for negative values (except penalty component)
        negative_count = (rates < 0).sum()
        negative_ok = True
        if col != 'penalty_component_raw' and negative_count > 0:
            negative_ok = False
            print(f"  ERROR: Found {negative_count} negative values in {expected['name']} (should be non-negative)")
        
        # Overall status
        status = "PASS" if (min_ok and max_ok and mean_ok and negative_ok) else "FAIL"
        if status == "FAIL":
            all_passed = False
        
        print(f"\n{expected['name']}: {status}")
        print(f"  Range: [{min_val:.3f}, {max_val:.3f}] (expected: [{expected['min']:.1f}, {expected['max']:.1f}])")
        print(f"  Mean: {mean_val:.3f} (expected: ~{expected['mean_expected']:.1f})")
        print(f"  Median: {median_val:.3f}")
        print(f"  Std Dev: {std_val:.3f}")
        print(f"  NaN values: {nan_count}")
        print(f"  Negative values: {negative_count} (allowed: {col == 'penalty_component_raw'})")
        
        if not min_ok:
            print(f"  ⚠️  MIN VALUE TOO LOW: {min_val:.3f} < {expected['min']:.1f}")
        if not max_ok:
            print(f"  ⚠️  MAX VALUE TOO HIGH: {max_val:.3f} > {expected['max']:.1f}")
        if not mean_ok:
            print(f"  ⚠️  MEAN DEVIATION: {mean_val:.3f} (expected ~{expected['mean_expected']:.1f})")
    
    return all_passed


def validate_toi_sanity(df):
    """Validate that TOI values are consistent and reasonable."""
    print("\n" + "=" * 80)
    print("TOI SANITY CHECK")
    print("=" * 80)
    
    all_passed = True
    
    # Check that TOI columns exist
    toi_cols = ['toi_5v5_minutes', 'toi_pp_minutes', 'toi_pk_minutes', 'toi_total_minutes']
    missing_cols = [col for col in toi_cols if col not in df.columns]
    
    if missing_cols:
        print(f"ERROR: Missing TOI columns: {missing_cols}")
        return False
    
    # Check that total TOI = sum of situation TOI (within rounding)
    df_check = df.copy()
    df_check['toi_sum'] = (
        df_check['toi_5v5_minutes'].fillna(0) +
        df_check['toi_pp_minutes'].fillna(0) +
        df_check['toi_pk_minutes'].fillna(0)
    )
    
    # Allow 1 minute difference for rounding
    toi_mismatch = df_check[
        abs(df_check['toi_sum'] - df_check['toi_total_minutes'].fillna(0)) > 1.0
    ]
    
    if len(toi_mismatch) > 0:
        print(f"WARNING: {len(toi_mismatch)} players have TOI mismatch > 1 minute")
        print("  Sample mismatches:")
        print(toi_mismatch[['player_id', 'toi_5v5_minutes', 'toi_pp_minutes', 'toi_pk_minutes', 'toi_total_minutes', 'toi_sum']].head(5))
        all_passed = False
    else:
        print("OK: TOI sums match total TOI (within 1 minute tolerance)")
    
    # Check for negative TOI
    negative_toi = df_check[
        (df_check['toi_5v5_minutes'] < 0) |
        (df_check['toi_pp_minutes'] < 0) |
        (df_check['toi_pk_minutes'] < 0) |
        (df_check['toi_total_minutes'] < 0)
    ]
    
    if len(negative_toi) > 0:
        print(f"ERROR: Found {len(negative_toi)} players with negative TOI")
        all_passed = False
    else:
        print("OK: No negative TOI values")
    
    # Check for unreasonably high TOI (e.g., > 30 minutes per game average)
    # Assuming ~82 games per season, 30 min/game = 2460 minutes
    high_toi = df_check[df_check['toi_total_minutes'] > 3000]
    
    if len(high_toi) > 0:
        print(f"WARNING: {len(high_toi)} players have TOI > 3000 minutes (unusually high)")
        print("  Sample high TOI players:")
        print(high_toi[['player_id', 'toi_total_minutes']].head(5))
        # This is a warning, not a failure (could be valid for star players)
    
    # Summary statistics
    print(f"\nTOI Summary Statistics:")
    print(f"  Total TOI - Min: {df_check['toi_total_minutes'].min():.1f}, Max: {df_check['toi_total_minutes'].max():.1f}, Mean: {df_check['toi_total_minutes'].mean():.1f}")
    print(f"  5v5 TOI - Min: {df_check['toi_5v5_minutes'].min():.1f}, Max: {df_check['toi_5v5_minutes'].max():.1f}, Mean: {df_check['toi_5v5_minutes'].mean():.1f}")
    print(f"  PP TOI - Min: {df_check['toi_pp_minutes'].min():.1f}, Max: {df_check['toi_pp_minutes'].max():.1f}, Mean: {df_check['toi_pp_minutes'].mean():.1f}")
    print(f"  PK TOI - Min: {df_check['toi_pk_minutes'].min():.1f}, Max: {df_check['toi_pk_minutes'].max():.1f}, Mean: {df_check['toi_pk_minutes'].mean():.1f}")
    
    return all_passed


def validate_data_quality(df):
    """Validate data quality (NaN values, missing data)."""
    print("\n" + "=" * 80)
    print("DATA QUALITY CHECK")
    print("=" * 80)
    
    all_passed = True
    
    # Check for NaN in critical columns
    critical_cols = ['player_id', 'evo_rate_raw', 'evd_rate_raw', 'ppo_rate_raw', 'ppd_rate_raw', 'penalty_component_raw']
    
    for col in critical_cols:
        if col not in df.columns:
            print(f"ERROR: Critical column '{col}' missing")
            all_passed = False
            continue
        
        nan_count = df[col].isna().sum()
        nan_pct = (nan_count / len(df)) * 100
        
        if col == 'player_id' and nan_count > 0:
            print(f"ERROR: {nan_count} rows with missing player_id")
            all_passed = False
        elif col != 'player_id' and nan_count > 0:
            # For rate columns, NaN is acceptable if TOI is 0
            print(f"WARNING: {nan_count} ({nan_pct:.1f}%) rows with NaN in {col}")
            if nan_pct > 10:
                print(f"  ⚠️  High NaN percentage - may indicate data quality issue")
                all_passed = False
    
    # Check for duplicate player_ids
    duplicate_players = df[df.duplicated(subset=['player_id'], keep=False)]
    if len(duplicate_players) > 0:
        print(f"ERROR: Found {len(duplicate_players)} duplicate player_id entries")
        print("  Sample duplicates:")
        print(duplicate_players[['player_id']].head(10))
        all_passed = False
    else:
        print("OK: No duplicate player_ids")
    
    # Check for players with all zero rates (might indicate missing data)
    zero_rate_players = df[
        (df['evo_rate_raw'] == 0) &
        (df['evd_rate_raw'] == 0) &
        (df['ppo_rate_raw'] == 0) &
        (df['ppd_rate_raw'] == 0) &
        (df['toi_total_minutes'] > 0)  # Has TOI but no rates
    ]
    
    if len(zero_rate_players) > 0:
        print(f"WARNING: {len(zero_rate_players)} players have TOI > 0 but all rates = 0")
        print("  This may indicate missing on-ice xGF/xGA data")
        if len(zero_rate_players) > len(df) * 0.1:  # More than 10% of players
            print(f"  ⚠️  High percentage ({len(zero_rate_players)/len(df)*100:.1f}%) - may indicate data issue")
            all_passed = False
    
    return all_passed


def validate_sample_players(df):
    """Validate a few sample players in detail."""
    print("\n" + "=" * 80)
    print("SAMPLE PLAYER VALIDATION")
    print("=" * 80)
    
    # Select a few players with different TOI profiles
    # High TOI player
    high_toi = df.nlargest(1, 'toi_total_minutes')
    # Medium TOI player
    medium_toi = df[df['toi_total_minutes'].between(500, 1500)].head(1)
    # Low TOI player
    low_toi = df[df['toi_total_minutes'] > 0].nsmallest(1, 'toi_total_minutes')
    
    samples = pd.concat([high_toi, medium_toi, low_toi]).drop_duplicates(subset=['player_id'])
    
    print(f"Validating {len(samples)} sample players:\n")
    
    for idx, row in samples.iterrows():
        player_id = row['player_id']
        print(f"Player ID: {player_id}")
        print(f"  TOI Total: {row['toi_total_minutes']:.1f} minutes")
        print(f"    - 5v5: {row['toi_5v5_minutes']:.1f} min")
        print(f"    - PP: {row['toi_pp_minutes']:.1f} min")
        print(f"    - PK: {row['toi_pk_minutes']:.1f} min")
        print(f"  Component Rates:")
        print(f"    - EVO: {row['evo_rate_raw']:.3f} xGF/60")
        print(f"    - EVD: {row['evd_rate_raw']:.3f} xGA/60")
        print(f"    - PPO: {row['ppo_rate_raw']:.3f} xGF/60")
        print(f"    - PPD: {row['ppd_rate_raw']:.3f} xGA/60")
        print(f"    - Penalty: {row['penalty_component_raw']:.3f} per 60")
        print()


def main():
    """Main validation function."""
    print("=" * 80)
    print("PHASE 2 VALIDATION: RAW GAR COMPONENT RATES")
    print("=" * 80)
    
    # Load data
    df = load_raw_components()
    if df is None:
        return
    
    print(f"\nData Summary:")
    print(f"  Total players: {len(df):,}")
    print(f"  Columns: {', '.join(df.columns.tolist())}")
    
    # Run validations
    range_ok = validate_component_ranges(df)
    toi_ok = validate_toi_sanity(df)
    quality_ok = validate_data_quality(df)
    validate_sample_players(df)
    
    # Final summary
    print("\n" + "=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    
    all_passed = range_ok and toi_ok and quality_ok
    
    if all_passed:
        print("✅ ALL VALIDATIONS PASSED")
        print("\nRaw component rates are ready for Phase 3 (Bayesian Regression)")
    else:
        print("❌ SOME VALIDATIONS FAILED")
        print("\nPlease review the errors above before proceeding to Phase 3")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

