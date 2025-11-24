-- Migration: Product Images and 3D Models
-- Description: Add support for multiple images per product and optional 3D models
-- Author: Matus Faro
-- Date: 2025-11-23

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-models',
  'product-models',
  true,
  52428800, -- 50MB limit
  ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE PRODUCT_IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path to original image in storage
  thumbnail_path TEXT NOT NULL, -- Path to 200x200 thumbnail
  medium_path TEXT NOT NULL, -- Path to 800x800 medium size
  display_order INTEGER NOT NULL DEFAULT 0, -- Order for carousel display
  alt_text TEXT, -- Alternative text for accessibility
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_display_order ON product_images(product_id, display_order);

-- Add comment
COMMENT ON TABLE product_images IS 'Stores multiple images per product with different sizes for web optimization';

-- ============================================================================
-- 3. CREATE PRODUCT_MODELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id BIGINT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path to .glb/.gltf file in storage
  file_size BIGINT NOT NULL, -- File size in bytes
  file_format TEXT NOT NULL, -- 'glb', 'gltf', or 'usdz'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_product_models_product_id ON product_models(product_id);

-- Add comment
COMMENT ON TABLE product_models IS 'Stores optional 3D models for products (one per product)';

-- ============================================================================
-- 4. REMOVE OLD PICTURE_URL COLUMN FROM PRODUCTS
-- ============================================================================

-- Drop picture_url from products table (starting fresh with new system)
ALTER TABLE products DROP COLUMN IF EXISTS picture_url;

-- Also drop from categories, parameters, and specials (keeping them for now as they don't have multi-image support yet)
-- We'll migrate these tables later if needed

-- ============================================================================
-- 5. STORAGE POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on storage buckets
-- Note: RLS is already enabled on storage.objects by default in Supabase
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view product images (public read)
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy: Authenticated users can upload product images
-- TODO: In production, restrict to admin users only
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update product images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- Policy: Anyone can view 3D models (public read)
CREATE POLICY "Public read access for product models"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-models');

-- Policy: Authenticated users can upload 3D models
CREATE POLICY "Authenticated users can upload product models"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-models'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update 3D models
CREATE POLICY "Authenticated users can update product models"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-models'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can delete 3D models
CREATE POLICY "Authenticated users can delete product models"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-models'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get the first image for a product (for thumbnails)
CREATE OR REPLACE FUNCTION get_product_first_image(p_product_id BIGINT)
RETURNS TEXT AS $$
  SELECT medium_path
  FROM product_images
  WHERE product_id = p_product_id
  ORDER BY display_order ASC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to get all images for a product ordered by display_order
CREATE OR REPLACE FUNCTION get_product_images_ordered(p_product_id BIGINT)
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  thumbnail_path TEXT,
  medium_path TEXT,
  display_order INTEGER,
  alt_text TEXT
) AS $$
  SELECT id, storage_path, thumbnail_path, medium_path, display_order, alt_text
  FROM product_images
  WHERE product_id = p_product_id
  ORDER BY display_order ASC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 7. UPDATE SCHEMA VERSION
-- ============================================================================

INSERT INTO schema_migrations (version)
VALUES ('0010_product_media')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- Migration complete!
-- Next steps:
-- 1. Apply this migration via Supabase Dashboard SQL Editor
-- 2. Verify storage buckets are created
-- 3. Test RLS policies
-- 4. Begin uploading images through admin panel
-- ============================================================================
