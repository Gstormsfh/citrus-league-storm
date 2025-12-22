#!/usr/bin/env python3
"""
Clean up contaminated GSAx data from goalie_gsax table.
This script deletes all existing GSAx records so we can recalculate with 2025-only data.
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

def cleanup_gsax_data():
    """Delete all GSAx records from the database."""
    print("=" * 80)
    print("CLEANING UP GSAX DATA")
    print("=" * 80)
    
    # Count existing records
    try:
        count_response = supabase.table('goalie_gsax').select('goalie_id', count='exact').execute()
        existing_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data) if count_response.data else 0
    except Exception as e:
        print(f"⚠️  Error counting records: {e}")
        # Try alternative approach
        all_records = supabase.table('goalie_gsax').select('goalie_id').execute()
        existing_count = len(all_records.data) if all_records.data else 0
    
    print(f"Found {existing_count} existing GSAx records")
    
    if existing_count == 0:
        print("✅ No records to delete. Database is already clean.")
        return
    
    # Delete all records using batch deletion
    # More efficient: delete by fetching all unique (goalie_id, season) pairs and deleting them
    deleted_count = 0
    batch_size = 100
    
    print(f"\nDeleting records in batches of {batch_size}...")
    
    while True:
        # Get a batch of records to delete
        try:
            response = supabase.table('goalie_gsax').select('goalie_id, season').limit(batch_size).execute()
            
            if not response.data or len(response.data) == 0:
                break
            
            # Delete each record by composite key
            for record in response.data:
                try:
                    goalie_id = record['goalie_id']
                    season = record.get('season', 2025)
                    
                    delete_response = supabase.table('goalie_gsax').delete().eq('goalie_id', goalie_id).eq('season', season).execute()
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️  Error deleting goalie_id {goalie_id}, season {season}: {e}")
            
            print(f"  Deleted {deleted_count}/{existing_count} records...")
            
            # If we got fewer records than batch_size, we're done
            if len(response.data) < batch_size:
                break
                
        except Exception as e:
            print(f"⚠️  Error fetching batch: {e}")
            break
    
    print(f"\n✅ Successfully deleted {deleted_count} GSAx records")
    print("   Database is now clean and ready for 2025-only recalculation")
    
    # Verify deletion
    try:
        verify_response = supabase.table('goalie_gsax').select('goalie_id', count='exact').execute()
        remaining = verify_response.count if hasattr(verify_response, 'count') else len(verify_response.data) if verify_response.data else 0
        if remaining == 0:
            print("✅ Verification: All records successfully deleted")
        else:
            print(f"⚠️  Warning: {remaining} records still remain in database")
    except Exception as e:
        print(f"⚠️  Could not verify deletion: {e}")

if __name__ == "__main__":
    confirm = input("⚠️  This will delete ALL GSAx data. Type 'DELETE' to confirm: ")
    if confirm == "DELETE":
        cleanup_gsax_data()
    else:
        print("❌ Cleanup cancelled")



