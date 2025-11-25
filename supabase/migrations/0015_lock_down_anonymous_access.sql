-- Migration: Lock down anonymous access to all tables
-- Description: Remove anon access, enable RLS on missing tables, ensure service_role only
-- Date: 2025-11-24

-- ============================================================================
-- 1. ENABLE RLS ON TABLES THAT WERE MISSING IT
-- ============================================================================

-- Enable RLS on admins table (was created without RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_images table (was created without RLS)
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_models table (was created without RLS)
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP PERMISSIVE ANONYMOUS POLICIES FROM HISTORY TABLE
-- ============================================================================

-- Drop the overly permissive anon policy from history table
DROP POLICY IF EXISTS "Allow anon access" ON history;

-- ============================================================================
-- 3. UPDATE STORAGE POLICIES TO SERVICE_ROLE ONLY FOR WRITE OPERATIONS
-- ============================================================================

-- Drop existing storage policies that allow authenticated users
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product models" ON storage.objects;

-- Create service_role only policies for write operations on product-images bucket
CREATE POLICY "Service role can upload product images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Service role can update product images"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'product-images');

CREATE POLICY "Service role can delete product images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'product-images');

-- Create service_role only policies for write operations on product-models bucket
CREATE POLICY "Service role can upload product models"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'product-models');

CREATE POLICY "Service role can update product models"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'product-models');

CREATE POLICY "Service role can delete product models"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'product-models');

-- ============================================================================
-- 4. TRACK MIGRATION VERSION
-- ============================================================================

INSERT INTO schema_migrations (version)
VALUES ('0015_lock_down_anonymous_access')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- Summary of changes:
-- 1. Enabled RLS on admins, product_images, product_models tables
-- 2. Removed permissive anon policy from history table
-- 3. Replaced authenticated storage policies with service_role only policies
--
-- Result: All database access MUST go through Next.js API routes using
-- the service_role key. Anonymous users cannot access any data directly.
-- ============================================================================
