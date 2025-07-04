
-- Create enum types for better data integrity
CREATE TYPE public.staff_role AS ENUM ('godown_staff', 'shop_staff', 'admin');
CREATE TYPE public.location_type AS ENUM ('godown', 'big_shop', 'small_shop');
CREATE TYPE public.destination_type AS ENUM ('big_shop', 'small_shop');
CREATE TYPE public.fare_payment_type AS ENUM ('paid_by_sender', 'to_be_paid_by_receiver');
CREATE TYPE public.movement_status AS ENUM ('dispatched', 'received');

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role staff_role NOT NULL,
  location location_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goods_movements table
CREATE TABLE public.goods_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_date TIMESTAMP WITH TIME ZONE NOT NULL,
  bundles_count INTEGER NOT NULL CHECK (bundles_count > 0),
  destination destination_type NOT NULL,
  sent_by UUID REFERENCES public.staff(id) NOT NULL,
  fare_payment fare_payment_type NOT NULL,
  accompanying_person TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  received_by UUID REFERENCES public.staff(id),
  condition_notes TEXT,
  status movement_status NOT NULL DEFAULT 'dispatched',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - for now, we'll make it accessible to all authenticated users
-- In a production app, you'd want more granular permissions based on user roles
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these later for authentication)
CREATE POLICY "Allow all operations on staff" ON public.staff
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on goods_movements" ON public.goods_movements
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_staff_role ON public.staff(role);
CREATE INDEX idx_staff_location ON public.staff(location);
CREATE INDEX idx_goods_movements_status ON public.goods_movements(status);
CREATE INDEX idx_goods_movements_dispatch_date ON public.goods_movements(dispatch_date);
CREATE INDEX idx_goods_movements_destination ON public.goods_movements(destination);

-- Insert sample data
INSERT INTO public.staff (name, role, location) VALUES
  ('Raj Kumar', 'godown_staff', 'godown'),
  ('Priya Singh', 'shop_staff', 'big_shop'),
  ('Amit Sharma', 'shop_staff', 'small_shop'),
  ('Admin User', 'admin', 'godown');

-- Insert sample movements
INSERT INTO public.goods_movements (dispatch_date, bundles_count, destination, sent_by, fare_payment, status) VALUES
  (NOW() - INTERVAL '2 hours', 15, 'big_shop', (SELECT id FROM public.staff WHERE name = 'Raj Kumar'), 'paid_by_sender', 'dispatched'),
  (NOW() - INTERVAL '1 day', 8, 'small_shop', (SELECT id FROM public.staff WHERE name = 'Raj Kumar'), 'to_be_paid_by_receiver', 'received');

-- Update the second movement to show it was received
UPDATE public.goods_movements 
SET received_at = NOW() - INTERVAL '23 hours',
    received_by = (SELECT id FROM public.staff WHERE name = 'Amit Sharma'),
    condition_notes = 'All goods in perfect condition',
    status = 'received'
WHERE bundles_count = 8;
