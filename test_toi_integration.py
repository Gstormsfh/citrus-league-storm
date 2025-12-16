#!/usr/bin/env python3
"""
Test Phase 1C: Official Shift Data Integration with Running Game Clock
"""

import sys
from calculate_player_toi import process_game_shifts

# Test with the game we used for API verification
test_game_id = 2025020021

print("="*80)
print("PHASE 1C: TESTING OFFICIAL SHIFT DATA INTEGRATION")
print("="*80)
print(f"Test Game ID: {test_game_id}")
print()

try:
    shifts, toi_records = process_game_shifts(test_game_id)
    
    print()
    print("="*80)
    print("RESULTS")
    print("="*80)
    print(f"✅ Processed {len(shifts)} shifts")
    print(f"✅ Generated {len(toi_records)} TOI records")
    
    if shifts:
        print(f"\n📋 Sample Shift (first of {len(shifts)}):")
        sample = shifts[0]
        print(f"   Player ID: {sample.get('player_id')}")
        print(f"   Period: {sample.get('period')}")
        print(f"   Start (period time): {sample.get('shift_start_time_seconds'):.1f}s")
        print(f"   End (period time): {sample.get('shift_end_time_seconds'):.1f}s")
        print(f"   Start (game clock): {sample.get('shift_start_game_clock'):.1f}s ({sample.get('shift_start_game_clock')/60:.2f} min)")
        print(f"   End (game clock): {sample.get('shift_end_game_clock'):.1f}s ({sample.get('shift_end_game_clock')/60:.2f} min)")
        print(f"   Situation: {sample.get('situation')}")
        print(f"   Duration: {sample.get('duration_seconds'):.1f}s")
    
    if toi_records:
        print(f"\n📊 Sample TOI Record (first of {len(toi_records)}):")
        sample_toi = toi_records[0]
        print(f"   Player ID: {sample_toi.get('player_id')}")
        print(f"   Situation: {sample_toi.get('situation')}")
        print(f"   TOI: {sample_toi.get('toi_seconds'):.1f}s ({sample_toi.get('toi_minutes'):.2f} min)")
        
        # Show breakdown by situation
        print(f"\n📈 TOI Breakdown by Situation:")
        situation_totals = {}
        for record in toi_records:
            sit = record.get('situation', 'Unknown')
            if sit not in situation_totals:
                situation_totals[sit] = 0.0
            situation_totals[sit] += record.get('toi_seconds', 0.0)
        
        for sit, total in sorted(situation_totals.items()):
            print(f"   {sit}: {total:.1f}s ({total/60:.2f} min)")
    
    print(f"\n✅ Phase 1C Integration Test: SUCCESS")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

