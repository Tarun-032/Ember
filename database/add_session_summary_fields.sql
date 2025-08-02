-- Add session summary fields to the sessions table
-- Run this in your Supabase SQL editor

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS struggles TEXT[],
ADD COLUMN IF NOT EXISTS observations TEXT[],
ADD COLUMN IF NOT EXISTS tips TEXT[],
ADD COLUMN IF NOT EXISTS summary_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries on summary status
CREATE INDEX IF NOT EXISTS idx_sessions_summary_generated ON sessions(summary_generated);

-- Update existing sessions to have summary_generated = false
UPDATE sessions SET summary_generated = FALSE WHERE summary_generated IS NULL;
