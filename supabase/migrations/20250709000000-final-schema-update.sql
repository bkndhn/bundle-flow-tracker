-- Add missing accompanying_person field
ALTER TABLE public.goods_movements 
ADD COLUMN IF NOT EXISTS accompanying_person TEXT;

-- Update item field constraint to support 'both' option
ALTER TABLE public.goods_movements 
DROP CONSTRAINT IF EXISTS goods_movements_item_check;

ALTER TABLE public.goods_movements 
ADD CONSTRAINT goods_movements_item_check 
CHECK (item IN ('shirt', 'pant', 'both'));

-- Update destination enum to ensure it has 'both' option
DO $$
BEGIN
    -- Check if 'both' value exists in destination_type enum, if not add it
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'both' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'destination_type')) THEN
        ALTER TYPE destination_type ADD VALUE 'both';
    END IF;
END $$;

-- Also update destination column constraint
ALTER TABLE public.goods_movements 
DROP CONSTRAINT IF EXISTS goods_movements_destination_check;