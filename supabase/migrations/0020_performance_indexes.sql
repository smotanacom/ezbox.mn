-- Performance optimization indexes
-- Created for common query patterns identified in codebase analysis

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Carts table indexes (for getOrCreateCart queries)
CREATE INDEX IF NOT EXISTS idx_carts_status_user ON carts(status, user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status_session ON carts(status, session_id);

-- History table indexes (for getHistoryForEntity queries)
CREATE INDEX IF NOT EXISTS idx_history_entity_created ON history(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user ON history(changed_by_user_id) WHERE changed_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_history_admin ON history(changed_by_admin_id) WHERE changed_by_admin_id IS NOT NULL;

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Parameters table indexes
CREATE INDEX IF NOT EXISTS idx_parameters_group_status ON parameters(parameter_group_id, status);

-- Special items table indexes
CREATE INDEX IF NOT EXISTS idx_special_items_special ON special_items(special_id);
CREATE INDEX IF NOT EXISTS idx_special_items_product ON special_items(product_id);

-- Product in cart table indexes
CREATE INDEX IF NOT EXISTS idx_product_in_cart_cart ON product_in_cart(cart_id);
CREATE INDEX IF NOT EXISTS idx_product_in_cart_product ON product_in_cart(product_id);
CREATE INDEX IF NOT EXISTS idx_product_in_cart_special ON product_in_cart(special_id) WHERE special_id IS NOT NULL;

-- Custom projects table indexes
CREATE INDEX IF NOT EXISTS idx_custom_projects_status_order ON custom_projects(status, display_order);
CREATE INDEX IF NOT EXISTS idx_custom_project_products_project ON custom_project_products(project_id);
CREATE INDEX IF NOT EXISTS idx_custom_project_products_product ON custom_project_products(product_id);
CREATE INDEX IF NOT EXISTS idx_custom_project_images_project ON custom_project_images(project_id);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- Parameter groups table indexes
CREATE INDEX IF NOT EXISTS idx_parameter_groups_status ON parameter_groups(status);

-- Specials table indexes
CREATE INDEX IF NOT EXISTS idx_specials_status ON specials(status);

-- Product parameter groups table indexes
CREATE INDEX IF NOT EXISTS idx_product_parameter_groups_product ON product_parameter_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_parameter_groups_group ON product_parameter_groups(parameter_group_id);

-- Product images table indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- Product models table indexes
CREATE INDEX IF NOT EXISTS idx_product_models_product ON product_models(product_id);
