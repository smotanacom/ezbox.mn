-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Parameter groups (e.g., "Door Color", "Width", "Height")
CREATE TABLE parameter_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Parameters (e.g., "White", "Black", "60cm", "80cm")
CREATE TABLE parameters (
  id SERIAL PRIMARY KEY,
  parameter_group_id INTEGER REFERENCES parameter_groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0,
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link products to parameter groups with default parameter
CREATE TABLE product_parameter_groups (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  parameter_group_id INTEGER REFERENCES parameter_groups(id) ON DELETE CASCADE,
  default_parameter_id INTEGER REFERENCES parameters(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, parameter_group_id)
);

-- Users table (phone-based with mandatory password)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(8) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  address TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Carts table
CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Products in cart
CREATE TABLE product_in_cart (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_parameters JSONB,
  special_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES carts(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'placed',
  address TEXT NOT NULL,
  phone VARCHAR(8) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Specials (pre-configured product bundles at discount)
CREATE TABLE specials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discounted_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (status IN ('draft', 'available', 'hidden'))
);

-- Special items (products with specific parameters in a special)
CREATE TABLE special_items (
  id SERIAL PRIMARY KEY,
  special_id INTEGER REFERENCES specials(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_parameters JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_parameters_group ON parameters(parameter_group_id);
CREATE INDEX idx_product_param_groups ON product_parameter_groups(product_id);
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_product_in_cart_cart ON product_in_cart(cart_id);
CREATE INDEX idx_orders_cart ON orders(cart_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_special_items_special ON special_items(special_id);

-- Insert the initial migration version
INSERT INTO schema_migrations (version) VALUES ('0001_init');
