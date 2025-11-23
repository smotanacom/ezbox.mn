-- Add status field to products table
-- Status values: 'active' (published), 'inactive' (hidden), 'draft' (not published)

ALTER TABLE products
ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL;

-- Add check constraint to ensure valid status values
ALTER TABLE products
ADD CONSTRAINT products_status_check
CHECK (status IN ('active', 'inactive', 'draft'));

-- Add schema_migrations entry
INSERT INTO schema_migrations (version)
VALUES ('0009_add_status_to_products');
