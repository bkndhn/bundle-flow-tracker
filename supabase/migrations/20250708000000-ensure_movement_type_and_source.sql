
-- Ensure movement_type and source columns exist in goods_movements
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goods_movements' AND column_name = 'movement_type') THEN
        ALTER TABLE goods_movements ADD COLUMN movement_type text DEFAULT 'bundles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goods_movements' AND column_name = 'source') THEN
        ALTER TABLE goods_movements ADD COLUMN source text DEFAULT 'godown';
    END IF;
END $$;
