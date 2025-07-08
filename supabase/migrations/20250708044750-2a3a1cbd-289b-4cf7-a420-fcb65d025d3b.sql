
-- Create users table in Supabase for secure authentication
CREATE TABLE public.app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the users with exact credentials as specified
INSERT INTO public.app_users (email, password_hash, role) VALUES
('admin@goods.com', 'Goodsans7322', 'admin'),
('manager@godown', 'Gdndis65', 'godown_manager'),
('manager@smallshop', 'Mngrss78', 'small_shop_manager'),
('manager@bigshop', 'Mngrbs78', 'big_shop_manager');

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policies for app_users table
CREATE POLICY "Users can view their own data" ON public.app_users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Add columns to goods_movements for edit/delete tracking
ALTER TABLE public.goods_movements 
ADD COLUMN is_editable BOOLEAN DEFAULT true,
ADD COLUMN last_edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_edited_by TEXT;

-- Create function to check if movement is editable
CREATE OR REPLACE FUNCTION public.is_movement_editable(movement_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.goods_movements 
    WHERE id = movement_id 
    AND status = 'dispatched' 
    AND is_editable = true
  );
END;
$$;
