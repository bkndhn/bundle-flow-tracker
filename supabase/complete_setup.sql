-- ============================================================
-- BUNDLE FLOW TRACKER - COMPLETE DATABASE SETUP
-- ============================================================
-- Run this entire script on a fresh Supabase project to set up
-- all tables, enums, policies, and default data.
-- 
-- Last Updated: 2026-01-12
-- ============================================================


-- ============================================================
-- SECTION 1: CREATE ENUM TYPES
-- ============================================================

CREATE TYPE public.staff_role AS ENUM ('godown_staff', 'shop_staff', 'admin');
CREATE TYPE public.location_type AS ENUM ('godown', 'big_shop', 'small_shop');
CREATE TYPE public.destination_type AS ENUM ('big_shop', 'small_shop');
CREATE TYPE public.fare_payment_type AS ENUM (
  'paid_by_sender', 
  'to_be_paid_by_receiver',
  'to_be_paid_by_small_shop',
  'to_be_paid_by_big_shop'
);
CREATE TYPE public.movement_status AS ENUM ('dispatched', 'received');


-- ============================================================
-- SECTION 2: CREATE STAFF TABLE
-- ============================================================

CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role staff_role NOT NULL,
  location location_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for staff table
CREATE INDEX idx_staff_role ON public.staff(role);
CREATE INDEX idx_staff_location ON public.staff(location);

-- Enable RLS and create policy
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on staff" ON public.staff
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- SECTION 3: CREATE GOODS MOVEMENTS TABLE
-- ============================================================

CREATE TABLE public.goods_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_date TIMESTAMP WITH TIME ZONE NOT NULL,
  bundles_count INTEGER NOT NULL CHECK (bundles_count > 0),
  destination TEXT NOT NULL,
  sent_by UUID REFERENCES public.staff(id) NOT NULL,
  fare_payment fare_payment_type NOT NULL,
  accompanying_person TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  received_by UUID REFERENCES public.staff(id),
  condition_notes TEXT,
  status movement_status NOT NULL DEFAULT 'dispatched',
  
  -- Additional fields
  auto_name TEXT NOT NULL DEFAULT '',
  item TEXT NOT NULL DEFAULT 'shirt' CHECK (item IN ('shirt', 'pant', 'both')),
  shirt_bundles INTEGER,
  pant_bundles INTEGER,
  fare_display_msg TEXT,
  fare_payee_tag TEXT,
  item_summary_display TEXT,
  movement_type TEXT DEFAULT 'bundles',
  source TEXT DEFAULT 'godown',
  dispatch_notes TEXT,
  receive_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for goods_movements table
CREATE INDEX idx_goods_movements_status ON public.goods_movements(status);
CREATE INDEX idx_goods_movements_dispatch_date ON public.goods_movements(dispatch_date);
CREATE INDEX idx_goods_movements_destination ON public.goods_movements(destination);

-- Enable RLS and create policy
ALTER TABLE public.goods_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on goods_movements" ON public.goods_movements
  FOR ALL USING (true) WITH CHECK (true);

-- Enable REPLICA IDENTITY FULL for realtime updates (captures old values in UPDATE events)
ALTER TABLE public.goods_movements REPLICA IDENTITY FULL;


-- ============================================================
-- SECTION 4: CREATE APP USERS TABLE (Authentication)
-- ============================================================

CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'godown_manager', 'small_shop_manager', 'big_shop_manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_app_users_email ON public.app_users(email);

-- Enable RLS and create policy
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- SECTION 5: CREATE APP SETTINGS TABLE (WhatsApp Config)
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Anyone can read settings" ON app_settings
  FOR SELECT USING (true);

-- Allow inserts for upsert operations
CREATE POLICY "Anyone can insert settings" ON app_settings
  FOR INSERT WITH CHECK (true);

-- Allow updates
CREATE POLICY "Anyone can update settings" ON app_settings
  FOR UPDATE USING (true);

-- Insert default WhatsApp settings
INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('whatsapp_enabled', 'false'),
  ('whatsapp_mode', 'single'),
  ('whatsapp_global_group', ''),
  ('whatsapp_godown_group', ''),
  ('whatsapp_big_shop_group', ''),
  ('whatsapp_small_shop_group', '')
ON CONFLICT (setting_key) DO NOTHING;


-- ============================================================
-- SECTION 6: ENABLE REALTIME FOR GOODS MOVEMENTS
-- ============================================================

-- Ensure goods_movements is in the supabase_realtime publication for realtime updates
DO $$
BEGIN
    -- Check if publication exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- Add the table to the publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'goods_movements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.goods_movements;
    END IF;
END $$;


-- ============================================================
-- SECTION 7: INSERT DEFAULT USERS
-- ============================================================
-- IMPORTANT: These are SHA-256 hashed passwords
-- Default password for all users: "password123"
-- SHA-256 hash of "password123" = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
-- 
-- CHANGE THESE PASSWORDS IMMEDIATELY AFTER SETUP!

INSERT INTO public.app_users (email, password_hash, role) VALUES
  ('goodstracker@admin.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin'),
  ('manager@godown.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'godown_manager'),
  ('manager@smallshop.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'small_shop_manager'),
  ('manager@bigshop.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'big_shop_manager')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- SECTION 8: OPTIONAL - INSERT SAMPLE STAFF DATA
-- ============================================================
-- Uncomment the following section if you want sample staff data

/*
INSERT INTO public.staff (name, role, location) VALUES
  ('Raj Kumar', 'godown_staff', 'godown'),
  ('Priya Singh', 'shop_staff', 'big_shop'),
  ('Amit Sharma', 'shop_staff', 'small_shop'),
  ('Admin User', 'admin', 'godown');
*/


-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- 
-- NEXT STEPS:
-- 1. Update the password hashes in app_users table (use User Management in app)
-- 2. Configure your application's Supabase URL and API keys in .env
-- 3. Add staff members via the Staff Management page
-- 4. Configure WhatsApp settings if needed
-- 5. Enable push notifications in browser
--
-- DEFAULT LOGIN CREDENTIALS:
-- Admin: goodstracker@admin.com / password123
-- Godown: manager@godown.com / password123
-- Small Shop: manager@smallshop.com / password123
-- Big Shop: manager@bigshop.com / password123
--
-- ============================================================
