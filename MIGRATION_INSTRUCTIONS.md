# Migration Instructions: Add default_team_name to profiles

## Quick Fix

The `default_team_name` column needs to be added to the `profiles` table in your Supabase database.

## Step 1: Apply the Migration

### Via Supabase Dashboard (Recommended)

1. **Navigate to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Migration SQL**
   - Open the file: `supabase/migrations/20250101000015_add_default_team_name.sql`
   - Copy the entire contents:
   ```sql
   -- Add default_team_name field to profiles table
   alter table if exists public.profiles
   add column if not exists default_team_name text;
   ```
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - You should see a success message

5. **Verify the Column**
   - Go to "Table Editor" in the left sidebar
   - Select the `profiles` table
   - You should see `default_team_name` in the list of columns

### Via Supabase CLI (If Installed)

```bash
# Make sure you're in the project root
cd /path/to/citrus-league-storm

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Step 2: Verify

After applying the migration, the error should be resolved. The app will now be able to:
- Save default team names in profile settings
- Use default team names when creating new leagues
- Display team names properly in the draft room

## Troubleshooting

If you still see errors after applying the migration:
1. Refresh your browser to clear any cached schema
2. Restart your development server
3. Check that the column exists in the Supabase dashboard








