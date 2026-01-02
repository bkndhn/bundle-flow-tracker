-- Migration: Add source column to goods_movements table
-- This column tracks where the goods are dispatched FROM (godown, big_shop, small_shop)

ALTER TABLE goods_movements 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'godown';
