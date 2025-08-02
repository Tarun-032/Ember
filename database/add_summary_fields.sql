-- Add summary fields to sessions table
-- Run this in your Supabase SQL editor to add summary capabilities

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS struggles TEXT[],
ADD COLUMN IF NOT EXISTS observations TEXT[],
ADD COLUMN IF NOT EXISTS tips TEXT[],
ADD COLUMN IF NOT EXISTS summary_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for summary queries
CREATE INDEX IF NOT EXISTS idx_sessions_summary_generated ON sessions(summary_generated);

-- Update table comment
COMMENT ON TABLE sessions IS 'Stores conversation sessions with optional AI-generated summaries and insights';
COMMENT ON COLUMN sessions.summary IS 'AI-generated summary of the session';
COMMENT ON COLUMN sessions.struggles IS 'Array of key challenges identified in the session';
COMMENT ON COLUMN sessions.observations IS 'Array of behavioral/emotional observations from the session';
COMMENT ON COLUMN sessions.tips IS 'Array of helpful tips and recommendations for the user';
COMMENT ON COLUMN sessions.summary_generated IS 'Whether a summary has been generated for this session';
COMMENT ON COLUMN sessions.summary_generated_at IS 'Timestamp when the summary was generated';
