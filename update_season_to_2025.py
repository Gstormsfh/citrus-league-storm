#!/usr/bin/env python3
"""
Update existing raw_shots records from season=2024 to season=2025.
This fixes the season labeling issue where current season data was incorrectly labeled.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Supabase credentials not found")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

def update_season_to_2025():
    """Update all season=2024 records to season=2025 for current season data."""
    print("=" * 80)
    print("UPDATING SEASON LABELS TO 2025")
    print("=" * 80)
    
    # Count existing records
    try:
        count_2024 = supabase.table('raw_shots').select('game_id', count='exact').eq('season', 2024).execute()
        count_2025 = supabase.table('raw_shots').select('game_id', count='exact').eq('season', 2025).execute()
        
        existing_2024 = count_2024.count if hasattr(count_2024, 'count') else len(count_2024.data) if count_2024.data else 0
        existing_2025 = count_2025.count if hasattr(count_2025, 'count') else len(count_2025.data) if count_2025.data else 0
    except Exception as e:
        print(f"[WARNING] Error counting records: {e}")
        # Try alternative approach
        all_2024 = supabase.table('raw_shots').select('game_id').eq('season', 2024).limit(1).execute()
        all_2025 = supabase.table('raw_shots').select('game_id').eq('season', 2025).limit(1).execute()
        existing_2024 = len(all_2024.data) if all_2024.data else 0
        existing_2025 = len(all_2025.data) if all_2025.data else 0
    
    print(f"\nCurrent state:")
    print(f"   Records with season=2024: {existing_2024:,}")
    print(f"   Records with season=2025: {existing_2025:,}")
    
    if existing_2024 == 0:
        print("\n[OK] No records with season=2024 found. Database is already correct.")
        return
    
    # Update records in batches
    print(f"\nUpdating {existing_2024:,} records from season=2024 to season=2025...")
    print("(This may take a few minutes for large datasets)")
    
    updated_count = 0
    batch_size = 1000
    offset = 0
    
    while True:
        try:
            # Get a batch of records to update
            response = supabase.table('raw_shots').select('id, game_id, season').eq('season', 2024).range(offset, offset + batch_size - 1).execute()
            
            if not response.data or len(response.data) == 0:
                break
            
            # Update each record
            for record in response.data:
                try:
                    # Use update with the record's id
                    update_response = supabase.table('raw_shots').update({'season': 2025}).eq('id', record['id']).execute()
                    updated_count += 1
                except Exception as e:
                    print(f"[WARNING] Error updating record id {record.get('id')}: {e}")
            
            print(f"  Updated {updated_count:,}/{existing_2024:,} records...")
            
            # If we got fewer records than batch_size, we're done
            if len(response.data) < batch_size:
                break
            
            offset += batch_size
            
        except Exception as e:
            print(f"[WARNING] Error fetching batch: {e}")
            break
    
    print(f"\n[OK] Successfully updated {updated_count:,} records to season=2025")
    
    # Verify update
    try:
        verify_2024 = supabase.table('raw_shots').select('game_id', count='exact').eq('season', 2024).execute()
        verify_2025 = supabase.table('raw_shots').select('game_id', count='exact').eq('season', 2025).execute()
        
        remaining_2024 = verify_2024.count if hasattr(verify_2024, 'count') else len(verify_2024.data) if verify_2024.data else 0
        new_2025 = verify_2025.count if hasattr(verify_2025, 'count') else len(verify_2025.data) if verify_2025.data else 0
        
        print(f"\nVerification:")
        print(f"   Records with season=2024: {remaining_2024:,}")
        print(f"   Records with season=2025: {new_2025:,}")
        
        if remaining_2024 == 0:
            print("[OK] All records successfully updated to season=2025")
        else:
            print(f"[WARNING] {remaining_2024:,} records still have season=2024")
    except Exception as e:
        print(f"[WARNING] Could not verify update: {e}")

if __name__ == "__main__":
    confirm = input("This will update all season=2024 records to season=2025. Type 'UPDATE' to confirm: ")
    if confirm == "UPDATE":
        update_season_to_2025()
    else:
        print("Update cancelled")



