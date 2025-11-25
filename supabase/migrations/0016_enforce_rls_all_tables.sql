-- Migration: Enforce RLS on ALL tables to block anonymous access
-- Description: Enable RLS on every table and ensure no anonymous policies exist
-- Date: 2025-11-24
--
-- This migration ensures ALL database access goes through Next.js API routes
-- using the service_role key. Anonymous users cannot access any data directly.

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES (idempotent - safe to run multiple times)
-- ============================================================================

-- Core product tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_parameter_groups ENABLE ROW LEVEL SECURITY;

-- User and shopping tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_in_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Special offers
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_items ENABLE ROW LEVEL SECURITY;

-- Admin and media tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;

-- History and schema
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP ANY EXISTING PERMISSIVE POLICIES FOR ANON ROLE
-- ============================================================================

-- Drop any anon policies that might exist
DROP POLICY IF EXISTS "Allow anon access" ON history;
DROP POLICY IF EXISTS "Allow anon read" ON categories;
DROP POLICY IF EXISTS "Allow anon read" ON products;
DROP POLICY IF EXISTS "Allow anon read" ON specials;
DROP POLICY IF EXISTS "Allow anon read" ON special_items;
DROP POLICY IF EXISTS "Allow anon read" ON parameter_groups;
DROP POLICY IF EXISTS "Allow anon read" ON parameters;
DROP POLICY IF EXISTS "Allow anon read" ON product_parameter_groups;

-- ============================================================================
-- 3. FORCE RLS FOR TABLE OWNERS (critical for security)
-- ============================================================================

-- By default, table owners bypass RLS. Force RLS for all tables
-- This ensures even if someone gets the postgres password, RLS still applies
-- Note: service_role key still bypasses RLS (this is the intended behavior)

ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE parameter_groups FORCE ROW LEVEL SECURITY;
ALTER TABLE parameters FORCE ROW LEVEL SECURITY;
ALTER TABLE product_parameter_groups FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE carts FORCE ROW LEVEL SECURITY;
ALTER TABLE product_in_cart FORCE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE specials FORCE ROW LEVEL SECURITY;
ALTER TABLE special_items FORCE ROW LEVEL SECURITY;
ALTER TABLE admins FORCE ROW LEVEL SECURITY;
ALTER TABLE product_images FORCE ROW LEVEL SECURITY;
ALTER TABLE product_models FORCE ROW LEVEL SECURITY;
ALTER TABLE history FORCE ROW LEVEL SECURITY;
-- Don't force RLS on schema_migrations as it's needed for migrations

-- ============================================================================
-- 4. CREATE SERVICE_ROLE ONLY POLICIES
-- ============================================================================

-- These policies explicitly grant access only to service_role
-- While not strictly necessary (service_role bypasses RLS), they make the
-- intent clear and provide documentation

-- Categories
DROP POLICY IF EXISTS "Service role full access to categories" ON categories;
CREATE POLICY "Service role full access to categories" ON categories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Products
DROP POLICY IF EXISTS "Service role full access to products" ON products;
CREATE POLICY "Service role full access to products" ON products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Parameter groups
DROP POLICY IF EXISTS "Service role full access to parameter_groups" ON parameter_groups;
CREATE POLICY "Service role full access to parameter_groups" ON parameter_groups
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Parameters
DROP POLICY IF EXISTS "Service role full access to parameters" ON parameters;
CREATE POLICY "Service role full access to parameters" ON parameters
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Product parameter groups
DROP POLICY IF EXISTS "Service role full access to product_parameter_groups" ON product_parameter_groups;
CREATE POLICY "Service role full access to product_parameter_groups" ON product_parameter_groups
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users
DROP POLICY IF EXISTS "Service role full access to users" ON users;
CREATE POLICY "Service role full access to users" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Carts
DROP POLICY IF EXISTS "Service role full access to carts" ON carts;
CREATE POLICY "Service role full access to carts" ON carts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Product in cart
DROP POLICY IF EXISTS "Service role full access to product_in_cart" ON product_in_cart;
CREATE POLICY "Service role full access to product_in_cart" ON product_in_cart
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "Service role full access to orders" ON orders;
CREATE POLICY "Service role full access to orders" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Specials
DROP POLICY IF EXISTS "Service role full access to specials" ON specials;
CREATE POLICY "Service role full access to specials" ON specials
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Special items
DROP POLICY IF EXISTS "Service role full access to special_items" ON special_items;
CREATE POLICY "Service role full access to special_items" ON special_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admins
DROP POLICY IF EXISTS "Service role full access to admins" ON admins;
CREATE POLICY "Service role full access to admins" ON admins
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Product images
DROP POLICY IF EXISTS "Service role full access to product_images" ON product_images;
CREATE POLICY "Service role full access to product_images" ON product_images
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Product models
DROP POLICY IF EXISTS "Service role full access to product_models" ON product_models;
CREATE POLICY "Service role full access to product_models" ON product_models
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- History
DROP POLICY IF EXISTS "Service role full access to history" ON history;
CREATE POLICY "Service role full access to history" ON history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Schema migrations (allow service_role)
DROP POLICY IF EXISTS "Service role full access to schema_migrations" ON schema_migrations;
CREATE POLICY "Service role full access to schema_migrations" ON schema_migrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. TRACK MIGRATION VERSION
-- ============================================================================

INSERT INTO schema_migrations (version)
VALUES ('0016_enforce_rls_all_tables')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (run manually to verify):
--
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- Check policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies WHERE schemaname = 'public';
--
-- Test anon access (should fail):
-- SET ROLE anon;
-- SELECT * FROM categories LIMIT 1;  -- Should return empty or error
-- RESET ROLE;
-- ============================================================================
