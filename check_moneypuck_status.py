#!/usr/bin/env python3
"""Quick status check for MoneyPuck data loading"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('VITE_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

print("=" * 80)
print("MONEYPUCK DATA LOADING STATUS")
print("=" * 80)

# Check 2023 season
try:
    r2023 = supabase.table('raw_shots').select('id', count='exact').eq('season', 2023).limit(1).execute()
    count_2023 = r2023.count if hasattr(r2023, 'count') else len(r2023.data) if r2023.data else 0
    print(f"✅ 2023 season shots: {count_2023:,}")
except Exception as e:
    print(f"❌ Error checking 2023: {e}")

# Check 2024 season
try:
    r2024 = supabase.table('raw_shots').select('id', count='exact').eq('season', 2024).limit(1).execute()
    count_2024 = r2024.count if hasattr(r2024, 'count') else len(r2024.data) if r2024.data else 0
    print(f"✅ 2024 season shots: {count_2024:,}")
except Exception as e:
    print(f"❌ Error checking 2024: {e}")

# Expected counts from MoneyPuck files
print(f"\nExpected from MoneyPuck:")
print(f"  2023: ~122,472 shots")
print(f"  2024: (checking file...)")

import pandas as pd
try:
    df2024 = pd.read_csv('data/moneypuck_shots_2024.csv', nrows=1)
    total_2024 = sum(1 for _ in open('data/moneypuck_shots_2024.csv')) - 1  # -1 for header
    print(f"  2024: ~{total_2024:,} shots")
except:
    print(f"  2024: File not found or error reading")

print("\n" + "=" * 80)

