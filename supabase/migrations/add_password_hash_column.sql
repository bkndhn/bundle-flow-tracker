-- Migration: Add password_hash column to app_users table
-- This column stores hashed passwords for user authentication

ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
