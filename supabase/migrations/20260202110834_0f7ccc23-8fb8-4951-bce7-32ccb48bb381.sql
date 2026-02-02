-- Add transport_method enum type
CREATE TYPE public.transport_method_type AS ENUM ('auto', 'bike', 'by_walk');

-- Add transport_method column to goods_movements table
ALTER TABLE public.goods_movements 
ADD COLUMN transport_method public.transport_method_type DEFAULT 'auto';

-- Add comment for clarity
COMMENT ON COLUMN public.goods_movements.transport_method IS 'Transport method used: auto, bike, or by_walk (walking)';