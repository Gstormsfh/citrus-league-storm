-- Migration: Create player_projections table for matchup-specific projections
-- This table stores per-player, per-game projections with explainability factors

CREATE TABLE IF NOT EXISTS player_projections (
    player_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    season INTEGER NOT NULL DEFAULT 2025,
    
    -- Base projection (talent-adjusted xG)
    base_xg NUMERIC(10, 4) NOT NULL,
    
    -- Adjusted projections after each step
    gsax_adjusted_xg NUMERIC(10, 4) NOT NULL,
    qoc_adjusted_xg NUMERIC(10, 4) NOT NULL,
    final_projected_xg NUMERIC(10, 4) NOT NULL,
    
    -- Explainability factors (percentages as decimals, e.g., 0.08 = 8%)
    gsax_factor_pct NUMERIC(5, 4) NOT NULL DEFAULT 0.0,
    qoc_factor_pct NUMERIC(5, 4) NOT NULL DEFAULT 0.0,
    
    -- Opponent context
    goalie_factor NUMERIC(10, 4) NOT NULL DEFAULT 0.0,
    opponent_team_id INTEGER,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Primary key
    PRIMARY KEY (player_id, game_id, season),
    
    -- Foreign key to nhl_games (if table exists)
    -- Note: player_id is NHL player ID (INTEGER), not UUID from players table
    CONSTRAINT fk_player_projections_game FOREIGN KEY (game_id) 
        REFERENCES nhl_games(game_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_projections_player_id ON player_projections(player_id);
CREATE INDEX IF NOT EXISTS idx_player_projections_game_id ON player_projections(game_id);
CREATE INDEX IF NOT EXISTS idx_player_projections_season ON player_projections(season);
CREATE INDEX IF NOT EXISTS idx_player_projections_opponent_team ON player_projections(opponent_team_id);
CREATE INDEX IF NOT EXISTS idx_player_projections_calculated_at ON player_projections(calculated_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_player_projections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_projections_updated_at
    BEFORE UPDATE ON player_projections
    FOR EACH ROW
    EXECUTE FUNCTION update_player_projections_updated_at();

-- Row Level Security (RLS)
ALTER TABLE player_projections ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read projections
CREATE POLICY "Allow authenticated users to read projections"
    ON player_projections
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow service role to insert/update/delete (for Python scripts)
CREATE POLICY "Allow service role full access"
    ON player_projections
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE player_projections IS 'Stores matchup-specific player projections with explainability factors (GSAx and QoC adjustments)';
COMMENT ON COLUMN player_projections.base_xg IS 'Base talent-adjusted xG before adjustments';
COMMENT ON COLUMN player_projections.gsax_adjusted_xg IS 'xG after GSAx (goalie) adjustment';
COMMENT ON COLUMN player_projections.qoc_adjusted_xg IS 'xG after QoC (quality of competition) adjustment';
COMMENT ON COLUMN player_projections.final_projected_xg IS 'Final projection (Base + GSAx + QoC)';
COMMENT ON COLUMN player_projections.gsax_factor_pct IS 'GSAx adjustment percentage (e.g., -0.05 = -5%)';
COMMENT ON COLUMN player_projections.qoc_factor_pct IS 'QoC adjustment percentage (e.g., 0.08 = +8%)';
COMMENT ON COLUMN player_projections.goalie_factor IS 'Opponent goalie GSAx factor used in adjustment';
COMMENT ON COLUMN player_projections.opponent_team_id IS 'Opponent team ID for QoC calculation';

