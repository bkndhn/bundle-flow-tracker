
-- Add new columns to goods_movements table
ALTER TABLE public.goods_movements 
ADD COLUMN auto_name TEXT NOT NULL DEFAULT '',
ADD COLUMN item TEXT NOT NULL DEFAULT 'shirt' CHECK (item IN ('shirt', 'pant'));

-- Create users table for authentication with predefined roles
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'godown_manager', 'small_shop_manager', 'big_shop_manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined users
INSERT INTO public.app_users (email, password_hash, role) VALUES
  ('goodstracker@admin.com', '$2b$10$dummy_hash_replace_with_real', 'admin'),
  ('manager@godown.com', '$2b$10$dummy_hash_replace_with_real', 'godown_manager'),
  ('manager@smallshop.com', '$2b$10$dummy_hash_replace_with_real', 'small_shop_manager'),
  ('manager@bigshop.com', '$2b$10$dummy_hash_replace_with_real', 'big_shop_manager');

-- Enable RLS on app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policy for app_users
CREATE POLICY "Allow all operations on app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);

-- Update existing goods_movements to have default values
UPDATE public.goods_movements 
SET auto_name = 'Auto-1', item = 'shirt' 
WHERE auto_name = '' OR item IS NULL;
