
-- Ensure all required columns exist in goods_movements table
ALTER TABLE goods_movements 
ADD COLUMN IF NOT EXISTS fare_display_msg TEXT,
ADD COLUMN IF NOT EXISTS fare_payee_tag TEXT,
ADD COLUMN IF NOT EXISTS item_summary_display TEXT,
ADD COLUMN IF NOT EXISTS shirt_bundles INTEGER,
ADD COLUMN IF NOT EXISTS pant_bundles INTEGER;

-- Update the fare_payment enum to include the correct values
DO $$
BEGIN
    -- Check if the new enum values exist, if not add them
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'to_be_paid_by_small_shop' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'fare_payment_type')) THEN
        ALTER TYPE fare_payment_type ADD VALUE 'to_be_paid_by_small_shop';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'to_be_paid_by_big_shop' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'fare_payment_type')) THEN
        ALTER TYPE fare_payment_type ADD VALUE 'to_be_paid_by_big_shop';
    END IF;
END $$;
