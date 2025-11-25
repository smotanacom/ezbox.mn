-- Add snapshot_data column to orders table for storing immutable order details
ALTER TABLE orders
ADD COLUMN snapshot_data JSONB;

-- Add comment explaining the snapshot_data structure
COMMENT ON COLUMN orders.snapshot_data IS 'JSON snapshot of order items at time of purchase. Structure: { items: [{ id, product_id, product_name, product_description, category_name, image_url, quantity, unit_price, line_total, parameters: [{group, name, value}], special_id?, special_name? }], totals: { subtotal, discount, tax, total } }';

-- Add status field to categories table for soft delete
ALTER TABLE categories
ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL;

ALTER TABLE categories
ADD CONSTRAINT categories_status_check
CHECK (status IN ('active', 'inactive', 'draft'));

CREATE INDEX idx_categories_status ON categories(status);

-- Add status field to parameter_groups table for soft delete
ALTER TABLE parameter_groups
ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL;

ALTER TABLE parameter_groups
ADD CONSTRAINT parameter_groups_status_check
CHECK (status IN ('active', 'inactive', 'draft'));

CREATE INDEX idx_parameter_groups_status ON parameter_groups(status);

-- Add status field to parameters table for soft delete
ALTER TABLE parameters
ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL;

ALTER TABLE parameters
ADD CONSTRAINT parameters_status_check
CHECK (status IN ('active', 'inactive', 'draft'));

CREATE INDEX idx_parameters_status ON parameters(status);

-- Add status field to specials table for soft delete
-- Note: specials already has status but it uses different values
-- Check if we need to modify or if current status is sufficient
DO $$
BEGIN
  -- Check if specials table has status column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'specials' AND column_name = 'status'
  ) THEN
    ALTER TABLE specials
    ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL;

    ALTER TABLE specials
    ADD CONSTRAINT specials_status_check
    CHECK (status IN ('active', 'inactive', 'draft', 'available', 'hidden'));

    CREATE INDEX idx_specials_status ON specials(status);
  END IF;
END $$;

-- Update foreign key constraint on product_in_cart to prevent accidental deletion
-- First, drop the existing foreign key constraint
ALTER TABLE product_in_cart
DROP CONSTRAINT IF EXISTS product_in_cart_product_id_fkey;

-- Re-add with RESTRICT instead of CASCADE to prevent deletion of products with cart items
ALTER TABLE product_in_cart
ADD CONSTRAINT product_in_cart_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE RESTRICT;

-- Add index on orders.snapshot_data for potential JSON queries
CREATE INDEX idx_orders_snapshot_data ON orders USING gin(snapshot_data);

-- Add index on products status if not exists
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Insert schema migration record
INSERT INTO schema_migrations (version)
VALUES ('0014_order_snapshot_and_soft_delete');
