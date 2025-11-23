-- Migration: Create admins table
-- Description: Add admin users table for admin portal authentication

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for faster lookups
CREATE INDEX idx_admins_username ON admins(username);

-- Insert into schema migrations tracking
INSERT INTO schema_migrations (version) VALUES ('0007_create_admins_table')
ON CONFLICT (version) DO NOTHING;
