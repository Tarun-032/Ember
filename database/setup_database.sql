-- Complete Database Setup for Supabase
-- Run this in your Supabase SQL editor

-- Step 1: Create users table first
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create sessions table (referencing users table)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    preview TEXT,
    conversation TEXT[] NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Enable Row Level Security (RLS) for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security (RLS) for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for users table (allow all operations for now)
CREATE POLICY "Allow user operations" ON users
    FOR ALL USING (true);

-- Create policy for sessions table (allow all operations for now)
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true);

-- Optional: If you want user-specific sessions later, you can use these policies instead:
-- 
-- DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
-- CREATE POLICY "Users can only access their own sessions" ON sessions
--     FOR ALL USING (user_id = (SELECT id FROM users WHERE username = current_setting('app.username', true)));
