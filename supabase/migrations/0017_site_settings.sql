-- Migration: Add site_settings table for storing site-wide configuration
-- This includes custom design cover image and other site settings

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Insert default settings
INSERT INTO site_settings (key, value, value_type, description)
VALUES
    ('custom_design_cover_image', NULL, 'string', 'Cover image path for custom design section on homepage and /custom page hero')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site_settings
CREATE POLICY "Allow public read on site_settings"
    ON site_settings
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to manage settings (admin check done at API level)
CREATE POLICY "Allow authenticated update on site_settings"
    ON site_settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Track migration
INSERT INTO schema_migrations (version) VALUES ('0017_site_settings');
