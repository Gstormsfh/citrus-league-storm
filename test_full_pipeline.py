#!/usr/bin/env python3
"""
test_full_pipeline.py
End-to-end integration test of all new features.
"""

import pandas as pd
import numpy as np
import os

def test_full_pipeline():
    """Test full pipeline with all new features."""
    print("=" * 80)
    print("FULL PIPELINE INTEGRATION TEST")
    print("=" * 80)
    
    # Check if data file exists
    data_file = 'data/our_shots_2025.csv'
    if not os.path.exists(data_file):
        print(f"❌ Data file not found: {data_file}")
        print("   Run pull_season_data.py first to generate test data")
        return
    
    print(f"\nLoading data from {data_file}...")
    df = pd.read_csv(data_file)
    print(f"Loaded {len(df):,} shots")
    
    # Check for new columns
    required_columns = [
        'expected_rebound_probability',
        'expected_goals_of_expected_rebounds',
        'shooting_talent_adjusted_xg',
        'shooting_talent_multiplier',
        'created_expected_goals'
    ]
    
    print("\n📊 Checking for new feature columns:")
    missing_columns = []
    for col in required_columns:
        if col in df.columns:
            non_null = df[col].notna().sum()
            pct = non_null / len(df) * 100
            print(f"   ✅ {col}: {non_null:,} non-null values ({pct:.1f}%)")
            
            # Check for reasonable values
            if col == 'expected_rebound_probability':
                if df[col].max() > 1.0 or df[col].min() < 0.0:
                    print(f"      ⚠️  Warning: Values outside [0, 1] range")
            elif col == 'shooting_talent_multiplier':
                if df[col].max() > 1.5 or df[col].min() < 0.5:
                    print(f"      ⚠️  Warning: Multipliers outside reasonable range [0.5, 1.5]")
        else:
            missing_columns.append(col)
            print(f"   ❌ {col}: NOT FOUND")
    
    if missing_columns:
        print(f"\n⚠️  Missing columns: {missing_columns}")
        print("   These will be populated when you run data_acquisition.py with the new features")
    else:
        print("\n✅ All new feature columns are present!")
    
    # Validate data quality
    print("\n📊 Data Quality Checks:")
    
    if 'expected_rebound_probability' in df.columns:
        rebound_shots = df[df['expected_rebound_probability'] > 0]
        print(f"   Shots with rebound probability > 0: {len(rebound_shots):,} ({len(rebound_shots)/len(df)*100:.1f}%)")
        print(f"   Average rebound probability: {df['expected_rebound_probability'].mean():.4f}")
    
    if 'shooting_talent_multiplier' in df.columns:
        adjusted_players = df[df['shooting_talent_multiplier'] != 1.0]
        print(f"   Shots with talent adjustment (≠ 1.0): {len(adjusted_players):,} ({len(adjusted_players)/len(df)*100:.1f}%)")
        print(f"   Average talent multiplier: {df['shooting_talent_multiplier'].mean():.3f}")
    
    if 'created_expected_goals' in df.columns:
        created_xg_total = df['created_expected_goals'].sum()
        regular_xg_total = df['xg_value'].sum()
        print(f"   Total Created xG: {created_xg_total:.2f}")
        print(f"   Total Regular xG: {regular_xg_total:.2f}")
        print(f"   Difference: {created_xg_total - regular_xg_total:.2f}")
    
    print("\n✅ Full pipeline integration test complete")


if __name__ == "__main__":
    test_full_pipeline()

