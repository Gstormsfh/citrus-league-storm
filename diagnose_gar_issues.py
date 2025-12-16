#!/usr/bin/env python3
"""Quick diagnostic script to check GAR component calculation issues."""

import pandas as pd
import os

# Check if on-ice CSV exists
if os.path.exists('on_ice_xgf_xga.csv'):
    df_on_ice = pd.read_csv('on_ice_xgf_xga.csv')
    print("on_ice_xgf_xga.csv exists:")
    print(f"  Shape: {df_on_ice.shape}")
    print(f"  Columns: {df_on_ice.columns.tolist()}")
    print(f"  Non-zero xGF: {(df_on_ice['on_ice_xgf'] > 0).sum()}")
    print(f"  Non-zero xGA: {(df_on_ice['on_ice_xga'] > 0).sum()}")
    print(f"\n  Sample:")
    print(df_on_ice.head(10))
else:
    print("on_ice_xgf_xga.csv does NOT exist")

# Check raw components
if os.path.exists('player_gar_components_raw.csv'):
    df_raw = pd.read_csv('player_gar_components_raw.csv')
    print("\n\nplayer_gar_components_raw.csv:")
    print(f"  Shape: {df_raw.shape}")
    print(f"  Columns: {df_raw.columns.tolist()}")
    
    print(f"\n  EVO stats:")
    print(f"    Non-zero: {(df_raw['evo_rate_raw'] > 0).sum()}")
    print(f"    Max: {df_raw['evo_rate_raw'].max():.3f}")
    print(f"    Mean: {df_raw['evo_rate_raw'].mean():.3f}")
    
    print(f"\n  EVD stats:")
    print(f"    Non-zero: {(df_raw['evd_rate_raw'] > 0).sum()}")
    print(f"    Max: {df_raw['evd_rate_raw'].max():.3f}")
    print(f"    Mean: {df_raw['evd_rate_raw'].mean():.3f}")
    
    print(f"\n  High EVO players (top 5):")
    high_evo = df_raw.nlargest(5, 'evo_rate_raw')
    print(high_evo[['player_id', 'evo_rate_raw', 'toi_5v5_minutes', 'toi_total_minutes']])
    
    print(f"\n  Players with TOI > 0 but EVO = 0:")
    zero_evo = df_raw[(df_raw['toi_5v5_minutes'] > 0) & (df_raw['evo_rate_raw'] == 0)]
    print(f"    Count: {len(zero_evo)}")
    if len(zero_evo) > 0:
        print(zero_evo.head(5)[['player_id', 'evo_rate_raw', 'toi_5v5_minutes']])
else:
    print("\nplayer_gar_components_raw.csv does NOT exist")

