-- Quick fix: Add draft_session_id column to draft_order table
-- Run this in your Supabase SQL Editor if the column is missing

-- Add draft_session_id column if it doesn't exist
ALTER TABLE public.draft_order 
ADD COLUMN IF NOT EXISTS draft_session_id uuid;

-- Add deleted_at column if it doesn't exist (for soft deletes)
ALTER TABLE public.draft_order 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Set default values for existing records
UPDATE public.draft_order 
SET draft_session_id = gen_random_uuid()
WHERE draft_session_id IS NULL;

-- Also add to draft_picks if missing
ALTER TABLE public.draft_picks 
ADD COLUMN IF NOT EXISTS draft_session_id uuid;

ALTER TABLE public.draft_picks 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE public.draft_picks 
SET draft_session_id = gen_random_uuid()
WHERE draft_session_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_draft_order_session 
ON public.draft_order(league_id, draft_session_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_draft_picks_session 
ON public.draft_picks(league_id, draft_session_id) 
WHERE deleted_at IS NULL;

