
-- Update the fare_payment_type enum to include the new options
ALTER TYPE fare_payment_type ADD VALUE 'to_be_paid_by_small_shop';
ALTER TYPE fare_payment_type ADD VALUE 'to_be_paid_by_big_shop';

-- Remove the old 'to_be_paid_by_receiver' value by recreating the enum
-- First, add a temporary column
ALTER TABLE goods_movements ADD COLUMN fare_payment_new fare_payment_type;

-- Update existing data to use new values
UPDATE goods_movements 
SET fare_payment_new = CASE 
  WHEN fare_payment = 'to_be_paid_by_receiver' THEN 'to_be_paid_by_small_shop'::fare_payment_type
  ELSE fare_payment::text::fare_payment_type
END;

-- Drop the old column and rename the new one
ALTER TABLE goods_movements DROP COLUMN fare_payment;
ALTER TABLE goods_movements RENAME COLUMN fare_payment_new TO fare_payment;

-- Make the column not null
ALTER TABLE goods_movements ALTER COLUMN fare_payment SET NOT NULL;
