-- Add season tracking to tables for multi-season backtesting
-- This migration adds season columns to raw_shots and goalie_gsax tables

-- Step 1: Add season column to raw_shots table
-- Season is derived from game_id (first 4 digits) or game_date
ALTER TABLE raw_shots 
ADD COLUMN IF NOT EXISTS season INTEGER;

-- Create index for season lookups
CREATE INDEX IF NOT EXISTS idx_raw_shots_season ON raw_shots(season);

-- Step 2: Add season column to goalie_gsax table
-- Change primary key to composite (goalie_id, season) to support multi-season data
ALTER TABLE goalie_gsax 
ADD COLUMN IF NOT EXISTS season INTEGER DEFAULT 2025;

-- Drop existing primary key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'goalie_gsax_pkey'
    ) THEN
        ALTER TABLE goalie_gsax DROP CONSTRAINT goalie_gsax_pkey;
    END IF;
END $$;

-- Create new composite primary key
ALTER TABLE goalie_gsax 
ADD CONSTRAINT goalie_gsax_pkey PRIMARY KEY (goalie_id, season);

-- Create index for season lookups
CREATE INDEX IF NOT EXISTS idx_goalie_gsax_season ON goalie_gsax(season);

-- Step 3: Add season column to player_toi_by_situation if it doesn't exist
ALTER TABLE player_toi_by_situation 
ADD COLUMN IF NOT EXISTS season INTEGER;

-- Create index for season lookups
CREATE INDEX IF NOT EXISTS idx_toi_season ON player_toi_by_situation(season);

-- Step 4: Add season column to player_shifts if it doesn't exist
ALTER TABLE player_shifts 
ADD COLUMN IF NOT EXISTS season INTEGER;

-- Create index for season lookups
CREATE INDEX IF NOT EXISTS idx_shifts_season ON player_shifts(season);

-- Step 5: Create function to derive season from game_id
-- NHL game_id format: YYYYMMDDNN (e.g., 2024020123)
-- Season is determined by: if month >= 10, season = YYYY, else season = YYYY - 1
CREATE OR REPLACE FUNCTION derive_season_from_game_id(game_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    game_id_str TEXT;
    year_part INTEGER;
    month_part INTEGER;
BEGIN
    -- Convert game_id to string
    game_id_str := game_id::TEXT;
    
    -- Extract year (first 4 digits)
    year_part := SUBSTRING(game_id_str, 1, 4)::INTEGER;
    
    -- Extract month (digits 5-6)
    month_part := SUBSTRING(game_id_str, 5, 2)::INTEGER;
    
    -- NHL seasons: October (10) through June (06) of next year
    -- If month >= 10, season starts in that year
    -- If month < 10, season started in previous year
    IF month_part >= 10 THEN
        RETURN year_part;
    ELSE
        RETURN year_part - 1;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Create function to derive season from game_date
CREATE OR REPLACE FUNCTION derive_season_from_date(game_date DATE)
RETURNS INTEGER AS $$
DECLARE
    year_part INTEGER;
    month_part INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM game_date)::INTEGER;
    month_part := EXTRACT(MONTH FROM game_date)::INTEGER;
    
    -- NHL seasons: October (10) through June (06) of next year
    IF month_part >= 10 THEN
        RETURN year_part;
    ELSE
        RETURN year_part - 1;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Update existing raw_shots records with season (if game_id exists)
-- This backfills season for existing data
UPDATE raw_shots 
SET season = derive_season_from_game_id(game_id)
WHERE season IS NULL AND game_id IS NOT NULL;

-- Step 8: Add comments for documentation
COMMENT ON COLUMN raw_shots.season IS 'NHL season year (e.g., 2024 for 2024-25 season). Derived from game_id or game_date.';
COMMENT ON COLUMN goalie_gsax.season IS 'NHL season year (e.g., 2024 for 2024-25 season).';
COMMENT ON COLUMN player_toi_by_situation.season IS 'NHL season year (e.g., 2024 for 2024-25 season).';
COMMENT ON COLUMN player_shifts.season IS 'NHL season year (e.g., 2024 for 2024-25 season).';

