#!/usr/bin/env python3
"""
backtest_predictive_power.py
Validate predictive power of the model using split-sample approach.

Methodology:
- Use Season N GAR components and GSAx to predict Season N+1 performance
- Compare predicted vs actual goals per game
- Calculate R², MAE, and RMSE
- Compare against baseline model

Success Criteria:
- Model R² > Baseline R² + 0.10
- MAE < 0.15 goals per game (reasonable for fantasy projections)
"""

import pandas as pd
import numpy as np
from scipy.stats import pearsonr
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, List, Optional, Tuple
from season_utils import get_season_label
from baseline_model import predict_baseline, get_actual_performance
from apply_qoc_adjustments import load_gar_components, apply_qoc_to_projections

load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)


def load_gsax_for_season(season: int) -> pd.DataFrame:
    """
    Load GSAx data for a season.
    
    Args:
        season: Season year
    
    Returns:
        DataFrame with goalie_id, regressed_gsax, season
    """
    try:
        response = supabase.table('goalie_gsax').select(
            'goalie_id, regressed_gsax, season'
        ).eq('season', season).execute()
        
        if not response.data:
            return pd.DataFrame()
        
        return pd.DataFrame(response.data)
        
    except Exception as e:
        print(f"  WARNING: Error loading GSAx for season {season}: {e}")
        return pd.DataFrame()


def get_player_base_xg(player_id: int, season: int) -> float:
    """
    Get player's base talent-adjusted xG per game for a season.
    
    Args:
        player_id: Player ID
        season: Season year
    
    Returns:
        Average xG per game
    """
    try:
        response = supabase.table('raw_shots').select(
            'shooting_talent_adjusted_xg, game_id'
        ).eq('player_id', player_id).eq('season', season).execute()
        
        if not response.data:
            return 0.0
        
        df = pd.DataFrame(response.data)
        df['shooting_talent_adjusted_xg'] = pd.to_numeric(
            df['shooting_talent_adjusted_xg'], errors='coerce'
        ).fillna(0.0)
        
        total_xg = df['shooting_talent_adjusted_xg'].sum()
        unique_games = df['game_id'].nunique()
        
        if unique_games == 0:
            return 0.0
        
        return total_xg / unique_games
        
    except Exception as e:
        print(f"  WARNING: Error getting base xG for player {player_id}: {e}")
        return 0.0


def predict_player_performance(player_id: int, training_season: int, 
                               prediction_season: int) -> Dict[str, float]:
    """
    Predict player performance using GAR components and QoC adjustments.
    
    Args:
        player_id: Player ID
        training_season: Season to use for GAR components (Season N)
        prediction_season: Season to predict (Season N+1)
    
    Returns:
        Dictionary with predicted goals per game
    """
    # Get player's GAR components from training season
    df_gar = load_gar_components([player_id], season=training_season)
    
    if len(df_gar) == 0:
        # No GAR data - use baseline
        return {
            'predicted_goals_per_game': 0.0,
            'base_xg_per_game': 0.0,
            'qoc_adjustment': 1.0,
            'has_gar_data': False
        }
    
    player_gar = df_gar.iloc[0]
    
    # Get base xG from training season (as proxy for talent)
    base_xg_per_game = get_player_base_xg(player_id, training_season)
    
    # For QoC adjustment, we'd need opponent team data for prediction season
    # For now, apply a simple adjustment based on player's EVO vs league average EVD
    # In full implementation, would get actual opponent matchups
    
    # Simple QoC adjustment: (Player EVO - League Avg EVD) * adjustment_strength
    evo_rate = player_gar.get('evo_rate_regressed', 0.0)
    
    # Get league average EVD (simplified - would use actual opponent teams)
    # For now, use a fixed league average (would be calculated from all players)
    league_avg_evd = 1.5  # Placeholder - should be calculated from data
    
    qoc_adjustment = 1.0 + (evo_rate - league_avg_evd) * 0.1  # 10% adjustment strength
    qoc_adjustment = max(0.8, min(1.2, qoc_adjustment))  # Cap at ±20%
    
    # Predicted goals = base xG * QoC adjustment
    # Note: In reality, xG to goals conversion varies, but for simplicity we use xG as proxy
    predicted_goals_per_game = base_xg_per_game * qoc_adjustment
    
    return {
        'predicted_goals_per_game': predicted_goals_per_game,
        'base_xg_per_game': base_xg_per_game,
        'qoc_adjustment': qoc_adjustment,
        'has_gar_data': True
    }


def run_predictive_test(training_season: int, prediction_season: int, 
                       min_games: int = 10) -> pd.DataFrame:  # Lowered to 10 for testing
    """
    Run predictive power test for a season pair.
    
    Args:
        training_season: Season N (for training data)
        prediction_season: Season N+1 (to predict)
        min_games: Minimum games played to include player
    
    Returns:
        DataFrame with predictions and actuals
    """
    print(f"\n{'='*80}")
    print(f"PREDICTIVE POWER TEST: {get_season_label(training_season)} → {get_season_label(prediction_season)}")
    print(f"{'='*80}")
    
    # Get players who played in both seasons
    print("  Loading player data...")
    
    # Get players from prediction season
    try:
        response = supabase.table('raw_shots').select(
            'player_id, game_id, is_goal'
        ).eq('season', prediction_season).execute()
        
        if not response.data:
            print(f"  WARNING: No data for prediction season {prediction_season}")
            return pd.DataFrame()
        
        df_pred = pd.DataFrame(response.data)
        df_pred['is_goal'] = pd.to_numeric(df_pred['is_goal'], errors='coerce').fillna(0)
        
        # Calculate actual goals per game
        player_stats = df_pred.groupby('player_id').agg(
            total_goals=('is_goal', 'sum'),
            games_played=('game_id', 'nunique')
        ).reset_index()
        
        player_stats['actual_goals_per_game'] = player_stats['total_goals'] / player_stats['games_played']
        
        # Filter by minimum games
        player_stats = player_stats[player_stats['games_played'] >= min_games].copy()
        
        print(f"  Found {len(player_stats):,} players with >= {min_games} games")
        
    except Exception as e:
        print(f"  ERROR: Failed to load prediction season data: {e}")
        return pd.DataFrame()
    
    # Get predictions for each player
    print("  Generating predictions...")
    predictions = []
    
    for _, row in player_stats.iterrows():
        player_id = int(row['player_id'])
        
        # Model prediction
        model_pred = predict_player_performance(
            player_id, training_season, prediction_season
        )
        
        # Baseline prediction
        baseline_pred = predict_baseline(player_id, prediction_season, method='last_season')
        
        predictions.append({
            'player_id': player_id,
            'actual_goals_per_game': row['actual_goals_per_game'],
            'games_played': row['games_played'],
            'model_predicted_goals_per_game': model_pred['predicted_goals_per_game'],
            'baseline_predicted_goals_per_game': baseline_pred,
            'base_xg_per_game': model_pred['base_xg_per_game'],
            'qoc_adjustment': model_pred['qoc_adjustment'],
            'has_gar_data': model_pred['has_gar_data']
        })
    
    df_results = pd.DataFrame(predictions)
    
    print(f"  Generated predictions for {len(df_results):,} players")
    
    return df_results


def calculate_metrics(df_results: pd.DataFrame) -> Dict[str, float]:
    """
    Calculate R², MAE, and RMSE for model and baseline.
    
    Args:
        df_results: DataFrame with predictions and actuals
    
    Returns:
        Dictionary with metrics
    """
    if len(df_results) == 0:
        return {}
    
    actual = df_results['actual_goals_per_game'].values
    model_pred = df_results['model_predicted_goals_per_game'].values
    baseline_pred = df_results['baseline_predicted_goals_per_game'].values
    
    # Filter out invalid predictions
    valid_mask = (
        np.isfinite(actual) & 
        np.isfinite(model_pred) & 
        np.isfinite(baseline_pred) &
        (model_pred >= 0) & 
        (baseline_pred >= 0)
    )
    
    if valid_mask.sum() == 0:
        return {}
    
    actual_valid = actual[valid_mask]
    model_pred_valid = model_pred[valid_mask]
    baseline_pred_valid = baseline_pred[valid_mask]
    
    # Model metrics
    model_r2 = r2_score(actual_valid, model_pred_valid)
    model_mae = mean_absolute_error(actual_valid, model_pred_valid)
    model_rmse = np.sqrt(mean_squared_error(actual_valid, model_pred_valid))
    model_corr, _ = pearsonr(actual_valid, model_pred_valid)
    
    # Baseline metrics
    baseline_r2 = r2_score(actual_valid, baseline_pred_valid)
    baseline_mae = mean_absolute_error(actual_valid, baseline_pred_valid)
    baseline_rmse = np.sqrt(mean_squared_error(actual_valid, baseline_pred_valid))
    baseline_corr, _ = pearsonr(actual_valid, baseline_pred_valid)
    
    return {
        'n_players': len(actual_valid),
        'model_r2': model_r2,
        'model_mae': model_mae,
        'model_rmse': model_rmse,
        'model_correlation': model_corr,
        'baseline_r2': baseline_r2,
        'baseline_mae': baseline_mae,
        'baseline_rmse': baseline_rmse,
        'baseline_correlation': baseline_corr,
        'r2_improvement': model_r2 - baseline_r2,
        'mae_improvement': baseline_mae - model_mae,  # Positive = better (lower MAE)
        'rmse_improvement': baseline_rmse - model_rmse,  # Positive = better (lower RMSE)
    }


def main():
    """
    Main function to run predictive power tests across multiple season pairs.
    """
    print("=" * 80)
    print("PREDICTIVE POWER VALIDATION")
    print("=" * 80)
    print(f"Started at: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test season pairs (Season N predicts Season N+1)
    # Use available seasons - check what we have in the database
    season_pairs = [
        (2023, 2024),  # Use available seasons
        # Add more pairs as historical data becomes available
        # (2021, 2022),
        # (2022, 2023),
        # (2024, 2025),  # Current season - may not have complete data
    ]
    
    all_results = []
    
    for training_season, prediction_season in season_pairs:
        try:
            # Run test
            df_results = run_predictive_test(training_season, prediction_season)
            
            if len(df_results) == 0:
                print(f"  ⚠️  Skipping {get_season_label(training_season)} → {get_season_label(prediction_season)} (no data)")
                continue
            
            # Calculate metrics
            metrics = calculate_metrics(df_results)
            
            if not metrics:
                print(f"  ⚠️  No valid predictions for {get_season_label(training_season)} → {get_season_label(prediction_season)}")
                continue
            
            metrics['training_season'] = training_season
            metrics['prediction_season'] = prediction_season
            all_results.append(metrics)
            
            # Print results
            print(f"\n  Results for {get_season_label(training_season)} → {get_season_label(prediction_season)}:")
            print(f"    Players: {metrics['n_players']:,}")
            print(f"    Model R²: {metrics['model_r2']:.4f}")
            print(f"    Baseline R²: {metrics['baseline_r2']:.4f}")
            print(f"    R² Improvement: {metrics['r2_improvement']:+.4f}")
            print(f"    Model MAE: {metrics['model_mae']:.4f} goals/game")
            print(f"    Baseline MAE: {metrics['baseline_mae']:.4f} goals/game")
            print(f"    MAE Improvement: {metrics['mae_improvement']:+.4f} goals/game")
            
            # Save detailed results
            output_file = f'predictive_power_{training_season}_{prediction_season}.csv'
            df_results.to_csv(output_file, index=False)
            print(f"    Saved detailed results to {output_file}")
            
        except Exception as e:
            print(f"  ❌ Error testing {get_season_label(training_season)} → {get_season_label(prediction_season)}: {e}")
            import traceback
            traceback.print_exc()
    
    # Summary
    if all_results:
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        
        df_summary = pd.DataFrame(all_results)
        
        avg_model_r2 = df_summary['model_r2'].mean()
        avg_baseline_r2 = df_summary['baseline_r2'].mean()
        avg_r2_improvement = df_summary['r2_improvement'].mean()
        avg_mae = df_summary['model_mae'].mean()
        
        print(f"\n  Average Model R²: {avg_model_r2:.4f}")
        print(f"  Average Baseline R²: {avg_baseline_r2:.4f}")
        print(f"  Average R² Improvement: {avg_r2_improvement:+.4f}")
        print(f"  Average Model MAE: {avg_mae:.4f} goals/game")
        
        # Success criteria
        print(f"\n  Success Criteria:")
        print(f"    R² Improvement > 0.10: {'✅' if avg_r2_improvement > 0.10 else '❌'} ({avg_r2_improvement:+.4f})")
        print(f"    MAE < 0.15: {'✅' if avg_mae < 0.15 else '❌'} ({avg_mae:.4f})")
        
        # Save summary
        summary_file = 'predictive_power_summary.csv'
        df_summary.to_csv(summary_file, index=False)
        print(f"\n  Saved summary to {summary_file}")
    else:
        print("\n  ⚠️  No results generated. Check data availability.")
    
    print(f"\nCompleted at: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()

