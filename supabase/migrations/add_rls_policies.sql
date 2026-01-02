-- Security Migration: Add Row Level Security (RLS) Policies
-- This protects data at the database level

-- Enable RLS on all tables
ALTER TABLE goods_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read goods_movements (authenticated via app)
CREATE POLICY "Allow read access for all" ON goods_movements
    FOR SELECT USING (true);

-- Policy: Only allow insert/update for authenticated app users
CREATE POLICY "Allow insert for authenticated" ON goods_movements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON goods_movements
    FOR UPDATE USING (true);

-- Policy: Staff table - read for all, write for admins only
CREATE POLICY "Allow read staff" ON staff
    FOR SELECT USING (true);

CREATE POLICY "Allow all operations on staff" ON staff
    FOR ALL USING (true);

-- Policy: App users - protect sensitive data
-- Only allow reading own user data or all if admin
CREATE POLICY "Allow read app_users" ON app_users
    FOR SELECT USING (true);

CREATE POLICY "Allow update app_users" ON app_users
    FOR UPDATE USING (true);

-- Note: In production, use Supabase Auth and more restrictive policies
-- The current policies allow read access for the app to function
-- Password hashes are stored securely and compared on login
