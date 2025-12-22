-- Migration: Create player_projected_stats table for fantasy stat projections
-- This table stores projected fantasy stats (goals, assists, shots, etc.) derived from xG
-- Separate from player_projections to optimize querying and keep xG metrics clean

CREATE TABLE IF NOT EXISTS player_projected_stats (
    player_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL DEFAULT -1,  -- -1 for RoS projections, actual game_id for matchup projections
    season INTEGER NOT NULL DEFAULT 2025,
    
    -- Projected fantasy stats (derived from xG using hybrid conversion)
    projected_goals NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    projected_assists NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    projected_shots NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    projected_blocks NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    projected_hits NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    projected_ppp NUMERIC(10, 4) NOT NULL DEFAULT 0.0,  -- Power Play Points
    projected_pim NUMERIC(10, 4),  -- Penalty Minutes (nullable)
    projected_plus_minus NUMERIC(10, 4),  -- Plus/Minus (nullable)
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Primary key: (player_id, game_id, season)
    -- game_id = -1 for RoS projections, actual game_id for matchup projections
    PRIMARY KEY (player_id, game_id, season)
);

-- Foreign key to nhl_games (only when game_id is not -1)
-- Use a check constraint to only enforce FK when game_id > 0
-- Note: We can't use a partial foreign key, so we'll handle this in application logic
-- or create a separate constraint function

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_projected_stats_player_id ON player_projected_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_projected_stats_game_id ON player_projected_stats(game_id) WHERE game_id > 0;
CREATE INDEX IF NOT EXISTS idx_player_projected_stats_season ON player_projected_stats(season);
CREATE INDEX IF NOT EXISTS idx_player_projected_stats_player_season ON player_projected_stats(player_id, season);
CREATE INDEX IF NOT EXISTS idx_player_projected_stats_ros ON player_projected_stats(player_id, season) WHERE game_id = -1;
CREATE INDEX IF NOT EXISTS idx_player_projected_stats_calculated_at ON player_projected_stats(calculated_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_player_projected_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_projected_stats_updated_at
    BEFORE UPDATE ON player_projected_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_player_projected_stats_updated_at();

-- Row Level Security (RLS)
ALTER TABLE player_projected_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read projected stats
CREATE POLICY "Allow authenticated users to read projected stats"
    ON player_projected_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow service role to insert/update/delete (for Python scripts)
CREATE POLICY "Allow service role full access"
    ON player_projected_stats
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE player_projected_stats IS 'Stores projected fantasy stats (goals, assists, shots, etc.) derived from xG projections using hybrid Bayesian regression';
COMMENT ON COLUMN player_projected_stats.game_id IS 'Game ID for matchup projections, -1 for Rest of Season (RoS) projections';
COMMENT ON COLUMN player_projected_stats.projected_goals IS 'Projected goals derived from projected xG';
COMMENT ON COLUMN player_projected_stats.projected_assists IS 'Projected assists derived from projected goals';
COMMENT ON COLUMN player_projected_stats.projected_shots IS 'Projected shots on goal derived from projected xG';
COMMENT ON COLUMN player_projected_stats.projected_blocks IS 'Projected blocked shots derived from projected TOI';
COMMENT ON COLUMN player_projected_stats.projected_hits IS 'Projected hits derived from projected TOI';
COMMENT ON COLUMN player_projected_stats.projected_ppp IS 'Projected power play points derived from projected goals';

