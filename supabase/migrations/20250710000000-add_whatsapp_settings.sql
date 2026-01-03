
-- Create app_settings table for WhatsApp configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default WhatsApp settings
INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('whatsapp_enabled', 'false'),
  ('whatsapp_mode', 'single'),
  ('whatsapp_global_group', ''),
  ('whatsapp_godown_group', ''),
  ('whatsapp_big_shop_group', ''),
  ('whatsapp_small_shop_group', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Anyone can read settings" ON app_settings
  FOR SELECT USING (true);

-- Only allow updates (admin check will be done in app)
CREATE POLICY "Anyone can update settings" ON app_settings
  FOR UPDATE USING (true);
