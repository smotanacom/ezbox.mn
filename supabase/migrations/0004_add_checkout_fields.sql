-- Migration: Add checkout fields for user profile and orders
-- Adds name and secondary_phone to users and orders tables

-- Add name and secondary_phone to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(8);

-- Add name and secondary_phone to orders table (capture at order time)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(8);

-- Add comments for documentation
COMMENT ON COLUMN users.name IS 'Full name of the user';
COMMENT ON COLUMN users.secondary_phone IS 'Optional secondary contact phone number (8 digits)';
COMMENT ON COLUMN orders.name IS 'Customer name at time of order';
COMMENT ON COLUMN orders.secondary_phone IS 'Optional secondary contact phone at time of order';

-- Track migration
INSERT INTO schema_migrations (version) VALUES ('0004_add_checkout_fields')
ON CONFLICT (version) DO NOTHING;
