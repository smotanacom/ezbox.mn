-- Migration: Add custom_projects tables for showcasing past kitchen projects
-- Projects can be linked to either individual products OR a special offer (not both)

-- Create custom_projects table
CREATE TABLE IF NOT EXISTS custom_projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_path VARCHAR(500),
    special_id INTEGER REFERENCES specials(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_project_images table for gallery images
CREATE TABLE IF NOT EXISTS custom_project_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL REFERENCES custom_projects(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500) NOT NULL,
    medium_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_project_products table for linking products (when not using a special)
CREATE TABLE IF NOT EXISTS custom_project_products (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES custom_projects(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    selected_parameters JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_projects_status ON custom_projects(status);
CREATE INDEX IF NOT EXISTS idx_custom_projects_display_order ON custom_projects(display_order);
CREATE INDEX IF NOT EXISTS idx_custom_project_images_project ON custom_project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_project_products_project ON custom_project_products(project_id);

-- Enable RLS
ALTER TABLE custom_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_project_products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published projects
CREATE POLICY "Allow public read on published custom_projects"
    ON custom_projects
    FOR SELECT
    TO public
    USING (status = 'published');

-- Allow authenticated full access (admin check done at API level)
CREATE POLICY "Allow authenticated all on custom_projects"
    ON custom_projects
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read on project images (for published projects)
CREATE POLICY "Allow public read on custom_project_images"
    ON custom_project_images
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM custom_projects
            WHERE custom_projects.id = custom_project_images.project_id
            AND custom_projects.status = 'published'
        )
    );

-- Allow authenticated full access to project images
CREATE POLICY "Allow authenticated all on custom_project_images"
    ON custom_project_images
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public read on project products (for published projects)
CREATE POLICY "Allow public read on custom_project_products"
    ON custom_project_products
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM custom_projects
            WHERE custom_projects.id = custom_project_products.project_id
            AND custom_projects.status = 'published'
        )
    );

-- Allow authenticated full access to project products
CREATE POLICY "Allow authenticated all on custom_project_products"
    ON custom_project_products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Track migration
INSERT INTO schema_migrations (version) VALUES ('0018_custom_projects');
