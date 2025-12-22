-- Add season column to goalie_gsax table
-- This allows filtering GSAx data by season for projections

-- Step 1: Add season column with default value
ALTER TABLE goalie_gsax
ADD COLUMN IF NOT EXISTS season INTEGER DEFAULT 2025 NOT NULL;

-- Step 2: Update any NULL season values to 2025 (safety check)
UPDATE goalie_gsax
SET season = 2025
WHERE season IS NULL;

-- Step 3: Drop the old primary key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'goalie_gsax_pkey' 
        AND conrelid = 'goalie_gsax'::regclass
    ) THEN
        ALTER TABLE goalie_gsax DROP CONSTRAINT goalie_gsax_pkey;
    END IF;
END $$;

-- Step 4: Add new composite primary key (goalie_id, season)
ALTER TABLE goalie_gsax
ADD CONSTRAINT goalie_gsax_pkey PRIMARY KEY (goalie_id, season);

-- Step 5: Create index on season for efficient filtering
CREATE INDEX IF NOT EXISTS idx_goalie_gsax_season ON goalie_gsax(season);

-- Step 6: Add comment
COMMENT ON COLUMN goalie_gsax.season IS 'Season year (e.g., 2025 for 2024-25 season)';

