-- Migration: Add movement_type column to goods_movements table
-- This column stores whether the movement is for 'bundles' or 'pieces'

ALTER TABLE goods_movements 
ADD COLUMN IF NOT EXISTS movement_type TEXT DEFAULT 'bundles';

-- Add a check constraint to ensure only valid values
ALTER TABLE goods_movements 
ADD CONSTRAINT movement_type_check 
CHECK (movement_type IN ('bundles', 'pieces'));
