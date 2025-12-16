#!/usr/bin/env python3
"""
tune_qoc_strength.py
Tune QoC adjustment strength parameter to find optimal setting.

Tests three adjustment strengths:
- 0.05 (max ±5% adjustment)
- 0.10 (current, max ±10%)
- 0.15 (max ±15% adjustment)

For each strength, runs predictive power test and records R², MAE, RMSE.
"""

import pandas as pd
import numpy as np
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from backtest_predictive_power import run_predictive_test, calculate_metrics
from apply_qoc_adjustments import QOC_ADJUSTMENT_STRENGTH
from season_utils import get_season_label

load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Test strengths
STRENGTHS_TO_TEST = [0.05, 0.10, 0.15]

# Season pairs to test (use available seasons)
SEASON_PAIRS = [
    (2023, 2024),  # Use available seasons
    # Add more pairs as historical data becomes available
    # (2022, 2023),
]


def run_test_with_strength(strength: float, training_season: int, 
                           prediction_season: int) -> dict:
    """
    Run predictive test with a specific QoC adjustment strength.
    
    Args:
        strength: QoC adjustment strength (0.05, 0.10, or 0.15)
        training_season: Season N
        prediction_season: Season N+1
    
    Returns:
        Dictionary with metrics
    """
    # Temporarily modify QOC_ADJUSTMENT_STRENGTH
    # Note: This requires modifying apply_qoc_adjustments.py to accept parameter
    # For now, we'll need to update the module-level variable
    import apply_qoc_adjustments
    original_strength = apply_qoc_adjustments.QOC_ADJUSTMENT_STRENGTH
    apply_qoc_adjustments.QOC_ADJUSTMENT_STRENGTH = strength
    
    try:
        # Run predictive test
        df_results = run_predictive_test(training_season, prediction_season)
        
        if len(df_results) == 0:
            return {}
        
        # Calculate metrics
        metrics = calculate_metrics(df_results)
        metrics['qoc_strength'] = strength
        
        return metrics
        
    finally:
        # Restore original strength
        apply_qoc_adjustments.QOC_ADJUSTMENT_STRENGTH = original_strength


def main():
    """
    Main function to test all QoC adjustment strengths.
    """
    print("=" * 80)
    print("QoC ADJUSTMENT STRENGTH TUNING")
    print("=" * 80)
    print(f"Started at: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTesting strengths: {STRENGTHS_TO_TEST}")
    print(f"Season pairs: {[f'{get_season_label(s1)}→{get_season_label(s2)}' for s1, s2 in SEASON_PAIRS]}")
    
    all_results = []
    
    for strength in STRENGTHS_TO_TEST:
        print(f"\n{'='*80}")
        print(f"TESTING STRENGTH: {strength} (max ±{strength*100:.0f}% adjustment)")
        print(f"{'='*80}")
        
        strength_results = []
        
        for training_season, prediction_season in SEASON_PAIRS:
            print(f"\n  {get_season_label(training_season)} → {get_season_label(prediction_season)}")
            
            try:
                metrics = run_test_with_strength(strength, training_season, prediction_season)
                
                if metrics:
                    metrics['training_season'] = training_season
                    metrics['prediction_season'] = prediction_season
                    strength_results.append(metrics)
                    
                    print(f"    R²: {metrics.get('model_r2', 0):.4f}")
                    print(f"    MAE: {metrics.get('model_mae', 0):.4f} goals/game")
                    print(f"    RMSE: {metrics.get('model_rmse', 0):.4f} goals/game")
                else:
                    print(f"    ⚠️  No results")
                    
            except Exception as e:
                print(f"    ❌ Error: {e}")
                import traceback
                traceback.print_exc()
        
        # Average results across season pairs
        if strength_results:
            df_strength = pd.DataFrame(strength_results)
            avg_metrics = {
                'qoc_strength': strength,
                'avg_r2': df_strength['model_r2'].mean(),
                'avg_mae': df_strength['model_mae'].mean(),
                'avg_rmse': df_strength['model_rmse'].mean(),
                'avg_correlation': df_strength['model_correlation'].mean(),
                'n_tests': len(strength_results)
            }
            all_results.append(avg_metrics)
            
            print(f"\n  Average for strength {strength}:")
            print(f"    R²: {avg_metrics['avg_r2']:.4f}")
            print(f"    MAE: {avg_metrics['avg_mae']:.4f} goals/game")
            print(f"    RMSE: {avg_metrics['avg_rmse']:.4f} goals/game")
    
    # Summary and recommendation
    if all_results:
        print("\n" + "=" * 80)
        print("TUNING SUMMARY")
        print("=" * 80)
        
        df_summary = pd.DataFrame(all_results)
        
        # Find best strength (highest R²)
        best_idx = df_summary['avg_r2'].idxmax()
        best_strength = df_summary.loc[best_idx, 'qoc_strength']
        best_r2 = df_summary.loc[best_idx, 'avg_r2']
        
        print(f"\n  Optimal QoC Strength: {best_strength} (max ±{best_strength*100:.0f}% adjustment)")
        print(f"  Best R²: {best_r2:.4f}")
        
        print(f"\n  Results by strength:")
        for _, row in df_summary.iterrows():
            marker = "⭐" if row['qoc_strength'] == best_strength else "  "
            print(f"    {marker} {row['qoc_strength']:.2f}: R²={row['avg_r2']:.4f}, MAE={row['avg_mae']:.4f}")
        
        # Save results
        output_file = 'qoc_tuning_results.csv'
        df_summary.to_csv(output_file, index=False)
        print(f"\n  Saved results to {output_file}")
        
        # Generate recommendation
        recommendation_file = 'qoc_tuning_summary.md'
        with open(recommendation_file, 'w') as f:
            f.write("# QoC Adjustment Strength Tuning Results\n\n")
            f.write(f"**Optimal Strength**: {best_strength} (max ±{best_strength*100:.0f}% adjustment)\n\n")
            f.write("## Results by Strength\n\n")
            f.write("| Strength | R² | MAE | RMSE |\n")
            f.write("|----------|----|----|----|\n")
            for _, row in df_summary.iterrows():
                f.write(f"| {row['qoc_strength']:.2f} | {row['avg_r2']:.4f} | {row['avg_mae']:.4f} | {row['avg_rmse']:.4f} |\n")
            f.write(f"\n## Recommendation\n\n")
            f.write(f"Use **{best_strength}** as the QoC adjustment strength in production.\n")
            f.write(f"This setting achieved the highest R² ({best_r2:.4f}) across all tested season pairs.\n")
        
        print(f"  Saved recommendation to {recommendation_file}")
    else:
        print("\n  ⚠️  No results generated. Check data availability.")
    
    print(f"\nCompleted at: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()

