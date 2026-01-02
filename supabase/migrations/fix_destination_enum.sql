-- Migration: Update destination column to TEXT to support 'godown' value
-- The destination column was an enum that didn't include 'godown'

-- Option 1: If destination is an enum, alter it to TEXT
ALTER TABLE goods_movements 
ALTER COLUMN destination TYPE TEXT;

-- Add check constraint for valid values (optional but recommended)
-- This allows big_shop, small_shop, godown, and both
ALTER TABLE goods_movements
DROP CONSTRAINT IF EXISTS valid_destination;

ALTER TABLE goods_movements
ADD CONSTRAINT valid_destination CHECK (destination IN ('big_shop', 'small_shop', 'godown', 'both'));
