#!/usr/bin/env python3
"""
validate_stability.py
Validate stability of GSAx and GAR metrics across seasons.

Calculates season-to-season correlations for:
- Regressed GSAx
- Total GAR/60
- EVO GAR/60
- EVD GAR/60
- PPO GAR/60
- PPD GAR/60

Success Criteria:
- Regressed metrics should have higher correlation than raw metrics
- GSAx: r > 0.20 (goaltending is inherently unstable)
- EVO/EVD: r > 0.50 (skater metrics more stable)
- Total GAR: r > 0.40
"""

import pandas as pd
import numpy as np
from scipy.stats import pearsonr
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, List, Tuple
from season_utils import get_season_label

load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Metrics to test
METRICS_TO_TEST = {
    'gsax': {
        'table': 'goalie_gsax',
        'regressed_col': 'regressed_gsax',
        'raw_col': 'raw_gsax',
        'id_col': 'goalie_id',
        'threshold': 0.20,
        'name': 'Regressed GSAx'
    },
    'total_gar': {
        'table': 'player_gar_components',
        'regressed_col': 'total_gar_per_60',
        'raw_col': None,  # Total GAR doesn't have a raw equivalent
        'id_col': 'player_id',
        'threshold': 0.40,
        'name': 'Total GAR/60'
    },
    'evo_gar': {
        'table': 'player_gar_components',
        'regressed_col': 'evo_gar_per_60',
        'raw_col': None,
        'id_col': 'player_id',
        'threshold': 0.50,
        'name': 'EVO GAR/60'
    },
    'evd_gar': {
        'table': 'player_gar_components',
        'regressed_col': 'evd_gar_per_60',
        'raw_col': None,
        'id_col': 'player_id',
        'threshold': 0.50,
        'name': 'EVD GAR/60'
    },
    'ppo_gar': {
        'table': 'player_gar_components',
        'regressed_col': 'ppo_gar_per_60',
        'raw_col': None,
        'id_col': 'player_id',
        'threshold': 0.40,
        'name': 'PPO GAR/60'
    },
    'ppd_gar': {
        'table': 'player_gar_components',
        'regressed_col': 'ppd_gar_per_60',
        'raw_col': None,
        'id_col': 'player_id',
        'threshold': 0.40,
        'name': 'PPD GAR/60'
    },
}


def load_metric_data(metric_config: dict, season: int) -> pd.DataFrame:
    """
    Load metric data for a season.
    
    Args:
        metric_config: Configuration dictionary for the metric
        season: Season year
    
    Returns:
        DataFrame with id_col and regressed_col
    """
    try:
        table = metric_config['table']
        id_col = metric_config['id_col']
        regressed_col = metric_config['regressed_col']
        
        response = supabase.table(table).select(
            f'{id_col}, {regressed_col}, season'
        ).eq('season', season).execute()
        
        if not response.data:
            return pd.DataFrame()
        
        df = pd.DataFrame(response.data)
        df[regressed_col] = pd.to_numeric(df[regressed_col], errors='coerce')
        df = df[df[regressed_col].notna()].copy()
        
        return df
        
    except Exception as e:
        print(f"  WARNING: Error loading {metric_config['name']} for season {season}: {e}")
        return pd.DataFrame()


def calculate_stability_correlation(metric_config: dict, season1: int, season2: int) -> Dict:
    """
    Calculate season-to-season correlation for a metric.
    
    Args:
        metric_config: Configuration dictionary for the metric
        season1: Season N
        season2: Season N+1
    
    Returns:
        Dictionary with correlation results
    """
    # Load data for both seasons
    df1 = load_metric_data(metric_config, season1)
    df2 = load_metric_data(metric_config, season2)
    
    if len(df1) == 0 or len(df2) == 0:
        return {}
    
    id_col = metric_config['id_col']
    regressed_col = metric_config['regressed_col']
    
    # Merge on player/goalie ID
    merged = df1[[id_col, regressed_col]].merge(
        df2[[id_col, regressed_col]],
        on=id_col,
        suffixes=('_s1', '_s2')
    )
    
    if len(merged) == 0:
        return {}
    
    # Calculate correlation
    col1 = f'{regressed_col}_s1'
    col2 = f'{regressed_col}_s2'
    
    # Remove any remaining NaN values
    merged = merged[[col1, col2]].dropna()
    
    if len(merged) < 10:  # Need minimum sample size
        return {}
    
    corr, p_value = pearsonr(merged[col1], merged[col2])
    
    return {
        'metric': metric_config['name'],
        'season1': season1,
        'season2': season2,
        'correlation': corr,
        'p_value': p_value,
        'n_samples': len(merged),
        'threshold': metric_config['threshold'],
        'meets_threshold': abs(corr) >= metric_config['threshold']
    }


def main():
    """
    Main function to validate stability across all metrics and season pairs.
    """
    print("=" * 80)
    print("STABILITY VALIDATION")
    print("=" * 80)
    print(f"Started at: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Season pairs to test (use available seasons)
    season_pairs = [
        (2023, 2024),  # Use available seasons
        # Add more pairs as historical data becomes available
        # (2021, 2022),
        # (2022, 2023),
    ]
    
    all_results = []
    
    for metric_key, metric_config in METRICS_TO_TEST.items():
        print(f"\n{'='*80}")
        print(f"TESTING: {metric_config['name']}")
        print(f"{'='*80}")
        
        metric_results = []
        
        for season1, season2 in season_pairs:
            print(f"  {get_season_label(season1)} → {get_season_label(season2)}")
            
            try:
                result = calculate_stability_correlation(metric_config, season1, season2)
                
                if result:
                    metric_results.append(result)
                    status = "✅" if result['meets_threshold'] else "❌"
                    print(f"    {status} r = {result['correlation']:.4f} (n={result['n_samples']:,}, threshold={result['threshold']:.2f})")
                else:
                    print(f"    ⚠️  No data available")
                    
            except Exception as e:
                print(f"    ❌ Error: {e}")
                import traceback
                traceback.print_exc()
        
        # Average correlation across season pairs
        if metric_results:
            avg_corr = np.mean([r['correlation'] for r in metric_results])
            avg_n = np.mean([r['n_samples'] for r in metric_results])
            all_passed = all([r['meets_threshold'] for r in metric_results])
            
            print(f"\n  Average correlation: {avg_corr:.4f}")
            print(f"  Average sample size: {avg_n:.0f}")
            print(f"  All tests passed: {'✅' if all_passed else '❌'}")
    
    # Summary
    if all_results:
        print("\n" + "=" * 80)
        print("STABILITY SUMMARY")
        print("=" * 80)
        
        df_summary = pd.DataFrame(all_results)
        
        # Group by metric
        for metric_name in df_summary['metric'].unique():
            metric_data = df_summary[df_summary['metric'] == metric_name]
            avg_corr = metric_data['correlation'].mean()
            threshold = metric_data['threshold'].iloc[0]
            passed = avg_corr >= threshold
            
            status = "✅" if passed else "❌"
            print(f"  {status} {metric_name}: r = {avg_corr:.4f} (threshold: {threshold:.2f})")
        
        # Save results
        output_file = 'stability_results.csv'
        df_summary.to_csv(output_file, index=False)
        print(f"\n  Saved results to {output_file}")
        
        # Generate summary report
        summary_file = 'stability_summary.md'
        with open(summary_file, 'w') as f:
            f.write("# Stability Validation Results\n\n")
            f.write("## Season-to-Season Correlations\n\n")
            f.write("| Metric | Avg Correlation | Threshold | Status |\n")
            f.write("|--------|----------------|-----------|--------|\n")
            
            for metric_name in df_summary['metric'].unique():
                metric_data = df_summary[df_summary['metric'] == metric_name]
                avg_corr = metric_data['correlation'].mean()
                threshold = metric_data['threshold'].iloc[0]
                passed = avg_corr >= threshold
                status = "✅ Pass" if passed else "❌ Fail"
                
                f.write(f"| {metric_name} | {avg_corr:.4f} | {threshold:.2f} | {status} |\n")
            
            f.write("\n## Interpretation\n\n")
            f.write("Higher correlations indicate more stable, repeatable metrics.\n")
            f.write("Regressed metrics should show higher stability than raw metrics.\n")
        
        print(f"  Saved summary to {summary_file}")
    else:
        print("\n  ⚠️  No results generated. Check data availability.")
    
    print(f"\nCompleted at: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    # Collect all results
    all_results = []
    
    for metric_key, metric_config in METRICS_TO_TEST.items():
        for season1, season2 in [(2021, 2022), (2022, 2023), (2023, 2024)]:
            result = calculate_stability_correlation(metric_config, season1, season2)
            if result:
                all_results.append(result)
    
    # Update main() to use collected results
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--use-collected':
        # Use pre-collected results
        pass
    else:
        # Run normally
        main()

