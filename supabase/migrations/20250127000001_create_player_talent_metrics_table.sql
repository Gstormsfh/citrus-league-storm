-- Migration: Create player_talent_metrics table for Rest of Season (RoS) projections
-- This table stores matchup-neutral, player-level talent metrics

CREATE TABLE IF NOT EXISTS player_talent_metrics (
    player_id INTEGER NOT NULL,
    season INTEGER NOT NULL DEFAULT 2025,
    
    -- Rest of Season projection (matchup-neutral)
    ros_projection_xg NUMERIC(10, 4) NOT NULL,
    
    -- Supporting metrics for context
    talent_adjusted_xg_per_60 NUMERIC(10, 4),
    avg_toi_per_game NUMERIC(6, 2),
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Primary key (one record per player per season)
    PRIMARY KEY (player_id, season)
    
    -- Note: player_id is NHL player ID (INTEGER), not UUID from players table
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_talent_metrics_player_id ON player_talent_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_player_talent_metrics_season ON player_talent_metrics(season);
CREATE INDEX IF NOT EXISTS idx_player_talent_metrics_ros_projection ON player_talent_metrics(ros_projection_xg DESC);
CREATE INDEX IF NOT EXISTS idx_player_talent_metrics_calculated_at ON player_talent_metrics(calculated_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_player_talent_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_talent_metrics_updated_at
    BEFORE UPDATE ON player_talent_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_player_talent_metrics_updated_at();

-- Row Level Security (RLS)
ALTER TABLE player_talent_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read talent metrics
CREATE POLICY "Allow authenticated users to read talent metrics"
    ON player_talent_metrics
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow service role to insert/update/delete (for Python scripts)
CREATE POLICY "Allow service role full access"
    ON player_talent_metrics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE player_talent_metrics IS 'Stores matchup-neutral, player-level talent metrics for Rest of Season (RoS) projections';
COMMENT ON COLUMN player_talent_metrics.ros_projection_xg IS 'Matchup-neutral predictive value: (Talent-Adjusted xG/60) × (Average TOI per game / 60)';
COMMENT ON COLUMN player_talent_metrics.talent_adjusted_xg_per_60 IS 'Player talent-adjusted xG per 60 minutes';
COMMENT ON COLUMN player_talent_metrics.avg_toi_per_game IS 'Average Time On Ice per game in minutes';

