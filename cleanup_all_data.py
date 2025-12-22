#!/usr/bin/env python3
"""
Comprehensive cleanup script to delete all corrupted data from raw_shots and all downstream analytics tables.
This ensures a clean slate before rebuilding the pipeline from scratch.
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

# Tables to clean (in dependency order - clean downstream first, then source)
# Note: raw_shots can be cleaned manually via Supabase dashboard for faster deletion
TABLES_TO_CLEAN = [
    # Downstream analytics tables (clean first)
    'player_projected_stats',
    'player_projections',
    'player_talent_metrics',
    'player_gar_components',
    'player_toi_by_situation',
    'goalie_gsax',
    'staging_2025_skaters',  # If exists
    # Source data table (clean last - can be done manually if needed)
    # 'raw_shots',  # Commented out - can be deleted manually via Supabase dashboard
]

def cleanup_table(table_name: str) -> int:
    """
    Delete all records from a table.
    
    Args:
        table_name: Name of the table to clean
        
    Returns:
        Number of records deleted
    """
    try:
        # Check if table exists and get count
        try:
            response = supabase.table(table_name).select('id', count='exact').limit(1).execute()
            count = response.count if hasattr(response, 'count') else 0
            if response.data:
                # Try to get actual count
                count_response = supabase.table(table_name).select('*', count='exact').limit(1).execute()
                count = count_response.count if hasattr(count_response, 'count') else 0
        except Exception as e:
            # Table might not exist or have different structure
            print(f"  [WARNING] Could not check count for {table_name}: {e}")
            count = 0
        
        if count == 0:
            print(f"  [OK] {table_name}: No records to delete")
            return 0
        
        print(f"  Found {count:,} records in {table_name}")
        print(f"  Deleting records from {table_name}...")
        
        # Delete in batches
        deleted_count = 0
        batch_size = 1000
        offset = 0
        
        while True:
            # Get a batch of records
            try:
                # Try to get IDs - different tables might have different primary key names
                response = supabase.table(table_name).select('*').range(offset, offset + batch_size - 1).execute()
                
                if not response.data or len(response.data) == 0:
                    break
                
                # Delete each record in the batch
                for record in response.data:
                    # Try different possible ID fields
                    record_id = None
                    for id_field in ['id', 'player_id', 'goalie_id', f'{table_name}_id']:
                        if id_field in record:
                            record_id = record[id_field]
                            break
                    
                    if record_id is None:
                        # Try composite key deletion
                        if table_name == 'goalie_gsax':
                            # Composite key: goalie_id, season
                            try:
                                supabase.table(table_name).delete().eq('goalie_id', record.get('goalie_id')).eq('season', record.get('season', 2025)).execute()
                                deleted_count += 1
                            except:
                                pass
                        elif table_name == 'player_projected_stats':
                            # Composite key: player_id, game_id, season
                            try:
                                supabase.table(table_name).delete().eq('player_id', record.get('player_id')).eq('game_id', record.get('game_id')).eq('season', record.get('season', 2025)).execute()
                                deleted_count += 1
                            except:
                                pass
                        elif table_name == 'player_projections':
                            # Composite key: player_id, game_id, season
                            try:
                                supabase.table(table_name).delete().eq('player_id', record.get('player_id')).eq('game_id', record.get('game_id')).eq('season', record.get('season', 2025)).execute()
                                deleted_count += 1
                            except:
                                pass
                        else:
                            print(f"    [WARNING] Could not find ID field for record in {table_name}")
                        continue
                    
                    # Delete by ID
                    try:
                        supabase.table(table_name).delete().eq('id', record_id).execute()
                        deleted_count += 1
                    except Exception as e:
                        # Try alternative deletion methods
                        if 'id' in record:
                            try:
                                supabase.table(table_name).delete().eq('id', record['id']).execute()
                                deleted_count += 1
                            except:
                                pass
                
                if len(response.data) < batch_size:
                    break
                
                offset += batch_size
                if deleted_count % 5000 == 0:
                    print(f"    Deleted {deleted_count:,} records...")
                    
            except Exception as e:
                print(f"    [WARNING] Error deleting batch: {e}")
                break
        
        print(f"  [OK] Deleted {deleted_count:,} records from {table_name}")
        return deleted_count
        
    except Exception as e:
        if "does not exist" in str(e) or "relation" in str(e).lower():
            print(f"  [OK] {table_name}: Table does not exist (skipping)")
            return 0
        else:
            print(f"  [ERROR] Error cleaning {table_name}: {e}")
            return 0

def cleanup_all_data():
    """Delete all records from all analytics tables."""
    print("=" * 80)
    print("COMPREHENSIVE DATA CLEANUP")
    print("=" * 80)
    print("This will delete ALL records from the following tables:")
    for table in TABLES_TO_CLEAN:
        print(f"  - {table}")
    print()
    print("NOTE: raw_shots table is NOT included (can be deleted manually via Supabase dashboard)")
    print("      If you haven't deleted raw_shots yet, you can do so now via SQL:")
    print("      DELETE FROM raw_shots;")
    print()
    print("WARNING: This action cannot be undone!")
    print()
    
    total_deleted = 0
    
    for table_name in TABLES_TO_CLEAN:
        print(f"\nCleaning {table_name}...")
        deleted = cleanup_table(table_name)
        total_deleted += deleted
    
    print("\n" + "=" * 80)
    print("CLEANUP COMPLETE")
    print("=" * 80)
    print(f"Total records deleted: {total_deleted:,}")
    print("\n[OK] All tables cleaned. Ready for fresh data scraping.")
    print("Next step: Run 'python pull_season_data.py 2025-10-07' to scrape fresh data")

if __name__ == "__main__":
    confirm = input("\n⚠️  This will delete ALL data from all analytics tables. Type 'DELETE ALL' to confirm: ")
    if confirm == "DELETE ALL":
        cleanup_all_data()
    else:
        print("❌ Cleanup cancelled")

