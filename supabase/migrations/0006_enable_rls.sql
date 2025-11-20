-- Enable Row Level Security (RLS) on all tables
-- This restricts direct client access to Supabase tables
-- Backend API routes will use service role key to bypass RLS

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_parameter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_in_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_items ENABLE ROW LEVEL SECURITY;

-- No policies are created, which means:
-- - Anonymous users (anon key) cannot read or write any data
-- - Service role key (used by backend) bypasses RLS and has full access
-- - All database access must go through backend API routes

-- Track migration version
INSERT INTO schema_migrations (version, applied_at)
VALUES ('0006_enable_rls', NOW())
ON CONFLICT (version) DO NOTHING;
