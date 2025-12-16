#!/usr/bin/env python3
"""
generate_backtest_report.py
Generate comprehensive backtesting report from all validation results.

Compiles results from:
- Predictive Power Validation (Step 2)
- QoC Tuning (Step 3)
- Stability Validation (Step 4)

Generates a final markdown report with recommendations.
"""

import pandas as pd
import os
from datetime import datetime
from pathlib import Path

def load_predictive_results() -> pd.DataFrame:
    """Load predictive power results."""
    try:
        if os.path.exists('predictive_power_summary.csv'):
            return pd.read_csv('predictive_power_summary.csv')
        return pd.DataFrame()
    except Exception as e:
        print(f"  WARNING: Could not load predictive results: {e}")
        return pd.DataFrame()

def load_qoc_tuning_results() -> pd.DataFrame:
    """Load QoC tuning results."""
    try:
        if os.path.exists('qoc_tuning_results.csv'):
            return pd.read_csv('qoc_tuning_results.csv')
        return pd.DataFrame()
    except Exception as e:
        print(f"  WARNING: Could not load QoC tuning results: {e}")
        return pd.DataFrame()

def load_stability_results() -> pd.DataFrame:
    """Load stability validation results."""
    try:
        if os.path.exists('stability_results.csv'):
            return pd.read_csv('stability_results.csv')
        return pd.DataFrame()
    except Exception as e:
        print(f"  WARNING: Could not load stability results: {e}")
        return pd.DataFrame()

def generate_report():
    """Generate comprehensive backtesting report."""
    print("=" * 80)
    print("GENERATING BACKTESTING REPORT")
    print("=" * 80)
    
    # Load all results
    df_predictive = load_predictive_results()
    df_qoc = load_qoc_tuning_results()
    df_stability = load_stability_results()
    
    # Generate report
    report_lines = []
    
    report_lines.append("# Backtesting and Validation Report")
    report_lines.append("")
    report_lines.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("")
    report_lines.append("---")
    report_lines.append("")
    report_lines.append("## Executive Summary")
    report_lines.append("")
    
    # Predictive Power Summary
    if len(df_predictive) > 0:
        avg_r2 = df_predictive['model_r2'].mean()
        avg_baseline_r2 = df_predictive['baseline_r2'].mean()
        r2_improvement = avg_r2 - avg_baseline_r2
        avg_mae = df_predictive['model_mae'].mean()
        
        report_lines.append("### Predictive Power")
        report_lines.append("")
        report_lines.append(f"- **Model R²**: {avg_r2:.4f}")
        report_lines.append(f"- **Baseline R²**: {avg_baseline_r2:.4f}")
        report_lines.append(f"- **R² Improvement**: {r2_improvement:+.4f}")
        report_lines.append(f"- **Average MAE**: {avg_mae:.4f} goals/game")
        report_lines.append("")
        
        if r2_improvement > 0.10:
            report_lines.append("✅ **Model significantly outperforms baseline** (R² improvement > 0.10)")
        else:
            report_lines.append("⚠️ **Model improvement is below target** (R² improvement < 0.10)")
        report_lines.append("")
    else:
        report_lines.append("### Predictive Power")
        report_lines.append("")
        report_lines.append("⚠️ No predictive power results available. Run `backtest_predictive_power.py` first.")
        report_lines.append("")
    
    # QoC Tuning Summary
    if len(df_qoc) > 0:
        best_idx = df_qoc['avg_r2'].idxmax()
        best_strength = df_qoc.loc[best_idx, 'qoc_strength']
        best_r2 = df_qoc.loc[best_idx, 'avg_r2']
        
        report_lines.append("### QoC Adjustment Strength")
        report_lines.append("")
        report_lines.append(f"- **Optimal Strength**: {best_strength} (max ±{best_strength*100:.0f}% adjustment)")
        report_lines.append(f"- **Best R²**: {best_r2:.4f}")
        report_lines.append("")
        report_lines.append("| Strength | R² | MAE | RMSE |")
        report_lines.append("|----------|----|----|----|")
        for _, row in df_qoc.iterrows():
            marker = "⭐" if row['qoc_strength'] == best_strength else "  "
            report_lines.append(f"| {marker} {row['qoc_strength']:.2f} | {row['avg_r2']:.4f} | {row['avg_mae']:.4f} | {row['avg_rmse']:.4f} |")
        report_lines.append("")
    else:
        report_lines.append("### QoC Adjustment Strength")
        report_lines.append("")
        report_lines.append("⚠️ No QoC tuning results available. Run `tune_qoc_strength.py` first.")
        report_lines.append("")
    
    # Stability Summary
    if len(df_stability) > 0:
        report_lines.append("### Stability Validation")
        report_lines.append("")
        
        # Group by metric
        for metric_name in df_stability['metric'].unique():
            metric_data = df_stability[df_stability['metric'] == metric_name]
            avg_corr = metric_data['correlation'].mean()
            threshold = metric_data['threshold'].iloc[0]
            passed = avg_corr >= threshold
            
            status = "✅" if passed else "❌"
            report_lines.append(f"- {status} **{metric_name}**: r = {avg_corr:.4f} (threshold: {threshold:.2f})")
        
        report_lines.append("")
    else:
        report_lines.append("### Stability Validation")
        report_lines.append("")
        report_lines.append("⚠️ No stability results available. Run `validate_stability.py` first.")
        report_lines.append("")
    
    # Detailed Results
    report_lines.append("---")
    report_lines.append("")
    report_lines.append("## Detailed Results")
    report_lines.append("")
    
    if len(df_predictive) > 0:
        report_lines.append("### Predictive Power by Season Pair")
        report_lines.append("")
        report_lines.append("| Training Season | Prediction Season | Model R² | Baseline R² | R² Improvement | MAE |")
        report_lines.append("|----------------|-------------------|----------|------------|----------------|-----|")
        for _, row in df_predictive.iterrows():
            report_lines.append(
                f"| {row.get('training_season', 'N/A')} | {row.get('prediction_season', 'N/A')} | "
                f"{row.get('model_r2', 0):.4f} | {row.get('baseline_r2', 0):.4f} | "
                f"{row.get('r2_improvement', 0):+.4f} | {row.get('model_mae', 0):.4f} |"
            )
        report_lines.append("")
    
    if len(df_stability) > 0:
        report_lines.append("### Stability Correlations by Season Pair")
        report_lines.append("")
        report_lines.append("| Metric | Season 1 | Season 2 | Correlation | n | Meets Threshold |")
        report_lines.append("|--------|----------|----------|-------------|---|------------------|")
        for _, row in df_stability.iterrows():
            status = "✅" if row.get('meets_threshold', False) else "❌"
            report_lines.append(
                f"| {row.get('metric', 'N/A')} | {row.get('season1', 'N/A')} | {row.get('season2', 'N/A')} | "
                f"{row.get('correlation', 0):.4f} | {row.get('n_samples', 0)} | {status} |"
            )
        report_lines.append("")
    
    # Recommendations
    report_lines.append("---")
    report_lines.append("")
    report_lines.append("## Recommendations")
    report_lines.append("")
    
    recommendations = []
    
    if len(df_predictive) > 0:
        avg_r2_improvement = df_predictive['r2_improvement'].mean()
        if avg_r2_improvement > 0.10:
            recommendations.append("✅ **Model is production-ready**: R² improvement exceeds target (0.10)")
        else:
            recommendations.append("⚠️ **Model needs improvement**: R² improvement below target. Consider:")
            recommendations.append("  - Refining GAR component calculations")
            recommendations.append("  - Improving QoC adjustment logic")
            recommendations.append("  - Adding additional features")
    
    if len(df_qoc) > 0:
        best_strength = df_qoc.loc[df_qoc['avg_r2'].idxmax(), 'qoc_strength']
        recommendations.append(f"✅ **Use QoC strength {best_strength}** in production (optimal setting)")
    
    if len(df_stability) > 0:
        all_passed = all([
            df_stability[df_stability['metric'] == m]['correlation'].mean() >= 
            df_stability[df_stability['metric'] == m]['threshold'].iloc[0]
            for m in df_stability['metric'].unique()
        ])
        if all_passed:
            recommendations.append("✅ **All metrics meet stability thresholds**: Model measures true talent")
        else:
            recommendations.append("⚠️ **Some metrics below stability thresholds**: Consider:")
            recommendations.append("  - Adjusting Bayesian regression constants")
            recommendations.append("  - Increasing sample size requirements")
    
    if not recommendations:
        recommendations.append("⚠️ **Run all validation tests** to generate recommendations")
    
    for rec in recommendations:
        report_lines.append(rec)
    
    report_lines.append("")
    report_lines.append("---")
    report_lines.append("")
    report_lines.append("## Next Steps")
    report_lines.append("")
    report_lines.append("1. Review all validation results above")
    report_lines.append("2. Apply recommended QoC adjustment strength to production")
    report_lines.append("3. Monitor model performance in production")
    report_lines.append("4. Re-run validation tests periodically as new data becomes available")
    report_lines.append("")
    
    # Write report
    report_content = "\n".join(report_lines)
    output_file = 'BACKTEST_REPORT.md'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    print(f"✅ Generated comprehensive report: {output_file}")
    print(f"   Report includes:")
    print(f"   - Executive summary")
    print(f"   - Predictive power results")
    print(f"   - QoC tuning recommendations")
    print(f"   - Stability validation results")
    print(f"   - Production recommendations")
    
    return output_file

def main():
    """Main function."""
    output_file = generate_report()
    print(f"\n📊 Report saved to: {output_file}")

if __name__ == "__main__":
    main()

