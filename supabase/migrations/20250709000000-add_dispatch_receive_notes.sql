
-- Add dispatch_notes and receive_notes columns to goods_movements
ALTER TABLE goods_movements 
ADD COLUMN IF NOT EXISTS dispatch_notes text,
ADD COLUMN IF NOT EXISTS receive_notes text;
