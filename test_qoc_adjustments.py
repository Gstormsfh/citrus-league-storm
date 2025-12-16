#!/usr/bin/env python3
"""
test_qoc_adjustments.py
Test script to validate QoC adjustments are working correctly.
"""

import pandas as pd
from apply_qoc_adjustments import (
    load_gar_components,
    get_opponent_team_gar,
    calculate_qoc_adjustment,
    apply_qoc_to_projections
)

def test_team_gar_aggregation():
    """Test that team GAR aggregation works."""
    print("=" * 80)
    print("TEST 1: TEAM GAR AGGREGATION")
    print("=" * 80)
    
    # Test with a known team (use a team ID from player_shifts)
    # Get a real team_id from the data
    from apply_qoc_adjustments import supabase
    try:
        result = supabase.table('player_shifts').select('team_id').limit(100).execute()
        team_ids = list(set([r['team_id'] for r in result.data if r.get('team_id')]))
        test_team_id = team_ids[0] if team_ids else 1
    except:
        test_team_id = 6  # Fallback
    
    print(f"\nTesting team_id = {test_team_id}")
    
    evd_avg = get_opponent_team_gar(test_team_id, 'evd', season=2025)
    evo_avg = get_opponent_team_gar(test_team_id, 'evo', season=2025)
    ppd_avg = get_opponent_team_gar(test_team_id, 'ppd', season=2025)
    ppo_avg = get_opponent_team_gar(test_team_id, 'ppo', season=2025)
    
    print(f"  Team EVD average: {evd_avg:.4f}")
    print(f"  Team EVO average: {evo_avg:.4f}")
    print(f"  Team PPD average: {ppd_avg:.4f}")
    print(f"  Team PPO average: {ppo_avg:.4f}")
    
    if evd_avg == 0.0 and evo_avg == 0.0:
        print("  WARNING: All team averages are 0.0 - may indicate no players found for this team")
    else:
        print("  OK: Team GAR aggregation is working")
    
    return evd_avg > 0 or evo_avg > 0


def test_qoc_calculation():
    """Test QoC adjustment calculation."""
    print("\n" + "=" * 80)
    print("TEST 2: QoC ADJUSTMENT CALCULATION")
    print("=" * 80)
    
    # Load GAR components
    df_gar = load_gar_components(season=2025)
    
    if len(df_gar) == 0:
        print("  ERROR: No GAR components found. Run calculate_gar_regression.py first.")
        return False
    
    print(f"  Loaded GAR components for {len(df_gar):,} players")
    
    # Get a sample player
    sample_player = df_gar.iloc[0]
    player_id = int(sample_player['player_id'])
    
    print(f"\n  Testing with player_id = {player_id}")
    print(f"    EVO rate: {sample_player.get('evo_rate_regressed', 0.0):.4f}")
    print(f"    EVD rate: {sample_player.get('evd_rate_regressed', 0.0):.4f}")
    print(f"    PPO rate: {sample_player.get('ppo_rate_regressed', 0.0):.4f}")
    print(f"    PPD rate: {sample_player.get('ppd_rate_regressed', 0.0):.4f}")
    
    # Test with a known opponent team (get from data)
    try:
        result = supabase.table('player_shifts').select('team_id').limit(100).execute()
        team_ids = list(set([r['team_id'] for r in result.data if r.get('team_id')]))
        test_opponent_team_id = team_ids[1] if len(team_ids) > 1 else team_ids[0] if team_ids else 2
    except:
        test_opponent_team_id = 28  # Fallback
    
    print(f"\n  Testing against opponent_team_id = {test_opponent_team_id}")
    
    # Test 5v5 adjustment
    qoc_5v5 = calculate_qoc_adjustment(
        player_id, test_opponent_team_id, '5v5', df_gar, season=2025
    )
    print(f"    5v5 QoC adjustment: {qoc_5v5:.4f} (multiplier)")
    
    # Test PP adjustment
    qoc_pp = calculate_qoc_adjustment(
        player_id, test_opponent_team_id, 'PP', df_gar, season=2025
    )
    print(f"    PP QoC adjustment: {qoc_pp:.4f} (multiplier)")
    
    # Test PK adjustment
    qoc_pk = calculate_qoc_adjustment(
        player_id, test_opponent_team_id, 'PK', df_gar, season=2025
    )
    print(f"    PK QoC adjustment: {qoc_pk:.4f} (multiplier)")
    
    # Validate adjustments are reasonable (0.8 to 1.2 range)
    all_reasonable = (
        0.8 <= qoc_5v5 <= 1.2 and
        0.8 <= qoc_pp <= 1.2 and
        0.8 <= qoc_pk <= 1.2
    )
    
    if all_reasonable:
        print("  OK: QoC adjustments are within reasonable range (0.8-1.2)")
    else:
        print("  WARNING: Some QoC adjustments are outside expected range")
    
    return all_reasonable


def test_end_to_end():
    """Test end-to-end QoC application."""
    print("\n" + "=" * 80)
    print("TEST 3: END-TO-END QoC APPLICATION")
    print("=" * 80)
    
    # Create sample projections
    df_gar = load_gar_components(season=2025)
    
    if len(df_gar) == 0:
        print("  ERROR: No GAR components found.")
        return False
    
    # Get a few sample players
    sample_players = df_gar.head(5)
    player_ids = sample_players['player_id'].tolist()
    
    # Get opponent team ID (get from data)
    from apply_qoc_adjustments import get_team_id_from_players, supabase
    try:
        result = supabase.table('player_shifts').select('team_id').limit(100).execute()
        team_ids = list(set([r['team_id'] for r in result.data if r.get('team_id')]))
        test_opponent_team_id = team_ids[1] if len(team_ids) > 1 else team_ids[0] if team_ids else 2
    except:
        test_opponent_team_id = 28  # Fallback
    
    # Create test projections
    df_projections = pd.DataFrame({
        'player_id': player_ids,
        'opponent_team_id': [test_opponent_team_id] * len(player_ids),
        'situation': ['5v5'] * len(player_ids),
        'base_xg': [0.5] * len(player_ids)  # Sample base xG
    })
    
    print(f"  Created {len(df_projections)} test projections")
    print(f"  Applying QoC adjustments...")
    
    # Apply QoC
    df_adjusted = apply_qoc_to_projections(df_projections, season=2025)
    
    print(f"\n  Results:")
    print(f"    Average adjustment factor: {df_adjusted['qoc_adjustment_factor'].mean():.4f}")
    print(f"    Adjustment range: [{df_adjusted['qoc_adjustment_factor'].min():.4f}, {df_adjusted['qoc_adjustment_factor'].max():.4f}]")
    print(f"    Average adjusted xG: {df_adjusted['adjusted_xg'].mean():.4f}")
    
    # Validate
    all_valid = (
        df_adjusted['qoc_adjustment_factor'].min() >= 0.8 and
        df_adjusted['qoc_adjustment_factor'].max() <= 1.2 and
        df_adjusted['adjusted_xg'].min() >= 0
    )
    
    if all_valid:
        print("  OK: End-to-end QoC application is working")
    else:
        print("  WARNING: Some results are outside expected ranges")
    
    return all_valid


def main():
    """Run all QoC tests."""
    print("=" * 80)
    print("QoC ADJUSTMENTS VALIDATION TESTS")
    print("=" * 80)
    
    test1_ok = test_team_gar_aggregation()
    test2_ok = test_qoc_calculation()
    test3_ok = test_end_to_end()
    
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    all_passed = test1_ok and test2_ok and test3_ok
    
    if all_passed:
        print("✅ ALL TESTS PASSED")
        print("\nQoC adjustments are ready for production use")
    else:
        print("❌ SOME TESTS FAILED")
        print("\nPlease review the warnings above")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

