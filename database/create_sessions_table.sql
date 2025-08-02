-- Create sessions table for storing conversation history
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    preview TEXT,
    conversation TEXT[] NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id INTEGER NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own sessions
-- For now, we'll allow all operations without user restriction
-- You can modify this later to add user-specific policies
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true);

-- If you want user-specific sessions, uncomment and use this policy instead:
-- CREATE POLICY "Users can only access their own sessions" ON sessions
--     FOR ALL USING (auth.uid() = user_id);
